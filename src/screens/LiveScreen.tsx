import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Screen from '../components/ui/Screen';
import type { TabToStackNavigation } from '../navigation/navigationTypes';
import { battingSideForInnings, teamNameForSide } from '../lib/matchInnings';
import { subscribeLiveMatches } from '../services/matchesService';
import { useAppSelector } from '../store/hooks';
import { selectCanManageAppData } from '../store/permissions';
import type { Match } from '../types/models';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export default function LiveScreen() {
  const navigation = useNavigation<TabToStackNavigation>();
  const canManage = useAppSelector(selectCanManageAppData);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeLiveMatches(
      (list) => {
        setMatches(list);
        setError(null);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  function openScoring(m: Match) {
    navigation.navigate('MatchScoring', {
      matchId: m.id,
      headerTitle: `${m.teamAName} vs ${m.teamBName}`,
    });
  }

  return (
    <Screen scroll={false}>
      <AppText variant="title1" style={styles.heading}>
        Live
      </AppText>
      <AppText variant="callout" style={styles.body}>
        Matches in progress update in real time. Tap a fixture to open the scorecard.
      </AppText>
      {!canManage ? (
        <Card style={styles.notice}>
          <AppText variant="title3" style={{ marginBottom: spacing.sm }}>
            Spectator mode
          </AppText>
          <AppText variant="callout">
            Sign in with the club email to record runs and wickets. You can still follow the
            scorecard on the next screen.
          </AppText>
        </Card>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
          <AppText variant="callout" style={styles.loadingLabel}>
            Looking for live matches…
          </AppText>
        </View>
      ) : error ? (
        <Card>
          <AppText variant="title3" color="danger">
            Could not load
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
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon="radio-outline"
              title="Nothing live"
              description="When staff starts scoring a scheduled match, it will appear here automatically."
            />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => openScoring(item)} accessibilityRole="button">
              <Card style={styles.matchCard} padded={false}>
                <View style={styles.row}>
                  <View style={styles.main}>
                    <AppText variant="title3">
                      {item.teamAName} vs {item.teamBName}
                    </AppText>
                    {item.scoreboard ? (
                      <AppText variant="callout" style={styles.scoreHint}>
                        {teamNameForSide(item, battingSideForInnings(item.scoreboard.inn1Side ?? 'A', 1))}{' '}
                        {item.scoreboard.i1Runs}/{item.scoreboard.i1Wk} ·{' '}
                        {teamNameForSide(item, battingSideForInnings(item.scoreboard.inn1Side ?? 'A', 2))}{' '}
                        {item.scoreboard.i2Runs}/{item.scoreboard.i2Wk}
                        {item.scoreboard.phase === 'inn1' ? ' (chase pending)' : ''}
                      </AppText>
                    ) : (
                      <AppText variant="callout" style={styles.scoreHint}>
                        Scorecard loading…
                      </AppText>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
                </View>
              </Card>
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: spacing.sm },
  body: { marginBottom: spacing.lg },
  notice: { marginBottom: spacing.lg, borderColor: colors.warning, backgroundColor: colors.surfaceMuted },
  loading: {
    paddingVertical: spacing.xxxl * 2,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingLabel: { color: colors.textMuted },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xxxl },
  matchCard: { overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  main: { flex: 1 },
  scoreHint: { marginTop: spacing.xs, color: colors.textMuted },
});
