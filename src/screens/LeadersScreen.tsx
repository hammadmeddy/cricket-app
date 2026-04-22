import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Screen from '../components/ui/Screen';
import { usePlayerBattingStats } from '../hooks/usePlayerBattingStats';
import { useTeamStandings } from '../hooks/useTeamStandings';
import type { TeamStanding } from '../types/models';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

function formatRecord(s: TeamStanding): string {
  const parts: string[] = [];
  if (s.wins) {
    parts.push(`${s.wins}W`);
  }
  if (s.losses) {
    parts.push(`${s.losses}L`);
  }
  if (s.ties) {
    parts.push(`${s.ties}T`);
  }
  return parts.length ? parts.join(' · ') : '—';
}

export default function LeadersScreen() {
  const { standings, loading: loadTeams, error: errTeams, completedCount } = useTeamStandings();
  const { stats, bowlingStats, loading: loadBat, error: errBat } = usePlayerBattingStats();
  const loading = loadTeams || loadBat;
  const error = errTeams || errBat || null;
  const withResults = standings.filter((s) => s.played > 0);

  return (
    <Screen scroll={false}>
      <AppText variant="title1" style={styles.heading}>
        Leaderboards
      </AppText>
      <AppText variant="callout" style={styles.intro}>
        Team points from completed matches. Batting uses striker-linked balls; bowling uses balls
        where a bowler is set on the scorecard.
      </AppText>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
          <AppText variant="callout" style={styles.loadingLabel}>
            Loading…
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
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.metaCard}>
            <AppText variant="label">Completed matches</AppText>
            <AppText variant="title3" style={styles.metaValue}>
              {completedCount} in database
            </AppText>
            <AppText variant="caption" style={styles.metaHint}>
              Finish a fixture on the scorecard to add a result here.
            </AppText>
          </Card>

          <AppText variant="title2" style={styles.sectionTitle}>
            Teams
          </AppText>
          {standings.length === 0 ? (
            <EmptyState
              icon="podium-outline"
              title="No teams yet"
              description="Create squads first, then complete matches to build the table."
            />
          ) : (
            standings.map((item) => (
              <Card key={item.teamId} style={styles.rowCard} padded={false}>
                <View style={styles.row}>
                  <View style={styles.rankCol}>
                    <AppText variant="title2" style={styles.rankNum}>
                      {item.played > 0 ? item.rank : '—'}
                    </AppText>
                  </View>
                  <View style={styles.mainCol}>
                    <AppText variant="title3" numberOfLines={1}>
                      {item.name}
                    </AppText>
                    {item.shortCode ? (
                      <AppText variant="caption" style={styles.code}>
                        {item.shortCode}
                      </AppText>
                    ) : null}
                    <AppText variant="callout" style={styles.record}>
                      {item.played > 0 ? formatRecord(item) : 'No completed matches'}
                    </AppText>
                  </View>
                  <View style={styles.statsCol}>
                    <AppText variant="caption" style={styles.statsLabel}>
                      Pts
                    </AppText>
                    <AppText variant="title3" style={styles.statsValue}>
                      {item.points}
                    </AppText>
                    {item.played > 0 ? (
                      <AppText variant="caption" style={styles.winPct}>
                        {item.winPct}% won
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </Card>
            ))
          )}

          {withResults.length === 0 && standings.length > 0 ? (
            <AppText variant="caption" style={styles.footerNote}>
              Complete at least one match with a final score to rank teams by points.
            </AppText>
          ) : null}

          <AppText variant="title2" style={[styles.sectionTitle, styles.sectionSpacer]}>
            Batting (tracked)
          </AppText>
          {stats.length === 0 ? (
            <AppText variant="callout" style={styles.muted}>
              No striker-linked balls in completed matches yet. Set batters on the scorecard so
              each delivery records who faced.
            </AppText>
          ) : (
            stats.map((p, idx) => (
              <Card key={p.playerId} style={styles.rowCard} padded={false}>
                <View style={styles.row}>
                  <View style={styles.rankCol}>
                    <AppText variant="title2" style={styles.rankNum}>
                      {idx + 1}
                    </AppText>
                  </View>
                  <View style={styles.mainCol}>
                    <AppText variant="title3" numberOfLines={1}>
                      {p.name}
                    </AppText>
                    <AppText variant="caption" style={styles.code}>
                      {p.balls} balls
                    </AppText>
                  </View>
                  <View style={styles.statsCol}>
                    <AppText variant="caption" style={styles.statsLabel}>
                      Runs
                    </AppText>
                    <AppText variant="title3" style={styles.statsValue}>
                      {p.runs}
                    </AppText>
                  </View>
                </View>
              </Card>
            ))
          )}

          <AppText variant="title2" style={[styles.sectionTitle, styles.sectionSpacer]}>
            Bowling (tracked)
          </AppText>
          {bowlingStats.length === 0 ? (
            <AppText variant="callout" style={styles.muted}>
              No bowler-linked balls in completed matches yet. Set the bowler on the scorecard for
              each over.
            </AppText>
          ) : (
            bowlingStats.map((p, idx) => (
              <Card key={`b-${p.playerId}`} style={styles.rowCard} padded={false}>
                <View style={styles.row}>
                  <View style={styles.rankCol}>
                    <AppText variant="title2" style={styles.rankNum}>
                      {idx + 1}
                    </AppText>
                  </View>
                  <View style={styles.mainCol}>
                    <AppText variant="title3" numberOfLines={1}>
                      {p.name}
                    </AppText>
                    <AppText variant="caption" style={styles.code}>
                      {p.balls} balls · {p.runsConceded} runs
                    </AppText>
                  </View>
                  <View style={styles.statsCol}>
                    <AppText variant="caption" style={styles.statsLabel}>
                      Wkts
                    </AppText>
                    <AppText variant="title3" style={styles.statsValue}>
                      {p.wickets}
                    </AppText>
                  </View>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: spacing.sm },
  intro: { marginBottom: spacing.lg, color: colors.textMuted },
  muted: { color: colors.textMuted, marginBottom: spacing.lg },
  loading: {
    paddingVertical: spacing.xxxl * 2,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingLabel: { color: colors.textMuted },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xxxl },
  metaCard: { marginBottom: spacing.lg },
  metaValue: { marginTop: spacing.sm },
  metaHint: { marginTop: spacing.xs, color: colors.textMuted },
  sectionTitle: { marginBottom: spacing.md },
  sectionSpacer: { marginTop: spacing.xl },
  rowCard: { overflow: 'hidden', marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rankCol: {
    width: 40,
    alignItems: 'center',
  },
  rankNum: { color: colors.accent },
  mainCol: { flex: 1, minWidth: 0 },
  code: { marginTop: 2, color: colors.textMuted },
  record: { marginTop: spacing.xs, color: colors.textMuted },
  statsCol: { alignItems: 'flex-end' },
  statsLabel: { color: colors.textMuted },
  statsValue: { marginTop: 2 },
  winPct: { marginTop: spacing.xs, color: colors.textMuted },
  footerNote: { marginTop: spacing.lg, color: colors.textMuted, textAlign: 'center' },
});
