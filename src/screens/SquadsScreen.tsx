import { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { TabToStackNavigation } from '../navigation/navigationTypes';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Screen from '../components/ui/Screen';
import NewTeamModal from '../components/teams/NewTeamModal';
import { useTeams } from '../hooks/useTeams';
import { deleteTeamAndPlayers } from '../services/teamsService';
import { useAppSelector } from '../store/hooks';
import { selectCanManageAppData } from '../store/permissions';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';
import type { Team } from '../types/models';

export default function SquadsScreen() {
  const navigation = useNavigation<TabToStackNavigation>();
  const canEdit = useAppSelector(selectCanManageAppData);
  const { teams, loading, error } = useTeams();
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canEdit
        ? () => (
            <Pressable
              onPress={() => {
                setTeamToEdit(null);
                setTeamModalOpen(true);
              }}
              hitSlop={12}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Add team"
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.accent} />
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, canEdit]);

  function closeTeamModal() {
    setTeamModalOpen(false);
    setTeamToEdit(null);
  }

  function openTeam(item: Team) {
    navigation.navigate('TeamDetail', { teamId: item.id, teamName: item.name });
  }

  function openEditTeam(item: Team) {
    setTeamToEdit(item);
    setTeamModalOpen(true);
  }

  function confirmDeleteTeam(item: Team) {
    Alert.alert(
      'Delete team',
      `Delete “${item.name}” and all players on this roster? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTeamAndPlayers(item.id).catch(() => {
              Alert.alert('Could not delete', 'Check your connection and Firestore rules.');
            });
          },
        },
      ]
    );
  }

  function renderItem({ item }: { item: Team }) {
    return (
      <Card style={styles.teamCard} padded={false}>
        <View style={styles.teamOuter}>
          <Pressable
            onPress={() => openTeam(item)}
            style={({ pressed }) => [styles.teamMain, pressed && styles.teamPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.name}`}
          >
            <View style={styles.badge}>
              <AppText variant="caption" style={styles.badgeText}>
                {item.shortCode || '—'}
              </AppText>
            </View>
            <View style={styles.teamMeta}>
              <AppText variant="title3">{item.name}</AppText>
              <AppText variant="caption">Squad · tap for roster</AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
          {canEdit ? (
            <View style={styles.teamActions}>
              <Pressable
                onPress={() => openEditTeam(item)}
                style={styles.iconHit}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.name}`}
              >
                <Ionicons name="create-outline" size={22} color={colors.accent} />
              </Pressable>
              <Pressable
                onPress={() => confirmDeleteTeam(item)}
                style={styles.iconHit}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.name}`}
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
        <AppText variant="title1" style={styles.heading}>
          Squads
        </AppText>
        <AppText variant="callout" style={styles.intro}>
          {canEdit
            ? 'Manage teams, edit details, or delete a squad. Open a team to manage players.'
            : 'View teams and open a squad to browse the roster.'}
        </AppText>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
            <AppText variant="callout" style={styles.loadingLabel}>
              Loading teams…
            </AppText>
          </View>
        ) : error ? (
          <Card>
            <AppText variant="title3" color="danger">
              Could not load teams
            </AppText>
            <AppText variant="callout" style={{ marginTop: spacing.sm }}>
              {error}
            </AppText>
            <AppText variant="caption" style={{ marginTop: spacing.md }}>
              Check Firestore rules allow reads for signed-in users, then pull to reopen the
              screen.
            </AppText>
          </Card>
        ) : (
          <FlatList
            style={styles.list}
            data={teams}
            keyExtractor={(t) => t.id}
            renderItem={renderItem}
            scrollEnabled={teams.length > 4}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            ListEmptyComponent={
              <EmptyState
                title="No teams yet"
                description={
                  canEdit
                    ? 'Create two teams (for example Team A and Team B) to start scheduling matches.'
                    : 'Ask staff to add teams from the app (after signing in) or from the console.'
                }
                action={
                  canEdit
                    ? {
                        label: 'Add team',
                        onPress: () => {
                          setTeamToEdit(null);
                          setTeamModalOpen(true);
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
      <NewTeamModal
        visible={teamModalOpen}
        teamToEdit={teamToEdit}
        onClose={closeTeamModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: spacing.sm },
  intro: { marginBottom: spacing.xl },
  loading: {
    paddingVertical: spacing.xxxl * 2,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingLabel: { marginTop: spacing.sm },
  listContent: { paddingBottom: spacing.xxxl },
  teamCard: { overflow: 'hidden' },
  teamOuter: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  teamMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    gap: spacing.md,
  },
  teamPressed: { opacity: 0.85 },
  teamActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
    gap: spacing.xs,
  },
  iconHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  badgeText: { fontWeight: '700', color: colors.text },
  teamMeta: { flex: 1 },
  list: { flex: 1 },
  headerBtn: {
    marginRight: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
