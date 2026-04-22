import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
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
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Screen from '../components/ui/Screen';
import NewMatchModal from '../components/matches/NewMatchModal';
import NewDoubleWicketResultModal from '../components/series/NewDoubleWicketResultModal';
import { useMatches } from '../hooks/useMatches';
import { formatMatchStatus } from '../lib/matchUi';
import { formatSeriesFormat } from '../lib/seriesUi';
import { deleteMatchRecord } from '../services/matchesService';
import {
  deleteDoubleWicketResult,
  subscribeDoubleWicketResults,
} from '../services/doubleWicketService';
import { deleteSeriesCascade, getSeriesById } from '../services/seriesService';
import { useAppSelector } from '../store/hooks';
import { selectCanManageAppData } from '../store/permissions';
import type { RootStackParamList } from '../navigation/types';
import type { DoubleWicketMatchResult, Match, Series } from '../types/models';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'SeriesDetail'>;

function canEditFixture(m: Match): boolean {
  return m.status === 'scheduled' || m.status === 'toss';
}

function canDeleteFixture(m: Match): boolean {
  return m.status !== 'live' && m.status !== 'completed';
}

export default function SeriesDetailScreen({ navigation, route }: Props) {
  const { seriesId, seriesName } = route.params;
  const canEdit = useAppSelector(selectCanManageAppData);
  const [series, setSeries] = useState<Series | null>(null);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [dwResults, setDwResults] = useState<DoubleWicketMatchResult[]>([]);
  const [dwModalOpen, setDwModalOpen] = useState(false);
  const { matches, loading, error } = useMatches(seriesId);

  const refreshSeries = useCallback(() => {
    getSeriesById(seriesId).then((s) => {
      if (s) {
        setSeries(s);
        if (s.name !== seriesName) {
          navigation.setParams({ seriesName: s.name });
        }
      }
    });
  }, [seriesId, seriesName, navigation]);

  useFocusEffect(
    useCallback(() => {
      refreshSeries();
    }, [refreshSeries])
  );

  useEffect(() => {
    if (!series || series.format !== 'double-wicket') {
      setDwResults([]);
      return;
    }
    const unsub = subscribeDoubleWicketResults(
      seriesId,
      setDwResults,
      () => setDwResults([])
    );
    return unsub;
  }, [seriesId, series?.format]);

  const openSeriesMenu = useCallback(() => {
    if (!series) {
      Alert.alert('One moment', 'Series details are still loading.');
      return;
    }
    Alert.alert(
      series.name,
      'Series actions',
      [
        {
          text: 'Delete series',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete series',
              `Delete “${series.name}” and all scheduled matches in it? This cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    deleteSeriesCascade(seriesId)
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
  }, [series, seriesId, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canEdit
        ? () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={openSeriesMenu}
                hitSlop={10}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel="Series options"
              >
                <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!series) {
                    Alert.alert('One moment', 'Series details are still loading.');
                    return;
                  }
                  setMatchModalOpen(true);
                }}
                hitSlop={10}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel="Schedule match"
              >
                <Ionicons name="add-circle-outline" size={26} color={colors.accent} />
              </Pressable>
            </View>
          )
        : undefined,
    });
  }, [navigation, canEdit, openSeriesMenu]);

  function confirmDeleteMatch(m: Match) {
    if (!canDeleteFixture(m)) {
      Alert.alert(
        'Cannot delete',
        'Live or completed fixtures cannot be removed here. Use the scorecard to finish the match, or ask a developer to clean up test data.'
      );
      return;
    }
    Alert.alert(
      'Delete fixture',
      `Remove “${m.teamAName} vs ${m.teamBName}” from this series? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMatchRecord(m.id).catch(() => {
              Alert.alert('Could not delete', 'Check your connection and Firestore rules.');
            });
          },
        },
      ],
      { cancelable: true }
    );
  }

  function formatWhen(m: Match): string {
    if (!m.scheduledAt) {
      return 'Date TBC';
    }
    try {
      return m.scheduledAt.toDate().toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Date TBC';
    }
  }

  function openMatchScoring(item: Match) {
    navigation.navigate('MatchScoring', {
      matchId: item.id,
      headerTitle: `${item.teamAName} vs ${item.teamBName}`,
    });
  }

  function confirmDeleteDw(row: DoubleWicketMatchResult) {
    if (!canEdit) {
      return;
    }
    Alert.alert(
      'Remove result',
      `Remove place ${row.place}: ${row.player1Name} + ${row.player2Name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDoubleWicketResult(seriesId, row.id).catch(() => {
              Alert.alert('Could not delete', 'Check your connection and Firestore rules.');
            });
          },
        },
      ]
    );
  }

  const nextDwPlace =
    dwResults.length === 0 ? 1 : Math.max(...dwResults.map((r) => r.place), 0) + 1;

  function renderItem({ item }: { item: Match }) {
    return (
      <Card style={styles.matchCard} padded={false}>
        <View style={styles.matchRow}>
          <Pressable
            onPress={() => openMatchScoring(item)}
            style={({ pressed }) => [styles.matchMain, pressed && styles.matchMainPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Open scorecard, ${item.teamAName} versus ${item.teamBName}`}
          >
            <AppText variant="title3">
              {item.teamAName} vs {item.teamBName}
            </AppText>
            <AppText variant="callout" style={styles.when}>
              {formatWhen(item)}
              {item.venue ? ` · ${item.venue}` : ''}
            </AppText>
            <View style={styles.statusPill}>
              <AppText variant="caption" style={styles.statusText}>
                {formatMatchStatus(item.status)}
              </AppText>
            </View>
          </Pressable>
          {canEdit ? (
            <View style={styles.fixtureActions}>
              {canEditFixture(item) ? (
                <Pressable
                  onPress={() => {
                    if (!series) {
                      Alert.alert('One moment', 'Series details are still loading.');
                      return;
                    }
                    setEditingMatch(item);
                  }}
                  style={styles.iconHit}
                  accessibilityRole="button"
                  accessibilityLabel="Edit fixture"
                >
                  <Ionicons name="create-outline" size={22} color={colors.accent} />
                </Pressable>
              ) : null}
              {canDeleteFixture(item) ? (
                <Pressable
                  onPress={() => confirmDeleteMatch(item)}
                  style={styles.iconHit}
                  accessibilityRole="button"
                  accessibilityLabel="Delete fixture"
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </Card>
    );
  }

  return (
    <>
      <Screen scroll={false}>
        {series ? (
          <Card style={styles.metaCard}>
            <AppText variant="label">Format</AppText>
            <AppText variant="title3" style={styles.metaLine}>
              {formatSeriesFormat(series.format)} · {series.oversPerInnings} overs
            </AppText>
            <AppText variant="callout" style={styles.metaSub}>
              {series.teamAName} vs {series.teamBName}
            </AppText>
          </Card>
        ) : null}

        {series?.format === 'double-wicket' ? (
          <Card style={styles.dwSeriesCard} padded={false}>
            <View style={styles.dwSeriesHeader}>
              <View style={{ flex: 1 }}>
                <AppText variant="title3">Double wicket results</AppText>
                <AppText variant="caption" style={styles.dwSeriesHint}>
                  Stored in Firestore for this series. Optional: still schedule fixtures below for
                  friendlies.
                </AppText>
              </View>
              {canEdit ? (
                <Button
                  label="Add"
                  variant="secondary"
                  onPress={() => setDwModalOpen(true)}
                  accessibilityLabel="Add double-wicket result"
                />
              ) : null}
            </View>
            {dwResults.length === 0 ? (
              <AppText variant="callout" style={styles.dwEmpty}>
                No pairs recorded yet.
              </AppText>
            ) : (
              dwResults.map((row, i) => (
                <View
                  key={row.id}
                  style={[styles.dwSeriesRow, i < dwResults.length - 1 && styles.dwSeriesRowBorder]}
                >
                  <AppText variant="caption" style={styles.dwSeriesPlace}>
                    {row.place}
                  </AppText>
                  <View style={styles.dwSeriesMain}>
                    <AppText variant="callout" style={styles.dwPair}>
                      {row.player1Name} + {row.player2Name}
                    </AppText>
                    <AppText variant="caption" style={styles.dwDateSmall}>
                      {row.dateLabel}
                      {row.notes ? ` · ${row.notes}` : ''}
                    </AppText>
                  </View>
                  {canEdit ? (
                    <Pressable
                      onPress={() => confirmDeleteDw(row)}
                      hitSlop={8}
                      style={styles.iconHit}
                      accessibilityRole="button"
                      accessibilityLabel="Delete double-wicket result"
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  ) : null}
                </View>
              ))
            )}
          </Card>
        ) : null}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
            <AppText variant="callout" style={styles.loadingLabel}>
              Loading matches…
            </AppText>
          </View>
        ) : error ? (
          <Card>
            <AppText variant="title3" color="danger">
              Could not load matches
            </AppText>
            <AppText variant="callout" style={{ marginTop: spacing.sm }}>
              {error}
            </AppText>
          </Card>
        ) : (
          <FlatList
            style={styles.list}
            data={matches}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            ListEmptyComponent={
              <EmptyState
                icon="calendar-outline"
                title="No matches yet"
                description={
                  series?.format === 'double-wicket'
                    ? canEdit
                      ? 'Optional: add fixtures for exhibition games, or use only double-wicket results above.'
                      : 'Fixtures are optional for this tournament type.'
                    : canEdit
                      ? 'Schedule the first fixture with date and optional venue.'
                      : 'Matches will show here once staff schedules them.'
                }
                action={
                  canEdit
                    ? {
                        label: 'Schedule match',
                        onPress: () => {
                          if (!series) {
                            Alert.alert('One moment', 'Series details are still loading.');
                            return;
                          }
                          setMatchModalOpen(true);
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
      <NewMatchModal
        visible={Boolean(series) && (matchModalOpen || editingMatch !== null)}
        series={series}
        matchToEdit={editingMatch}
        onClose={() => {
          setMatchModalOpen(false);
          setEditingMatch(null);
        }}
      />
      <NewDoubleWicketResultModal
        visible={dwModalOpen && Boolean(series)}
        seriesId={seriesId}
        suggestedPlace={nextDwPlace}
        onClose={() => setDwModalOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  dwSeriesCard: { marginBottom: spacing.lg, overflow: 'hidden' },
  dwSeriesHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  dwSeriesHint: { marginTop: spacing.xs, color: colors.textMuted },
  dwEmpty: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, color: colors.textMuted },
  dwSeriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dwSeriesRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  dwSeriesPlace: {
    width: 28,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dwSeriesMain: { flex: 1, minWidth: 0 },
  dwPair: { fontWeight: '600' },
  dwDateSmall: { marginTop: 4, color: colors.textMuted },
  metaCard: { marginBottom: spacing.lg },
  metaLine: { marginTop: spacing.sm, marginBottom: spacing.xs },
  metaSub: { marginTop: spacing.xs },
  loading: {
    paddingVertical: spacing.xxxl * 2,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingLabel: { marginTop: spacing.sm },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xxxl },
  matchCard: { overflow: 'hidden' },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  matchMain: { flex: 1 },
  matchMainPressed: { opacity: 0.88 },
  when: { marginTop: spacing.xs },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: { fontWeight: '600', color: colors.textMuted },
  fixtureActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.xs },
  headerBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
