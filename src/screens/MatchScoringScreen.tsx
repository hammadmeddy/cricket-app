import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import TossCeremonyModal from '../components/TossCeremonyModal';
import type { TossCoinFace } from '../lib/tossCoin';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Screen from '../components/ui/Screen';
import TextField from '../components/ui/TextField';
import { LEGAL_BALLS_PER_OVER, maxBallsForOvers } from '../lib/matchOvers';
import { ballIndexInCurrentOver, ballsToOversString } from '../lib/oversDisplay';
import {
  battingSideForInnings,
  battingTeamId,
  fieldingSideForInnings,
  fieldingTeamId,
  teamNameForSide,
} from '../lib/matchInnings';
import {
  recordDelivery,
  recordToss,
  setBatters,
  setScoreboardOverride,
  startLiveScoring,
  subscribeMatch,
  undoLastDelivery,
} from '../services/matchesService';
import { subscribePlayersByTeam } from '../services/playersService';
import { useAppSelector } from '../store/hooks';
import { selectCanManageAppData } from '../store/permissions';
import type { RootStackParamList } from '../navigation/types';
import type { LivePhase, Match, MatchScoreboard, Player, TossDecision } from '../types/models';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchScoring'>;

type BatterModal = 'openers' | 'striker' | 'bowler' | null;

type CoinFace = TossCoinFace;

