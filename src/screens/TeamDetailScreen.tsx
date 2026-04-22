import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Screen from '../components/ui/Screen';
import NewPlayerModal from '../components/players/NewPlayerModal';
import NewTeamModal from '../components/teams/NewTeamModal';
import { usePlayers } from '../hooks/usePlayers';
import { formatPlayerRole } from '../lib/playerUi';
import { deletePlayerRecord } from '../services/playersService';
import { deleteTeamAndPlayers, getTeamById } from '../services/teamsService';
import { useAppSelector } from '../store/hooks';
import { selectCanManageAppData } from '../store/permissions';
import type { RootStackParamList } from '../navigation/types';
import type { Player, Team } from '../types/models';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamDetail'>;

export default function TeamDetailScreen({ navigation, route }: Props) {
  const { teamId, teamName } = route.params;
  const canEdit = useAppSelector(selectCanManageAppData);
  const { players, loading, error } = usePlayers(teamId);
  const [teamRecord, setTeamRecord] = useState<Team | null>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  const refreshTeam = useCallback(() => {
    getTeamById(teamId).then((t) => {
      if (t) {
        setTeamRecord(t);
        if (t.name !== teamName) {
          navigation.setParams({ teamName: t.name });
        }
      }
    });
  }, [teamId, teamName, navigation]);

  useFocusEffect(
    useCallback(() => {
      refreshTeam();
    }, [refreshTeam])
  );

  const openTeamMenu = useCallback(() => {
    if (!teamRecord) {
      Alert.alert('One moment', 'Team details are still loading. Try again in a second.');
      return;
    }
    const label = teamRecord.name;
    Alert.alert(
      label,
      'Team actions',
      [
        {
          text: 'Edit team',
          onPress: () => setTeamModalOpen(true),
        },
        {
          text: 'Delete team',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete team',
              `Delete “${label}” and every player on this roster? This cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    deleteTeamAndPlayers(teamId)
                      .then(() => navigation.goBack())
                      .catch(() => {
                        Alert.alert(
                          'Could not delete',
                          'Check your connection and Firestore rules.'
                        );
                      });
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }, [teamRecord, teamName, teamId, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canEdit
        ? () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={openTeamMenu}
                hitSlop={10}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel="Team options"
              >
                <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={() => {
                  setPlayerToEdit(null);
                  setPlayerModalOpen(true);
                }}
                hitSlop={10}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel="Add player"
              >
                <Ionicons name="person-add-outline" size={24} color={colors.accent} />
              </Pressable>
            </View>
          )
        : undefined,
    });
  }, [navigation, canEdit, openTeamMenu]);

  function closePlayerModal() {
    setPlayerModalOpen(false);
    setPlayerToEdit(null);
  }

  function closeTeamModal() {
    setTeamModalOpen(false);
    refreshTeam();
  }

  function confirmDelete(player: Player) {
    Alert.alert(
      'Remove player',
      `Remove ${player.name} from ${teamName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deletePlayerRecord(player.id).catch(() => {
              Alert.alert('Could not remove', 'Check your connection and Firestore rules.');
            });
          },
        },
      ],
      { cancelable: true }
    );
  }

  function renderItem({ item }: { item: Player }) {
    return (
      <Card style={styles.playerCard} padded={false}>
        <View style={styles.playerRow}>
          <View style={styles.playerMain}>
            <AppText variant="title3">{item.name}</AppText>
            <View style={styles.rolePill}>
              <AppText variant="caption" style={styles.rolePillText}>
                {formatPlayerRole(item.role)}
              </AppText>
            </View>
          </View>
          {canEdit ? (
            <View style={styles.playerActions}>
              <Pressable
                onPress={() => {
                  setPlayerToEdit(item);
                  setPlayerModalOpen(true);
                }}
                style={styles.iconHit}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.name}`}
              >
                <Ionicons name="create-outline" size={22} color={colors.accent} />
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(item)}
                style={styles.iconHit}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name}`}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ) : null}
        </View>
      </Card>
    );
  }

  return (
    <>
      <Screen scroll={false}>
        <AppText variant="callout" style={styles.intro}>
          Roster for match sheets and stats. Roles drive default batting and bowling slots later.
        </AppText>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
            <AppText variant="callout" style={styles.loadingLabel}>
              Loading roster…
            </AppText>
          </View>
        ) : error ? (
          <Card>
            <AppText variant="title3" color="danger">
              Could not load players
            </AppText>
            <AppText variant="callout" style={{ marginTop: spacing.sm }}>
              {error}
            </AppText>
          </Card>
        ) : (
          <FlatList
            style={styles.list}
            data={players}
            keyExtractor={(p) => p.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            ListEmptyComponent={
              <EmptyState
                icon="shirt-outline"
                title="No players yet"
                description={
                  canEdit
                    ? 'Add everyone who plays for this squad. Edit or remove players anytime.'
                    : 'Players will appear here once staff adds the roster.'
                }
                action={
                  canEdit
                    ? {
                        label: 'Add player',
                        onPress: () => {
                          setPlayerToEdit(null);
                          setPlayerModalOpen(true);
                        },
                      }
                    : undefined
                }
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Screen>
      <NewPlayerModal
        visible={playerModalOpen}
        teamId={teamId}
        playerToEdit={playerToEdit}
        onClose={closePlayerModal}
      />
      <NewTeamModal
        visible={teamModalOpen}
        teamToEdit={teamRecord}
        onClose={closeTeamModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.lg },
  loading: {
    paddingVertical: spacing.xxxl * 2,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingLabel: { marginTop: spacing.sm },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xxxl },
  playerCard: { overflow: 'hidden' },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  playerMain: { flex: 1 },
  playerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rolePillText: { fontWeight: '600', color: colors.textMuted },
  headerActions: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.xs },
  headerBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
