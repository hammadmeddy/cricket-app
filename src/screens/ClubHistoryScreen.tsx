import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import Screen from '../components/ui/Screen';
import {
  doubleWicketRowsForPlayer,
  economyFromBalls,
  legacyMilestoneCount,
  legacyTestBattingForPlayer,
  legacyTestBowlingForPlayer,
  liveBattingForPlayer,
  liveBowlingForPlayer,
  partnerFrequencyForPlayer,
  strikeRate,
  uniquePlayerNamesFromDoubleWicketHall,
} from '../lib/clubHistoryPlayerInsights';
import { useClubHistoryLiveStats } from '../hooks/useClubHistoryLiveStats';
import { useClubLegacy } from '../hooks/useClubLegacy';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';

type HistoryTab = 'summary' | 'doubleWicket' | 'records';

const TABS: { id: HistoryTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'doubleWicket', label: 'Double wicket' },
  { id: 'records', label: 'Records' },
];

export default function ClubHistoryScreen() {
  const L = useClubLegacy();
  const live = useClubHistoryLiveStats();
  const [tab, setTab] = useState<HistoryTab>('summary');
  const [spotlightPlayer, setSpotlightPlayer] = useState('');
  const [dwTextFilter, setDwTextFilter] = useState('');

  const liveStandingsRows = live.standings.filter((s) => s.played > 0);
  const topBatting = live.batting.slice(0, 10);
  const topBowling = live.bowling.slice(0, 10);
  const totalsTeamALabel = L.eras[0]?.sideA.label ?? 'Team-A';
  const totalsTeamBLabel = L.eras[0]?.sideB.label ?? 'Team-B';

  const dwHallNames = useMemo(
    () => uniquePlayerNamesFromDoubleWicketHall(L.doubleWicketHall),
    [L.doubleWicketHall]
  );

  const filteredDwHall = useMemo(() => {
    let rows = spotlightPlayer
      ? doubleWicketRowsForPlayer(L.doubleWicketHall, spotlightPlayer)
      : [...L.doubleWicketHall];
    const q = dwTextFilter.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.pairLabel.toLowerCase().includes(q) || r.dateLabel.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [L.doubleWicketHall, spotlightPlayer, dwTextFilter]);

  const partnersForSpotlight = useMemo(
    () => partnerFrequencyForPlayer(L.doubleWicketHall, spotlightPlayer),
    [L.doubleWicketHall, spotlightPlayer]
  );

  const dwAppearances = useMemo(
    () =>
      spotlightPlayer ? doubleWicketRowsForPlayer(L.doubleWicketHall, spotlightPlayer).length : 0,
    [L.doubleWicketHall, spotlightPlayer]
  );

  const legacyBat = useMemo(
    () => (spotlightPlayer ? legacyTestBattingForPlayer(L, spotlightPlayer) : null),
    [L, spotlightPlayer]
  );
  const legacyBowl = useMemo(
    () => (spotlightPlayer ? legacyTestBowlingForPlayer(L, spotlightPlayer) : null),
    [L, spotlightPlayer]
  );
  const fiftiesN = useMemo(
    () => (spotlightPlayer ? legacyMilestoneCount(L.fifties, spotlightPlayer) : null),
    [L.fifties, spotlightPlayer]
  );
  const hundredsN = useMemo(
    () => (spotlightPlayer ? legacyMilestoneCount(L.hundreds, spotlightPlayer) : null),
    [L.hundreds, spotlightPlayer]
  );
  const liveBatRow = useMemo(
    () => (spotlightPlayer ? liveBattingForPlayer(live.batting, spotlightPlayer) : null),
    [live.batting, spotlightPlayer]
  );
  const liveBowlRow = useMemo(
    () => (spotlightPlayer ? liveBowlingForPlayer(live.bowling, spotlightPlayer) : null),
    [live.bowling, spotlightPlayer]
  );

  const spotlightSummaryCard =
    spotlightPlayer ? (
      <Card style={styles.spotlightCard}>
        <AppText variant="title3" style={styles.spotlightTitle}>
          {spotlightPlayer}
        </AppText>

        <AppText variant="label" style={styles.spotlightBlockLabel}>
          Double wicket (manual hall)
        </AppText>
        <AppText variant="callout" style={styles.spotlightLine}>
          Listed tournaments: {dwAppearances}
        </AppText>
        {partnersForSpotlight.length > 0 ? (
          <View style={styles.spotlightPartners}>
            <AppText variant="caption" style={styles.spotlightMuted}>
              Partners (top)
            </AppText>
            {partnersForSpotlight.slice(0, 5).map((p) => (
              <AppText key={p.partner} variant="callout" style={styles.spotlightLine}>
                {p.partner} · {p.count}
              </AppText>
            ))}
          </View>
        ) : null}

        {legacyBat || legacyBowl ? (
          <>
            <AppText variant="label" style={styles.spotlightBlockLabel}>
              Test series (historical table)
            </AppText>
            {legacyBat ? (
              <AppText variant="callout" style={styles.spotlightLine}>
                Batting {legacyBat.runs} runs · {legacyBat.innings} inns · best {legacyBat.best}
              </AppText>
            ) : null}
            {legacyBowl ? (
              <AppText variant="callout" style={styles.spotlightLine}>
                Bowling {legacyBowl.wickets} wkts · {legacyBowl.innings} inns · best {legacyBowl.best}
              </AppText>
            ) : null}
          </>
        ) : null}

        {fiftiesN != null || hundredsN != null ? (
          <>
            <AppText variant="label" style={styles.spotlightBlockLabel}>
              Milestones (historical)
            </AppText>
            {fiftiesN != null ? (
              <AppText variant="callout" style={styles.spotlightLine}>
                50s: {fiftiesN}
              </AppText>
            ) : null}
            {hundredsN != null ? (
              <AppText variant="callout" style={styles.spotlightLine}>
                100s: {hundredsN}
              </AppText>
            ) : null}
          </>
        ) : null}

        {liveBatRow || liveBowlRow ? (
          <>
            <AppText variant="label" style={styles.spotlightBlockLabel}>
              Completed matches (this app)
            </AppText>
            {liveBatRow ? (
              <AppText variant="callout" style={styles.spotlightLine}>
                Batting {liveBatRow.runs} runs · {liveBatRow.balls} balls · SR{' '}
                {strikeRate(liveBatRow.balls, liveBatRow.runs)}
              </AppText>
            ) : null}
            {liveBowlRow ? (
              <AppText variant="callout" style={styles.spotlightLine}>
                Bowling {liveBowlRow.wickets} wkts · {liveBowlRow.runsConceded} runs ·{' '}
                {liveBowlRow.balls} balls · econ {economyFromBalls(liveBowlRow.balls, liveBowlRow.runsConceded)}
              </AppText>
            ) : null}
          </>
        ) : null}
      </Card>
    ) : null;

  const playerChipBar = (
    <View style={styles.chipBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScrollContent}
      >
        <Pressable
          onPress={() => setSpotlightPlayer('')}
          style={[styles.chip, spotlightPlayer === '' && styles.chipActive]}
        >
          <AppText
            variant="callout"
            numberOfLines={1}
            style={[styles.chipText, spotlightPlayer === '' && styles.chipTextActive]}
          >
            All
          </AppText>
        </Pressable>
        {dwHallNames.map((name) => {
          const on = spotlightPlayer === name;
          return (
            <Pressable
              key={name}
              onPress={() => setSpotlightPlayer(on ? '' : name)}
              style={[styles.chip, on && styles.chipActive]}
            >
              <AppText
                variant="callout"
                numberOfLines={1}
                style={[styles.chipText, on && styles.chipTextActive]}
              >
                {name}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <Screen scroll={false}>
      <AppText variant="title1" style={styles.heading}>
        Club history
      </AppText>

      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tab, active && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <AppText
                variant="callout"
                numberOfLines={1}
                style={[styles.tabLabel, active && styles.tabLabelActive]}
              >
                {t.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {tab === 'summary' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="title2" style={styles.section}>
            {L.overallTitle}
          </AppText>

          {L.eras.map((era) => (
            <Card key={era.id} style={styles.eraCard}>
              <AppText variant="title3" style={styles.eraTitle}>
                {era.title}
              </AppText>
              <View style={styles.sideBlock}>
                <AppText variant="label" style={styles.sideLabel}>
                  {era.sideA.label}
                </AppText>
                <AppText variant="callout">{era.sideA.captain}</AppText>
                <AppText variant="callout">{era.sideA.viceCaptain}</AppText>
                <AppText variant="title3" style={styles.wins}>
                  Wins: {era.sideA.winsLabel}
                </AppText>
              </View>
              <View style={styles.sideBlock}>
                <AppText variant="label" style={styles.sideLabel}>
                  {era.sideB.label}
                </AppText>
                <AppText variant="callout">{era.sideB.captain}</AppText>
                <AppText variant="callout">{era.sideB.viceCaptain}</AppText>
                <AppText variant="title3" style={styles.wins}>
                  Wins: {era.sideB.winsLabel}
                </AppText>
              </View>
              {era.note ? (
                <AppText variant="caption" style={styles.eraNote}>
                  {era.note}
                </AppText>
              ) : null}
            </Card>
          ))}

          <Card style={styles.totalsCard}>
            <AppText variant="label">Total matches won (all phases)</AppText>
            <View style={styles.totalsRows}>
              <View style={styles.totalsStatRow}>
                <AppText variant="title3" style={styles.totalsTeamLabel}>
                  {totalsTeamALabel}:
                </AppText>
                <AppText variant="title1" style={styles.totalsTeamValue}>
                  {L.teamATotalWins}
                </AppText>
              </View>
              <View style={styles.totalsStatRow}>
                <AppText variant="title3" style={styles.totalsTeamLabel}>
                  {totalsTeamBLabel}:
                </AppText>
                <AppText variant="title1" style={styles.totalsTeamValue}>
                  {L.teamBTotalWins}
                </AppText>
              </View>
            </View>
            {L.totalsFootnote ? (
              <AppText variant="caption" style={styles.footnote}>
                ({L.totalsFootnote})
              </AppText>
            ) : null}
          </Card>

          <AppText variant="title2" style={styles.section}>
            From completed matches (this app)
          </AppText>
          {live.error ? (
            <AppText variant="callout" style={styles.liveError}>
              {live.error}
            </AppText>
          ) : null}
          {live.loading ? (
            <View style={styles.liveLoading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : liveStandingsRows.length === 0 ? (
            <Card style={styles.liveCard} />
          ) : (
            <Card style={styles.liveCard} padded={false}>
              <View style={[styles.standRow, styles.tableHeaderRow]}>
                <AppText variant="caption" style={[styles.rankCol, styles.tableHeaderText]}>
                  #
                </AppText>
                <AppText variant="caption" style={[styles.nameCol, styles.tableHeaderText]}>
                  Team
                </AppText>
                <AppText variant="caption" style={[styles.standMeta, styles.tableHeaderText]}>
                  W–L–T
                </AppText>
                <AppText variant="caption" style={[styles.standPts, styles.tableHeaderText]}>
                  Pts
                </AppText>
              </View>
              {liveStandingsRows.map((s, i) => (
                <View
                  key={s.teamId}
                  style={[
                    styles.standRow,
                    i < liveStandingsRows.length - 1 && styles.tableRowBorder,
                  ]}
                >
                  <AppText variant="caption" style={styles.rankCol}>
                    {s.rank}.
                  </AppText>
                  <AppText variant="callout" style={styles.nameCol} numberOfLines={1}>
                    {s.name}
                    {s.shortCode ? ` (${s.shortCode})` : ''}
                  </AppText>
                  <AppText variant="caption" style={styles.standMeta}>
                    {s.wins}W · {s.losses}L{s.ties ? ` · ${s.ties}T` : ''}
                  </AppText>
                  <AppText variant="callout" style={styles.standPts}>
                    {s.points} pts
                  </AppText>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      ) : null}

      {tab === 'doubleWicket' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="title2" style={styles.section}>
            {L.doubleWicketTitle}
          </AppText>
          {playerChipBar}
          <View style={styles.filterWrap}>
            <AppText variant="label" style={styles.filterLabel}>
              Filter list
            </AppText>
            <TextInput
              value={dwTextFilter}
              onChangeText={setDwTextFilter}
              placeholder="Pair or date…"
              placeholderTextColor={colors.textDisabled}
              style={styles.filterInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {spotlightSummaryCard}
          <Card style={styles.dwCard} padded={false}>
            {filteredDwHall.length === 0 ? (
              <View style={styles.dwEmpty}>
                <AppText variant="callout" style={styles.dwEmptyText}>
                  No rows match this filter.
                </AppText>
              </View>
            ) : (
              <>
                <View style={[styles.dwRow, styles.tableHeaderRow]}>
                  <AppText variant="caption" style={[styles.dwPlace, styles.tableHeaderText]}>
                    #
                  </AppText>
                  <View style={styles.dwMain}>
                    <AppText variant="caption" style={styles.tableHeaderText}>
                      Pair
                    </AppText>
                    <AppText variant="caption" style={[styles.dwDate, styles.tableHeaderText]}>
                      Date
                    </AppText>
                  </View>
                </View>
                {filteredDwHall.map((row, i) => (
                  <View
                    key={`${i}-${row.place}-${row.dateLabel}-${row.pairLabel}`}
                    style={[styles.dwRow, i < filteredDwHall.length - 1 && styles.dwRowBorder]}
                  >
                    <AppText variant="caption" style={styles.dwPlace}>
                      {row.place}
                    </AppText>
                    <View style={styles.dwMain}>
                      <AppText variant="title3" numberOfLines={2}>
                        {row.pairLabel}
                      </AppText>
                      <AppText variant="caption" style={styles.dwDate}>
                        {row.dateLabel}
                      </AppText>
                    </View>
                  </View>
                ))}
              </>
            )}
          </Card>
        </ScrollView>
      ) : null}

      {tab === 'records' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {playerChipBar}
          {spotlightSummaryCard}
          <AppText variant="title2" style={styles.section}>
            Live player stats (this app)
          </AppText>
          {live.error ? (
            <AppText variant="callout" style={styles.liveError}>
              {live.error}
            </AppText>
          ) : null}
          {live.loading ? (
            <View style={styles.liveLoading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : topBatting.length === 0 && topBowling.length === 0 ? (
            <Card style={styles.tableCard} />
          ) : null}

          {topBatting.length > 0 ? (
            <>
              <AppText variant="label" style={styles.tableTitle}>
                Batting (runs)
              </AppText>
              <Card style={styles.tableCard} padded={false}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <AppText variant="caption" style={[styles.rankCol, styles.tableHeaderText]}>
                    #
                  </AppText>
                  <AppText variant="caption" style={[styles.nameCol, styles.tableHeaderText]}>
                    Player
                  </AppText>
                  <AppText variant="caption" style={[styles.numCol, styles.tableHeaderText]}>
                    Runs
                  </AppText>
                </View>
                {topBatting.map((b, i) => (
                  <View
                    key={b.playerId}
                    style={[styles.tableRow, i < topBatting.length - 1 && styles.tableRowBorder]}
                  >
                    <AppText variant="caption" style={styles.rankCol}>
                      {i + 1}.
                    </AppText>
                    <AppText variant="callout" style={styles.nameCol} numberOfLines={1}>
                      {b.name}
                    </AppText>
                    <AppText variant="callout" style={styles.numCol}>
                      {b.runs} ({b.balls}b)
                    </AppText>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          {topBowling.length > 0 ? (
            <>
              <AppText variant="label" style={styles.tableTitle}>
                Bowling (wickets)
              </AppText>
              <Card style={styles.tableCard} padded={false}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <AppText variant="caption" style={[styles.rankCol, styles.tableHeaderText]}>
                    #
                  </AppText>
                  <AppText variant="caption" style={[styles.nameCol, styles.tableHeaderText]}>
                    Player
                  </AppText>
                  <AppText variant="caption" style={[styles.numCol, styles.tableHeaderText]}>
                    W · R (B)
                  </AppText>
                </View>
                {topBowling.map((b, i) => (
                  <View
                    key={b.playerId}
                    style={[styles.tableRow, i < topBowling.length - 1 && styles.tableRowBorder]}
                  >
                    <AppText variant="caption" style={styles.rankCol}>
                      {i + 1}.
                    </AppText>
                    <AppText variant="callout" style={styles.nameCol} numberOfLines={1}>
                      {b.name}
                    </AppText>
                    <AppText variant="callout" style={styles.numCol}>
                      {b.wickets}w · {b.runsConceded}r ({b.balls}b)
                    </AppText>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          <AppText variant="title2" style={styles.section}>
            {L.testBlockTitle}
          </AppText>

          <AppText variant="label" style={styles.tableTitle}>
            Batting (historical)
          </AppText>
          <Card style={styles.tableCard} padded={false}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <AppText variant="caption" style={[styles.rankCol, styles.tableHeaderText]}>
                #
              </AppText>
              <AppText variant="caption" style={[styles.nameCol, styles.tableHeaderText]}>
                Player
              </AppText>
              <AppText variant="caption" style={[styles.numCol, styles.tableHeaderText]}>
                Runs (Inn)
              </AppText>
              <AppText variant="caption" style={[styles.bestCol, styles.tableHeaderText]}>
                Best
              </AppText>
            </View>
            {L.testBatting.map((b, i) => (
              <View
                key={b.rank}
                style={[styles.tableRow, i < L.testBatting.length - 1 && styles.tableRowBorder]}
              >
                <AppText variant="caption" style={styles.rankCol}>
                  {b.rank}.
                </AppText>
                <AppText variant="callout" style={styles.nameCol} numberOfLines={1}>
                  {b.name}
                </AppText>
                <AppText variant="callout" style={styles.numCol}>
                  {b.runs} ({b.innings})
                </AppText>
                <AppText variant="caption" style={styles.bestCol}>
                  Best {b.best}
                </AppText>
              </View>
            ))}
          </Card>

          <AppText variant="label" style={styles.tableTitle}>
            Bowling (historical)
          </AppText>
          <Card style={styles.tableCard} padded={false}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <AppText variant="caption" style={[styles.rankCol, styles.tableHeaderText]}>
                #
              </AppText>
              <AppText variant="caption" style={[styles.nameCol, styles.tableHeaderText]}>
                Player
              </AppText>
              <AppText variant="caption" style={[styles.numCol, styles.tableHeaderText]}>
                Wkts (Inn)
              </AppText>
              <AppText variant="caption" style={[styles.bestCol, styles.tableHeaderText]}>
                Best
              </AppText>
            </View>
            {L.testBowling.map((b, i) => (
              <View
                key={b.rank}
                style={[styles.tableRow, i < L.testBowling.length - 1 && styles.tableRowBorder]}
              >
                <AppText variant="caption" style={styles.rankCol}>
                  {b.rank}.
                </AppText>
                <AppText variant="callout" style={styles.nameCol} numberOfLines={1}>
                  {b.name}
                </AppText>
                <AppText variant="callout" style={styles.numCol}>
                  {b.wickets} ({b.innings})
                </AppText>
                <AppText variant="caption" style={styles.bestCol}>
                  Best {b.best}
                </AppText>
              </View>
            ))}
          </Card>

          <View style={styles.milestoneRow}>
            <Card style={styles.milestoneCard}>
              <AppText variant="label">50s</AppText>
              <View style={[styles.milestoneHeader, styles.tableHeaderRow]}>
                <AppText variant="caption" style={[styles.milestoneNameCol, styles.tableHeaderText]}>
                  Player
                </AppText>
                <AppText variant="caption" style={[styles.milestoneCountCol, styles.tableHeaderText]}>
                  #
                </AppText>
              </View>
              {L.fifties.map((f, i) => (
                <View
                  key={f.name}
                  style={[
                    styles.milestoneDataRow,
                    i < L.fifties.length - 1 && styles.milestoneRowBorder,
                  ]}
                >
                  <AppText variant="callout" style={styles.milestoneNameCol} numberOfLines={1}>
                    {f.name}
                  </AppText>
                  <AppText variant="callout" style={styles.milestoneCountCol}>
                    {f.count}
                  </AppText>
                </View>
              ))}
            </Card>
            <Card style={styles.milestoneCard}>
              <AppText variant="label">100s</AppText>
              <View style={[styles.milestoneHeader, styles.tableHeaderRow]}>
                <AppText variant="caption" style={[styles.milestoneNameCol, styles.tableHeaderText]}>
                  Player
                </AppText>
                <AppText variant="caption" style={[styles.milestoneCountCol, styles.tableHeaderText]}>
                  #
                </AppText>
              </View>
              {L.hundreds.map((f, i) => (
                <View
                  key={f.name}
                  style={[
                    styles.milestoneDataRow,
                    i < L.hundreds.length - 1 && styles.milestoneRowBorder,
                  ]}
                >
                  <AppText variant="callout" style={styles.milestoneNameCol} numberOfLines={1}>
                    {f.name}
                  </AppText>
                  <AppText variant="callout" style={styles.milestoneCountCol}>
                    {f.count}
                  </AppText>
                </View>
              ))}
            </Card>
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: spacing.md, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accentMuted,
  },
  tabLabel: { color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  tabLabelActive: { color: colors.accent },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xxxl },
  section: { marginTop: spacing.lg, marginBottom: spacing.xs },
  eraCard: { marginBottom: spacing.md },
  eraTitle: { marginBottom: spacing.md, fontWeight: '600' },
  sideBlock: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  sideLabel: { marginBottom: spacing.xs, color: colors.accent },
  wins: { marginTop: spacing.sm, color: colors.text },
  eraNote: { marginTop: spacing.sm, color: colors.textMuted, fontStyle: 'italic' },
  totalsCard: { marginBottom: spacing.lg, marginTop: spacing.sm },
  totalsRows: {
    flexDirection: 'column',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  totalsStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  totalsTeamLabel: { color: colors.text, fontWeight: '600' },
  totalsTeamValue: { fontVariant: ['tabular-nums'], fontWeight: '700' },
  footnote: { marginTop: spacing.sm, color: colors.textMuted },
  liveCard: { marginBottom: spacing.lg, overflow: 'hidden' },
  liveError: { color: colors.danger, marginBottom: spacing.sm },
  liveLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  tableHeaderRow: {
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  tableHeaderText: {
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  standRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  standMeta: { color: colors.textMuted, fontVariant: ['tabular-nums'] },
  standPts: { fontVariant: ['tabular-nums'], fontWeight: '600', marginLeft: 'auto' },
  dwCard: { marginBottom: spacing.xl, overflow: 'hidden' },
  dwRow: { flexDirection: 'row', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  dwRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  dwPlace: {
    width: 28,
    color: colors.textMuted,
    fontWeight: '700',
    marginRight: spacing.md,
  },
  dwMain: { flex: 1, minWidth: 0 },
  dwDate: { marginTop: 4, color: colors.textMuted },
  dwEmpty: { paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  dwEmptyText: { color: colors.textMuted, textAlign: 'center' },
  chipBar: { marginBottom: spacing.md },
  chipScrollContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    maxWidth: 160,
  },
  chipActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accentMuted,
  },
  chipText: { color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.accent },
  filterWrap: { marginBottom: spacing.md },
  filterLabel: { marginBottom: spacing.xs, color: colors.textMuted },
  filterInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  spotlightCard: { marginBottom: spacing.lg },
  spotlightTitle: { marginBottom: spacing.md, fontWeight: '700' },
  spotlightBlockLabel: { marginTop: spacing.sm, marginBottom: spacing.xs, color: colors.accent },
  spotlightLine: { marginBottom: spacing.xs },
  spotlightPartners: { marginBottom: spacing.sm },
  spotlightMuted: { color: colors.textMuted, marginBottom: spacing.xs },
  tableTitle: { marginTop: spacing.md, marginBottom: spacing.sm },
  tableCard: { marginBottom: spacing.md, overflow: 'hidden' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tableRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  rankCol: { width: 28, color: colors.textMuted },
  nameCol: { flex: 1, minWidth: 0, fontWeight: '600' },
  numCol: { fontVariant: ['tabular-nums'] },
  bestCol: { color: colors.textMuted, minWidth: 72, textAlign: 'right' },
  milestoneRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  milestoneCard: { flex: 1 },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  milestoneNameCol: { flex: 1, minWidth: 0, marginRight: spacing.sm },
  milestoneCountCol: { minWidth: 36, textAlign: 'right', fontVariant: ['tabular-nums'] },
  milestoneDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  milestoneRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
});