export default function MatchScoringScreen({ navigation, route }: Props) {
  const { matchId, headerTitle } = route.params;
  const canManage = useAppSelector(selectCanManageAppData);
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  const [subError, setSubError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [undoBusy, setUndoBusy] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjI1R, setAdjI1R] = useState('0');
  const [adjI1W, setAdjI1W] = useState('0');
  const [adjI1B, setAdjI1B] = useState('0');
  const [adjI2R, setAdjI2R] = useState('0');
  const [adjI2W, setAdjI2W] = useState('0');
  const [adjI2B, setAdjI2B] = useState('0');
  const [adjPhase, setAdjPhase] = useState<LivePhase>('inn1');
  const [adjWinner, setAdjWinner] = useState<'A' | 'B' | 'tie'>('tie');
  const [battingPlayers, setBattingPlayers] = useState<Player[]>([]);
  const [fieldingPlayers, setFieldingPlayers] = useState<Player[]>([]);
  const [squadA, setSquadA] = useState<Player[]>([]);
  const [squadB, setSquadB] = useState<Player[]>([]);
  const [batterModal, setBatterModal] = useState<BatterModal>(null);
  const [draftStriker, setDraftStriker] = useState<string | null>(null);
  const [draftNon, setDraftNon] = useState<string | null>(null);
  const [draftBowler, setDraftBowler] = useState<string | null>(null);
  const [tossWinner, setTossWinner] = useState<'A' | 'B'>('A');
  const [tossElected, setTossElected] = useState<TossDecision>('bat');
  const [tossCallFace, setTossCallFace] = useState<CoinFace | null>(null);
  const [coinOutcome, setCoinOutcome] = useState<CoinFace | null>(null);
  const [hasCompletedCoinFlip, setHasCompletedCoinFlip] = useState(false);
  const [tossCeremonyOpen, setTossCeremonyOpen] = useState(false);

  useEffect(() => {
    setTossWinner('A');
    setTossElected('bat');
    setTossCallFace(null);
    setCoinOutcome(null);
    setHasCompletedCoinFlip(false);
    setTossCeremonyOpen(false);
  }, [matchId]);

  useEffect(() => {
    if (match && (match.tossWinnerSide === 'A' || match.tossWinnerSide === 'B')) {
      setTossWinner(match.tossWinnerSide);
    }
    if (match && (match.tossElected === 'bat' || match.tossElected === 'bowl')) {
      setTossElected(match.tossElected);
    }
  }, [match?.tossWinnerSide, match?.tossElected]);

  useEffect(() => {
    setMatch(undefined);
    const unsub = subscribeMatch(
      matchId,
      (m) => {
        setMatch(m);
        setSubError(null);
      },
      (e) => setSubError(e.message)
    );
    return unsub;
  }, [matchId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: headerTitle,
    });
  }, [navigation, headerTitle]);

  const battingTeamIdLive = useMemo(() => {
    if (!match || match.status !== 'live' || !match.scoreboard) {
      return null;
    }
    const sb = match.scoreboard;
    if (sb.phase === 'done') {
      return null;
    }
    const inn1Side = sb.inn1Side ?? 'A';
    const inn: 1 | 2 = sb.phase === 'inn2' ? 2 : 1;
    return battingTeamId(match, inn1Side, inn);
  }, [match]);

  useEffect(() => {
    if (!match?.teamAId || !match?.teamBId) {
      setSquadA([]);
      setSquadB([]);
      return;
    }
    const u1 = subscribePlayersByTeam(match.teamAId, setSquadA, () => setSquadA([]));
    const u2 = subscribePlayersByTeam(match.teamBId, setSquadB, () => setSquadB([]));
    return () => {
      u1();
      u2();
    };
  }, [match?.teamAId, match?.teamBId]);

  useEffect(() => {
    if (!battingTeamIdLive) {
      setBattingPlayers([]);
      return;
    }
    const unsub = subscribePlayersByTeam(
      battingTeamIdLive,
      (list) => setBattingPlayers(list),
      () => setBattingPlayers([])
    );
    return unsub;
  }, [battingTeamIdLive]);

  const fieldingTeamIdLive = useMemo(() => {
    if (!match || match.status !== 'live' || !match.scoreboard) {
      return null;
    }
    const sb = match.scoreboard;
    if (sb.phase === 'done') {
      return null;
    }
    const inn1Side = sb.inn1Side ?? 'A';
    const inn: 1 | 2 = sb.phase === 'inn2' ? 2 : 1;
    return fieldingTeamId(match, inn1Side, inn);
  }, [match]);

  useEffect(() => {
    if (!fieldingTeamIdLive) {
      setFieldingPlayers([]);
      return;
    }
    const unsub = subscribePlayersByTeam(
      fieldingTeamIdLive,
      (list) => setFieldingPlayers(list),
      () => setFieldingPlayers([])
    );
    return unsub;
  }, [fieldingTeamIdLive]);

  const onStart = useCallback(() => {
    if (match === undefined || match === null) {
      return;
    }
    setActionBusy(true);
    startLiveScoring(match.id)
      .catch((e: Error) => {
        Alert.alert('Could not start', e.message ?? 'Try again.');
      })
      .finally(() => setActionBusy(false));
  }, [match]);

  const onSaveToss = useCallback(() => {
    if (!hasCompletedCoinFlip) {
      Alert.alert('Run the toss ceremony', 'Complete the toss ceremony first, then save.');
      return;
    }
    setActionBusy(true);
    recordToss(matchId, tossWinner, tossElected)
      .catch((e: Error) => {
        Alert.alert('Could not save toss', e.message ?? 'Try again.');
      })
      .finally(() => setActionBusy(false));
  }, [matchId, tossWinner, tossElected, hasCompletedCoinFlip]);

  const onTossCeremonySettled = useCallback(
    ({ outcome, winnerSide }: { outcome: CoinFace; winnerSide: 'A' | 'B' }) => {
      setCoinOutcome(outcome);
      setTossWinner(winnerSide);
      setHasCompletedCoinFlip(true);
    },
    []
  );

  const onOpenTossCeremony = useCallback(() => {
    if (tossCallFace === null) {
      Alert.alert('Heads or tails?', 'Choose the call first, then run the toss ceremony.');
      return;
    }
    setCoinOutcome(null);
    setHasCompletedCoinFlip(false);
    setTossCeremonyOpen(true);
  }, [tossCallFace]);

  const onTossCeremonyAgain = useCallback(() => {
    setCoinOutcome(null);
    setHasCompletedCoinFlip(false);
    setTossCeremonyOpen(true);
  }, []);

  const onBall = useCallback(
    (runs: number, wicket: boolean) => {
      setActionBusy(true);
      recordDelivery(matchId, { runs, wicket })
        .catch((e: Error) => {
          Alert.alert('Could not record', e.message ?? 'Try again.');
        })
        .finally(() => setActionBusy(false));
    },
    [matchId]
  );

  const onUndo = useCallback(() => {
    setUndoBusy(true);
    undoLastDelivery(matchId)
      .catch((e: Error) => {
        Alert.alert('Could not undo', e.message ?? 'Try again.');
      })
      .finally(() => setUndoBusy(false));
  }, [matchId]);

  const openAdjust = useCallback(() => {
    if (!match?.scoreboard) {
      return;
    }
    const s = match.scoreboard;
    setAdjI1R(String(s.i1Runs));
    setAdjI1W(String(s.i1Wk));
    setAdjI1B(String(s.i1Balls));
    setAdjI2R(String(s.i2Runs));
    setAdjI2W(String(s.i2Wk));
    setAdjI2B(String(s.i2Balls));
    setAdjPhase(s.phase);
    setAdjWinner(s.winnerSide === 'A' ? 'A' : s.winnerSide === 'B' ? 'B' : 'tie');
    setAdjustOpen(true);
  }, [match]);

  const onSaveAdjust = useCallback(() => {
    if (!match?.scoreboard) {
      return;
    }
    const maxB = match.scoreboard.maxBalls;
    const inn1Side = match.scoreboard.inn1Side ?? 'A';
    const n = (s: string) => {
      const v = parseInt(s.replace(/\D/g, ''), 10);
      return Number.isFinite(v) ? v : 0;
    };
    const next: MatchScoreboard = {
      phase: adjPhase,
      maxBalls: maxB,
      inn1Side,
      i1Runs: n(adjI1R),
      i1Wk: n(adjI1W),
      i1Balls: n(adjI1B),
      i2Runs: n(adjI2R),
      i2Wk: n(adjI2W),
      i2Balls: n(adjI2B),
      winnerSide: adjPhase === 'done' ? (adjWinner === 'tie' ? null : adjWinner) : null,
      strikerPlayerId: match.scoreboard.strikerPlayerId ?? null,
      nonStrikerPlayerId: match.scoreboard.nonStrikerPlayerId ?? null,
      bowlerPlayerId: match.scoreboard.bowlerPlayerId ?? null,
    };
    Alert.alert(
      'Save scorecard?',
      'This replaces the displayed totals and clears the ball-by-ball undo history from this point.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            setActionBusy(true);
            setScoreboardOverride(matchId, next)
              .then(() => setAdjustOpen(false))
              .catch((e: Error) => {
                Alert.alert('Could not save', e.message ?? 'Try again.');
              })
              .finally(() => setActionBusy(false));
          },
        },
      ]
    );
  }, [
    match,
    matchId,
    adjPhase,
    adjWinner,
    adjI1R,
    adjI1W,
    adjI1B,
    adjI2R,
    adjI2W,
    adjI2B,
  ]);

  const saveBatters = useCallback(() => {
    if (batterModal === 'bowler') {
      if (!draftBowler) {
        Alert.alert('Pick bowler', 'Choose who is bowling this over.');
        return;
      }
      setActionBusy(true);
      setBatters(matchId, { bowlerPlayerId: draftBowler })
        .then(() => {
          setBatterModal(null);
          setDraftBowler(null);
        })
        .catch((e: Error) => Alert.alert('Could not save', e.message ?? 'Try again.'))
        .finally(() => setActionBusy(false));
      return;
    }
    if (batterModal === 'openers') {
      if (!draftStriker || !draftNon) {
        Alert.alert('Pick both', 'Choose a striker and a non-striker.');
        return;
      }
      setActionBusy(true);
      setBatters(matchId, {
        strikerPlayerId: draftStriker,
        nonStrikerPlayerId: draftNon,
      })
        .then(() => {
          setBatterModal(null);
          setDraftStriker(null);
          setDraftNon(null);
        })
        .catch((e: Error) => Alert.alert('Could not save', e.message ?? 'Try again.'))
        .finally(() => setActionBusy(false));
    } else if (batterModal === 'striker') {
      if (!draftStriker) {
        Alert.alert('Pick striker', 'Choose who faces next.');
        return;
      }
      setActionBusy(true);
      setBatters(matchId, { strikerPlayerId: draftStriker })
        .then(() => {
          setBatterModal(null);
          setDraftStriker(null);
        })
        .catch((e: Error) => Alert.alert('Could not save', e.message ?? 'Try again.'))
        .finally(() => setActionBusy(false));
    }
  }, [batterModal, draftStriker, draftNon, draftBowler, matchId]);

  const canUndo = useMemo(() => {
    if (!canManage || match === undefined || match === null) {
      return false;
    }
    const board = match.scoreboard;
    if (!board) {
      return false;
    }
    const len = board.deliveryLog?.length ?? 0;
    if (len === 0) {
      return false;
    }
    return (
      match.status === 'live' ||
      (match.status === 'completed' && board.phase === 'done')
    );
  }, [canManage, match]);

  const canAdjustTotals = useMemo(() => {
    if (!canManage || match === undefined || match === null) {
      return false;
    }
    if (!match.scoreboard) {
      return false;
    }
    return match.status === 'live' || match.status === 'completed';
  }, [canManage, match]);

  const nameFor = useCallback(
    (id: string | null | undefined) => {
      if (!id) {
        return '—';
      }
      const merged = [...squadA, ...squadB, ...battingPlayers, ...fieldingPlayers];
      return merged.find((p) => p.id === id)?.name ?? id.slice(0, 6);
    },
    [squadA, squadB, battingPlayers, fieldingPlayers]
  );

  if (subError) {
    return (
      <Screen scroll>
        <Card>
          <AppText variant="title3" color="danger">
            Could not load match
          </AppText>
          <AppText variant="callout" style={styles.errBody}>
            {subError}
          </AppText>
        </Card>
      </Screen>
    );
  }

  if (match === undefined) {
    return (
      <Screen scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <AppText variant="callout" style={styles.loadingLabel}>
            Loading match…
          </AppText>
        </View>
      </Screen>
    );
  }

  if (match === null) {
    return (
      <Screen scroll>
        <Card>
          <AppText variant="title3">Match not found</AppText>
          <AppText variant="callout" style={styles.errBody}>
            It may have been removed.
          </AppText>
          <Button label="Go back" variant="secondary" onPress={() => navigation.goBack()} />
        </Card>
      </Screen>
    );
  }

  const sb = match.scoreboard;
  const canScore = canManage && match.status === 'live' && sb && sb.phase !== 'done';
  const canDeliver = canScore && Boolean(sb?.bowlerPlayerId);
  const canRecordRuns =
    canDeliver && Boolean(sb?.strikerPlayerId && sb?.nonStrikerPlayerId);
  const canRecordWicket = canDeliver && Boolean(sb?.strikerPlayerId);
  const legalBallsInCurrentInnings =
    sb && sb.phase === 'inn1' ? sb.i1Balls : sb && sb.phase === 'inn2' ? sb.i2Balls : 0;
  const ballInOver = sb ? ballIndexInCurrentOver(legalBallsInCurrentInnings) : 0;
  const logLen = sb?.deliveryLog?.length ?? 0;
  const tossDone = Boolean(match.tossWinnerSide && match.tossElected);
  const inn1Side = sb?.inn1Side ?? (tossDone ? inn1SideFromTossPreview(match) : 'A');
  const inn1SideName = teamNameForSide(match, battingSideForInnings(inn1Side, 1));
  const inn2SideName = teamNameForSide(match, battingSideForInnings(inn1Side, 2));
  const preLive = match.status === 'scheduled' || match.status === 'toss';
  const showTossForm = canManage && preLive && !tossDone;
  const showStartAfterToss = canManage && tossDone && preLive;

  return (
    <>
      <Screen scroll>
        <AppText variant="callout" style={styles.subtitle}>
          {sb
            ? `${inn1SideName} batted first · ${inn2SideName} chases (target = 1st inns + 1)`
            : tossDone
              ? `${teamNameForSide(match, battingSideForInnings(inn1SideFromTossPreview(match), 1))} will bat first after you start`
              : 'Run the toss ceremony on the scorecard, then start live scoring.'}
        </AppText>
        <AppText variant="caption" style={styles.oversMeta}>
          {match.oversPerInnings} overs per innings ({sb?.maxBalls ?? maxBallsForOvers(match.oversPerInnings)}{' '}
          legal balls)
        </AppText>

        {match.teamAId && match.teamBId ? (
          <Card style={styles.card}>
            <AppText variant="title3" style={{ marginBottom: spacing.sm }}>
              Squad sizes
            </AppText>
            <AppText variant="callout">
              {match.teamAName}: {squadA.length} player{squadA.length === 1 ? '' : 's'} ·{' '}
              {match.teamBName}: {squadB.length} player{squadB.length === 1 ? '' : 's'}
            </AppText>
            {(squadA.length < 2 || squadB.length < 2) && preLive ? (
              <AppText variant="caption" style={styles.warn}>
                Each side needs at least 2 players in Squads before you can start live scoring.
              </AppText>
            ) : null}
          </Card>
        ) : null}

        {showTossForm ? (
          <Card style={styles.card}>
            <AppText variant="title3" style={{ marginBottom: spacing.sm }}>
              Toss
            </AppText>
            <AppText variant="callout" style={styles.muted}>
              Team A chooses heads or tails (the call). The ceremony flips a fair coin — result is
              random and not tied to the animation. Run the ceremony, then save. You can still
              correct the winner below if needed.
            </AppText>

            <AppText variant="label" style={styles.phaseLabel}>
              Team A — call in the air
            </AppText>
            <View style={styles.phaseRow}>
              {(
                [
                  { id: 'heads' as const, label: 'Heads' },
                  { id: 'tails' as const, label: 'Tails' },
                ] as const
              ).map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => !tossCeremonyOpen && setTossCallFace(t.id)}
                  style={[
                    styles.phaseChip,
                    tossCallFace === t.id && styles.phaseChipActive,
                    tossCeremonyOpen && styles.phaseChipDisabled,
                  ]}
                >
                  <AppText
                    variant="callout"
                    style={
                      tossCallFace === t.id ? styles.phaseChipTextOn : styles.phaseChipText
                    }
                  >
                    {t.label}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <View style={styles.tossCeremonyBlock}>
              {coinOutcome ? (
                <AppText variant="title3" style={styles.coinResult}>
                  {coinOutcome === 'heads' ? 'Heads' : 'Tails'} —{' '}
                  {tossWinner === 'A' ? match.teamAName : match.teamBName} wins the toss
                </AppText>
              ) : tossCallFace === null ? (
                <AppText variant="callout" style={styles.coinHint}>
                  {match.teamAName} picks heads or tails, then open the ceremony.
                </AppText>
              ) : (
                <AppText variant="callout" style={styles.coinHint}>
                  {match.teamAName} (Team A) calls {tossCallFace}.
                </AppText>
              )}
            </View>

            <View style={styles.tossFlipRow}>
              <View style={styles.editRowBtn}>
                <Button
                  label={tossCeremonyOpen ? 'Ceremony playing…' : 'Run toss ceremony'}
                  onPress={onOpenTossCeremony}
                  disabled={tossCeremonyOpen || tossCallFace === null}
                />
              </View>
              {coinOutcome && !tossCeremonyOpen ? (
                <View style={styles.editRowBtn}>
                  <Button label="Toss again" variant="ghost" onPress={onTossCeremonyAgain} />
                </View>
              ) : null}
            </View>

            <AppText variant="label" style={styles.phaseLabel}>
              Toss won by (override if needed)
            </AppText>
            <View style={styles.phaseRow}>
              {(
                [
                  { id: 'A' as const, label: match.teamAName },
                  { id: 'B' as const, label: match.teamBName },
                ] as const
              ).map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setTossWinner(t.id)}
                  style={[
                    styles.phaseChip,
                    tossWinner === t.id && styles.phaseChipActive,
                  ]}
                >
                  <AppText
                    variant="callout"
                    style={tossWinner === t.id ? styles.phaseChipTextOn : styles.phaseChipText}
                  >
                    {t.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <AppText variant="label" style={styles.phaseLabel}>
              Winner chooses
            </AppText>
            <View style={styles.phaseRow}>
              {(
                [
                  { id: 'bat' as const, label: 'Bat first' },
                  { id: 'bowl' as const, label: 'Bowl first' },
                ] as const
              ).map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setTossElected(t.id)}
                  style={[
                    styles.phaseChip,
                    tossElected === t.id && styles.phaseChipActive,
                  ]}
                >
                  <AppText
                    variant="callout"
                    style={tossElected === t.id ? styles.phaseChipTextOn : styles.phaseChipText}
                  >
                    {t.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <Button
              label="Save toss"
              onPress={onSaveToss}
              loading={actionBusy}
              disabled={actionBusy || !hasCompletedCoinFlip}
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        ) : null}

        {showStartAfterToss ? (
          <Card style={styles.card}>
            <AppText variant="title3">Ready to play</AppText>
            <AppText variant="callout" style={styles.muted}>
              Toss: {match.tossWinnerSide === 'A' ? match.teamAName : match.teamBName} won and
              elected to {match.tossElected === 'bat' ? 'bat' : 'bowl'} first —{' '}
              {teamNameForSide(match, inn1SideFromTossPreview(match))} opens.
            </AppText>
            <Button
              label="Start live scoring"
              onPress={onStart}
              loading={actionBusy}
              disabled={actionBusy}
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        ) : null}

        {match.status === 'scheduled' && !tossDone && !canManage ? (
          <Card style={styles.card}>
            <AppText variant="callout" style={styles.muted}>
              Staff (signed in with the club account) must record the toss before this match can go
              live.
            </AppText>
          </Card>
        ) : null}

        {match.status === 'live' && sb && sb.phase !== 'done' ? (
          <Card style={styles.card}>
            <AppText variant="title3" style={{ marginBottom: spacing.sm }}>
              Match situation
            </AppText>
            <AppText variant="label">Batting · {teamNameForSide(match, battingSideForInnings(inn1Side, sb.phase === 'inn2' ? 2 : 1))}</AppText>
            <AppText variant="callout" style={styles.situationLine}>
              Striker: {nameFor(sb.strikerPlayerId)} · Non-striker: {nameFor(sb.nonStrikerPlayerId)}
            </AppText>
            <AppText variant="label" style={styles.fieldingLabel}>
              Fielding · {teamNameForSide(match, fieldingSideForInnings(inn1Side, sb.phase === 'inn2' ? 2 : 1))}
            </AppText>
            <AppText variant="callout" style={styles.situationLine}>
              Bowler: {nameFor(sb.bowlerPlayerId)}
            </AppText>
            <AppText variant="caption" style={styles.overMeta}>
              This over: legal ball {ballInOver} of {LEGAL_BALLS_PER_OVER} ·{' '}
              {ballsToOversString(sb.phase === 'inn1' ? sb.i1Balls : sb.i2Balls)} overs (
              {sb.phase === 'inn1' ? '1st' : '2nd'} innings)
            </AppText>
            {!sb.bowlerPlayerId ? (
              <AppText variant="caption" style={styles.warn}>
                {sb.i1Balls > 0 && sb.i1Balls % 6 === 0 && sb.phase === 'inn1'
                  ? 'Over complete — pick the bowler for the next over.'
                  : sb.i2Balls > 0 && sb.i2Balls % 6 === 0 && sb.phase === 'inn2'
                    ? 'Over complete — pick the bowler for the next over.'
                    : 'Choose the bowler before each ball is recorded.'}
              </AppText>
            ) : null}
            {!sb.strikerPlayerId || !sb.nonStrikerPlayerId ? (
              <AppText variant="caption" style={styles.warn}>
                {sb.phase === 'inn2' && sb.i2Balls === 0
                  ? 'Pick two openers for the chase.'
                  : sb.strikerPlayerId && !sb.nonStrikerPlayerId
                    ? 'Pick non-striker.'
                    : !sb.strikerPlayerId && sb.nonStrikerPlayerId
                      ? 'Pick next striker (e.g. after a wicket).'
                      : 'Pick striker and non-striker at the start of an innings.'}
              </AppText>
            ) : null}
            {canManage ? (
              <View style={styles.editRow}>
                <View style={styles.editRowBtn}>
                  <Button
                    label={sb.strikerPlayerId && sb.nonStrikerPlayerId ? 'Change pair' : 'Set crease'}
                    variant="secondary"
                    onPress={() => {
                      setDraftStriker(sb.strikerPlayerId ?? null);
                      setDraftNon(sb.nonStrikerPlayerId ?? null);
                      setBatterModal('openers');
                    }}
                  />
                </View>
                <View style={styles.editRowBtn}>
                  <Button
                    label={sb.bowlerPlayerId ? 'Change bowler' : 'Set bowler'}
                    variant="secondary"
                    onPress={() => {
                      setDraftBowler(sb.bowlerPlayerId ?? null);
                      setBatterModal('bowler');
                    }}
                  />
                </View>
                {sb.nonStrikerPlayerId && !sb.strikerPlayerId ? (
                  <View style={styles.editRowBtn}>
                    <Button
                      label="Next striker…"
                      variant="ghost"
                      onPress={() => {
                        setDraftStriker(null);
                        setBatterModal('striker');
                      }}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>
        ) : null}

        {!sb ? (
          !showTossForm && !showStartAfterToss ? (
            <Card style={styles.card}>
              <AppText variant="title3">Scorecard</AppText>
              <AppText variant="callout" style={styles.muted}>
                {match.status === 'live'
                  ? 'Live match is missing score data. Ask signed-in staff to restart from the series screen.'
                  : 'No score data for this match.'}
              </AppText>
            </Card>
          ) : null
        ) : (
          <>
            <Card style={styles.card}>
              <AppText variant="label">Innings 1 · {inn1SideName}</AppText>
              <AppText variant="title1" style={styles.scoreLine}>
                {sb.i1Runs}/{sb.i1Wk}
              </AppText>
              <AppText variant="callout" style={styles.oversLine}>
                {ballsToOversString(sb.i1Balls)} overs
              </AppText>
            </Card>

            <Card style={styles.card}>
              <AppText variant="label">Innings 2 · {inn2SideName}</AppText>
              <AppText variant="title1" style={styles.scoreLine}>
                {sb.i2Runs}/{sb.i2Wk}
              </AppText>
              <AppText variant="callout" style={styles.oversLine}>
                {ballsToOversString(sb.i2Balls)} overs
              </AppText>
              {sb.phase !== 'inn1' ? (
                <AppText variant="caption" style={styles.target}>
                  Target {sb.i1Runs + 1}
                </AppText>
              ) : null}
            </Card>

            {sb.phase === 'done' ? (
              <Card style={[styles.card, styles.resultCard]}>
                <AppText variant="title3">Result</AppText>
                <AppText variant="callout" style={styles.resultText}>
                  {sb.winnerSide === 'A'
                    ? `${match.teamAName} won`
                    : sb.winnerSide === 'B'
                      ? `${match.teamBName} won`
                      : 'Tie'}
                </AppText>
              </Card>
            ) : null}
          </>
        )}

        {sb && canManage && (canUndo || canAdjustTotals) ? (
          <Card style={styles.card}>
            <AppText variant="title3" style={{ marginBottom: spacing.sm }}>
              Correct mistakes
            </AppText>
            <AppText variant="caption" style={styles.undoHint}>
              {logLen > 0
                ? `${logLen} ball(s) on record — undo removes the most recent delivery only.`
                : 'No delivery history to undo yet. Use “Correct totals” if figures are wrong (this clears future undo).'}
            </AppText>
            <View style={styles.editRow}>
              <View style={styles.editRowBtn}>
                <Button
                  label="Undo last ball"
                  variant="secondary"
                  disabled={!canUndo || actionBusy || undoBusy}
                  loading={undoBusy}
                  onPress={onUndo}
                />
              </View>
              <View style={styles.editRowBtn}>
                <Button
                  label="Correct totals…"
                  variant="ghost"
                  disabled={!canAdjustTotals || actionBusy || undoBusy}
                  onPress={openAdjust}
                />
              </View>
            </View>
          </Card>
        ) : null}

        {canScore ? (
          <Card style={styles.card}>
            <AppText variant="title3" style={{ marginBottom: spacing.md }}>
              Record ball
            </AppText>
            {!canDeliver ? (
              <AppText variant="caption" style={styles.warn}>
                Set the bowler (fielding team) before recording any delivery.
              </AppText>
            ) : !canRecordRuns ? (
              <AppText variant="caption" style={styles.warn}>
                Set striker and non-striker before recording runs. Wickets only need a striker on
                strike.
              </AppText>
            ) : null}
            <View style={styles.runGrid}>
              {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                <Pressable
                  key={r}
                  style={({ pressed }) => [
                    styles.runBtn,
                    pressed && styles.runBtnPressed,
                    (actionBusy || undoBusy || !canRecordRuns) && styles.runBtnDisabled,
                  ]}
                  disabled={actionBusy || undoBusy || !canRecordRuns}
                  onPress={() => onBall(r, false)}
                  accessibilityRole="button"
                  accessibilityLabel={`${r} runs`}
                >
                  <AppText variant="title3">{r}</AppText>
                </Pressable>
              ))}
            </View>
            <Button
              label="Wicket"
              variant="danger"
              fullWidth
              onPress={() => onBall(0, true)}
              loading={actionBusy}
              disabled={actionBusy || undoBusy || !canRecordWicket}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : match.status === 'live' && !canManage ? (
          <Card style={styles.card}>
            <AppText variant="callout" style={styles.muted}>
              Spectator view — only signed-in staff record deliveries.
            </AppText>
          </Card>
        ) : null}
      </Screen>

      {showTossForm ? (
        <TossCeremonyModal
          visible={tossCeremonyOpen}
          callFace={tossCallFace ?? 'heads'}
          teamAName={match.teamAName}
          teamBName={match.teamBName}
          onRequestClose={() => setTossCeremonyOpen(false)}
          onSettled={onTossCeremonySettled}
        />
      ) : null}

      <Modal
        visible={batterModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!actionBusy) {
            setBatterModal(null);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!actionBusy) {
                setBatterModal(null);
              }
            }}
          />
          <View style={styles.modalSheet}>
            <AppText variant="title2" style={styles.modalTitle}>
              {batterModal === 'striker'
                ? 'Next striker'
                : batterModal === 'bowler'
                  ? 'Select bowler'
                  : 'Striker & non-striker'}
            </AppText>
            <AppText variant="caption" style={styles.modalNote}>
              {batterModal === 'bowler'
                ? 'Fielding team only. Same bowler may bowl again after each over.'
                : 'Tap a player to assign. Batting team only.'}
            </AppText>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 360 }}
              contentContainerStyle={styles.modalScroll}
            >
              {(batterModal === 'bowler' ? fieldingPlayers : battingPlayers).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    if (batterModal === 'bowler') {
                      setDraftBowler(p.id);
                    } else if (batterModal === 'striker') {
                      setDraftStriker(p.id);
                    } else {
                      if (!draftStriker) {
                        setDraftStriker(p.id);
                      } else if (draftStriker !== p.id) {
                        setDraftNon(p.id);
                      } else {
                        setDraftStriker(p.id);
                      }
                    }
                  }}
                  style={[
                    styles.playerRow,
                    (batterModal === 'bowler'
                      ? draftBowler === p.id
                      : draftStriker === p.id || draftNon === p.id) && styles.playerRowOn,
                  ]}
                >
                  <AppText variant="title3">{p.name}</AppText>
                  <AppText variant="caption" style={styles.playerRole}>
                    {p.role}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <View style={styles.editRowBtn}>
                <Button
                  label="Cancel"
                  variant="ghost"
                  disabled={actionBusy}
                  onPress={() => setBatterModal(null)}
                />
              </View>
              <View style={styles.editRowBtn}>
                <Button
                  label="Save"
                  variant="primary"
                  loading={actionBusy}
                  disabled={actionBusy}
                  onPress={saveBatters}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={adjustOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!actionBusy) {
            setAdjustOpen(false);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!actionBusy) {
                setAdjustOpen(false);
              }
            }}
          />
          <View style={styles.modalSheet}>
            <AppText variant="title2" style={styles.modalTitle}>
              Correct totals
            </AppText>
            <AppText variant="caption" style={styles.modalNote}>
              1st innings = opening side · 2nd = chase · Cap {sb?.maxBalls ?? '—'} legal balls per
              innings
            </AppText>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              <TextField
                label={`1st innings runs (${inn1SideName})`}
                value={adjI1R}
                onChangeText={setAdjI1R}
                keyboardType="number-pad"
              />
              <TextField
                label="1st innings wickets"
                value={adjI1W}
                onChangeText={setAdjI1W}
                keyboardType="number-pad"
              />
              <TextField
                label="1st innings legal balls"
                value={adjI1B}
                onChangeText={setAdjI1B}
                keyboardType="number-pad"
              />
              <TextField
                label={`2nd innings runs (${inn2SideName})`}
                value={adjI2R}
                onChangeText={setAdjI2R}
                keyboardType="number-pad"
              />
              <TextField
                label="2nd innings wickets"
                value={adjI2W}
                onChangeText={setAdjI2W}
                keyboardType="number-pad"
              />
              <TextField
                label="2nd innings legal balls"
                value={adjI2B}
                onChangeText={setAdjI2B}
                keyboardType="number-pad"
              />
              <AppText variant="label" style={styles.phaseLabel}>
                Match phase
              </AppText>
              <View style={styles.phaseRow}>
                {(
                  [
                    { id: 'inn1' as const, label: '1st inns' },
                    { id: 'inn2' as const, label: '2nd inns' },
                    { id: 'done' as const, label: 'Finished' },
                  ] as const
                ).map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setAdjPhase(p.id)}
                    style={[styles.phaseChip, adjPhase === p.id && styles.phaseChipActive]}
                  >
                    <AppText
                      variant="callout"
                      style={adjPhase === p.id ? styles.phaseChipTextOn : styles.phaseChipText}
                    >
                      {p.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              {adjPhase === 'done' ? (
                <>
                  <AppText variant="label" style={styles.phaseLabel}>
                    Result (finished only)
                  </AppText>
                  <View style={styles.phaseRow}>
                    {(
                      [
                        { id: 'A' as const, label: `${match.teamAName} won` },
                        { id: 'B' as const, label: `${match.teamBName} won` },
                        { id: 'tie' as const, label: 'Tie' },
                      ] as const
                    ).map((w) => (
                      <Pressable
                        key={w.id}
                        onPress={() => setAdjWinner(w.id)}
                        style={[styles.phaseChip, adjWinner === w.id && styles.phaseChipActive]}
                      >
                        <AppText
                          variant="caption"
                          style={adjWinner === w.id ? styles.phaseChipTextOn : styles.phaseChipText}
                          numberOfLines={2}
                        >
                          {w.label}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <View style={styles.editRowBtn}>
                <Button
                  label="Cancel"
                  variant="ghost"
                  disabled={actionBusy}
                  onPress={() => setAdjustOpen(false)}
                />
              </View>
              <View style={styles.editRowBtn}>
                <Button
                  label="Save"
                  variant="primary"
                  loading={actionBusy}
                  disabled={actionBusy}
                  onPress={onSaveAdjust}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function inn1SideFromTossPreview(m: Match): 'A' | 'B' {
  const w = m.tossWinnerSide;
  const e = m.tossElected;
  if ((w === 'A' || w === 'B') && (e === 'bat' || e === 'bowl')) {
    return e === 'bat' ? w : w === 'A' ? 'B' : 'A';
  }
  return 'A';
}

const RUN_BTN_MIN = 52;

const styles = StyleSheet.create({
  subtitle: { marginBottom: spacing.xs, color: colors.textMuted },
  oversMeta: { marginBottom: spacing.lg, color: colors.textMuted },
  card: { marginBottom: spacing.lg },
  scoreLine: { marginTop: spacing.sm },
  oversLine: { marginTop: spacing.xs, color: colors.textMuted },
  target: { marginTop: spacing.sm, color: colors.accent },
  muted: { marginTop: spacing.sm, color: colors.textMuted },
  warn: { marginTop: spacing.sm, color: colors.warning },
  errBody: { marginTop: spacing.sm, marginBottom: spacing.lg },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.md,
  },
  loadingLabel: { color: colors.textMuted },
  resultCard: { borderColor: colors.accent, backgroundColor: colors.surfaceMuted },
  resultText: { marginTop: spacing.sm },
  runGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  runBtn: {
    minWidth: RUN_BTN_MIN,
    minHeight: RUN_BTN_MIN,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runBtnPressed: { opacity: 0.85 },
  runBtnDisabled: { opacity: 0.4 },
  undoHint: { marginBottom: spacing.md, color: colors.textMuted },
  situationLine: { marginTop: spacing.xs },
  fieldingLabel: { marginTop: spacing.md },
  overMeta: { marginTop: spacing.sm, color: colors.textMuted },
  editRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  editRowBtn: { flex: 1 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '88%',
  },
  modalTitle: { marginBottom: spacing.xs },
  modalNote: { marginBottom: spacing.md, color: colors.textMuted },
  modalScroll: { paddingBottom: spacing.lg },
  phaseLabel: { marginBottom: spacing.sm, marginTop: spacing.sm },
  phaseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  phaseChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  phaseChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceMuted,
  },
  phaseChipDisabled: { opacity: 0.45 },
  phaseChipText: { color: colors.textMuted },
  phaseChipTextOn: { color: colors.accent, fontWeight: '600' },
  tossCeremonyBlock: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  coinResult: { textAlign: 'center', color: colors.accent },
  coinHint: { textAlign: 'center', color: colors.textMuted },
  tossFlipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  playerRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  playerRowOn: { borderColor: colors.accent, backgroundColor: colors.surfaceMuted },
  playerRole: { marginTop: spacing.xs, color: colors.textMuted },
});
