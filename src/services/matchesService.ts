import {
  addDoc,
  collection,
  deleteDoc,
  type DocumentData,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirestoreDb } from '../config/firebase';
import { collections } from '../config/firestorePaths';
import { battingTeamId, chaseSideFromInn1, fieldingTeamId } from '../lib/matchInnings';
import { clampOversPerInnings, maxBallsForOvers } from '../lib/matchOvers';
import type {
  LivePhase,
  Match,
  MatchScoreboard,
  MatchStatus,
  ScoreDeliveryLogEntry,
  TossDecision,
} from '../types/models';

function readTimestamp(v: unknown): Timestamp | null {
  if (
    v &&
    typeof v === 'object' &&
    'toMillis' in v &&
    typeof (v as Timestamp).toMillis === 'function'
  ) {
    return v as Timestamp;
  }
  return null;
}

function hasTossOnDoc(data: DocumentData): boolean {
  const w = data.tossWinnerSide;
  const e = data.tossElected;
  return (w === 'A' || w === 'B') && (e === 'bat' || e === 'bowl');
}

function computeInn1SideFromDoc(data: DocumentData): 'A' | 'B' {
  const w = data.tossWinnerSide;
  const e = data.tossElected;
  if ((w === 'A' || w === 'B') && (e === 'bat' || e === 'bowl')) {
    return e === 'bat' ? w : w === 'A' ? 'B' : 'A';
  }
  return 'A';
}

function parseDeliveryLog(raw: unknown): ScoreDeliveryLogEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: ScoreDeliveryLogEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const inn = row.inn === 2 ? 2 : 1;
    const runs =
      typeof row.runs === 'number' && Number.isFinite(row.runs) && row.runs >= 0
        ? Math.min(6, Math.floor(row.runs))
        : 0;
    const wicket = Boolean(row.wicket);
    const batterId =
      typeof row.batterId === 'string' && row.batterId.length > 0 ? row.batterId : null;
    const bowlerId =
      typeof row.bowlerId === 'string' && row.bowlerId.length > 0 ? row.bowlerId : null;
    const strikerBefore =
      typeof row.strikerBefore === 'string' || row.strikerBefore === null
        ? (row.strikerBefore as string | null)
        : undefined;
    const nonStrikerBefore =
      typeof row.nonStrikerBefore === 'string' || row.nonStrikerBefore === null
        ? (row.nonStrikerBefore as string | null)
        : undefined;
    const bowlerBefore =
      typeof row.bowlerBefore === 'string' || row.bowlerBefore === null
        ? (row.bowlerBefore as string | null)
        : undefined;
    const entry: ScoreDeliveryLogEntry = { inn, runs, wicket };
    if (batterId !== null) {
      entry.batterId = batterId;
    }
    if (bowlerId !== null) {
      entry.bowlerId = bowlerId;
    }
    if (strikerBefore !== undefined) {
      entry.strikerBefore = strikerBefore;
    }
    if (nonStrikerBefore !== undefined) {
      entry.nonStrikerBefore = nonStrikerBefore;
    }
    if (bowlerBefore !== undefined) {
      entry.bowlerBefore = bowlerBefore;
    }
    out.push(entry);
  }
  return out;
}

function parseScoreboard(raw: unknown): MatchScoreboard | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const phaseRaw = o.phase;
  const phase: LivePhase =
    phaseRaw === 'inn2' || phaseRaw === 'done' ? phaseRaw : 'inn1';
  const maxBalls = typeof o.maxBalls === 'number' ? Math.max(1, o.maxBalls) : 30;
  const num = (k: string) => (typeof o[k] === 'number' ? (o[k] as number) : 0);
  const winner = o.winnerSide;
  const winnerSide: 'A' | 'B' | null =
    winner === 'A' || winner === 'B' ? winner : null;
  const inn1Raw = o.inn1Side;
  const inn1Side: 'A' | 'B' = inn1Raw === 'B' ? 'B' : 'A';
  const striker =
    typeof o.strikerPlayerId === 'string' || o.strikerPlayerId === null
      ? (o.strikerPlayerId as string | null)
      : null;
  const nonStriker =
    typeof o.nonStrikerPlayerId === 'string' || o.nonStrikerPlayerId === null
      ? (o.nonStrikerPlayerId as string | null)
      : null;
  const bowler =
    typeof o.bowlerPlayerId === 'string' || o.bowlerPlayerId === null
      ? (o.bowlerPlayerId as string | null)
      : null;
  return {
    phase,
    maxBalls,
    i1Runs: num('i1Runs'),
    i1Wk: num('i1Wk'),
    i1Balls: num('i1Balls'),
    i2Runs: num('i2Runs'),
    i2Wk: num('i2Wk'),
    i2Balls: num('i2Balls'),
    winnerSide,
    inn1Side,
    strikerPlayerId: striker,
    nonStrikerPlayerId: nonStriker,
    bowlerPlayerId: bowler,
    deliveryLog: parseDeliveryLog(o.deliveryLog),
  };
}

function normalizeScoreboard(sb: MatchScoreboard): MatchScoreboard {
  const maxBalls = Math.max(1, Math.floor(sb.maxBalls));
  const inn1Side: 'A' | 'B' = sb.inn1Side === 'B' ? 'B' : 'A';
  return {
    phase: sb.phase === 'inn2' || sb.phase === 'done' ? sb.phase : 'inn1',
    maxBalls,
    inn1Side,
    i1Runs: Math.max(0, Math.floor(sb.i1Runs)),
    i1Wk: Math.min(10, Math.max(0, Math.floor(sb.i1Wk))),
    i1Balls: Math.min(maxBalls, Math.max(0, Math.floor(sb.i1Balls))),
    i2Runs: Math.max(0, Math.floor(sb.i2Runs)),
    i2Wk: Math.min(10, Math.max(0, Math.floor(sb.i2Wk))),
    i2Balls: Math.min(maxBalls, Math.max(0, Math.floor(sb.i2Balls))),
    winnerSide: sb.phase === 'done' ? sb.winnerSide : null,
    strikerPlayerId: sb.strikerPlayerId ?? null,
    nonStrikerPlayerId: sb.nonStrikerPlayerId ?? null,
    bowlerPlayerId: sb.bowlerPlayerId ?? null,
    deliveryLog: [],
  };
}

function applyUndoFromLog(sb: MatchScoreboard): MatchScoreboard {
  const log = [...(sb.deliveryLog ?? [])];
  const last = log.pop();
  if (!last) {
    throw new Error('Nothing to undo.');
  }
  const next: MatchScoreboard = { ...sb, deliveryLog: log };

  if (last.inn === 1) {
    next.i1Balls = Math.max(0, next.i1Balls - 1);
    if (last.wicket) {
      next.i1Wk = Math.max(0, next.i1Wk - 1);
    } else {
      next.i1Runs = Math.max(0, next.i1Runs - last.runs);
    }
    if (next.phase === 'inn2' && next.i2Balls === 0 && next.i2Runs === 0 && next.i2Wk === 0) {
      next.phase = 'inn1';
    }
  } else {
    if (next.phase === 'done') {
      next.phase = 'inn2';
      next.winnerSide = null;
    }
    next.i2Balls = Math.max(0, next.i2Balls - 1);
    if (last.wicket) {
      next.i2Wk = Math.max(0, next.i2Wk - 1);
    } else {
      next.i2Runs = Math.max(0, next.i2Runs - last.runs);
    }
  }

  if (last.strikerBefore !== undefined || last.nonStrikerBefore !== undefined) {
    next.strikerPlayerId = last.strikerBefore ?? null;
    next.nonStrikerPlayerId = last.nonStrikerBefore ?? null;
  }
  if (last.bowlerBefore !== undefined) {
    next.bowlerPlayerId = last.bowlerBefore ?? null;
  }

  return next;
}

function mapMatchDoc(id: string, data: DocumentData): Match {
  const status = data.status;
  const validStatus: MatchStatus =
    status === 'toss' || status === 'live' || status === 'completed' || status === 'abandoned'
      ? status
      : 'scheduled';
  const overs = typeof data.oversPerInnings === 'number' ? data.oversPerInnings : 6;
  const tw = data.tossWinnerSide;
  const tossWinnerSide =
    tw === 'A' || tw === 'B' ? tw : undefined;
  const te = data.tossElected;
  const tossElected =
    te === 'bat' || te === 'bowl' ? te : undefined;
  return {
    id,
    seriesId: typeof data.seriesId === 'string' ? data.seriesId : '',
    teamAId: typeof data.teamAId === 'string' ? data.teamAId : '',
    teamBId: typeof data.teamBId === 'string' ? data.teamBId : '',
    teamAName: typeof data.teamAName === 'string' ? data.teamAName : '',
    teamBName: typeof data.teamBName === 'string' ? data.teamBName : '',
    scheduledAt: readTimestamp(data.scheduledAt),
    status: validStatus,
    oversPerInnings: clampOversPerInnings(overs),
    venue: typeof data.venue === 'string' ? data.venue : '',
    createdAt: data.createdAt ?? null,
    scoreboard: parseScoreboard(data.scoreboard),
    tossWinnerSide,
    tossElected,
  };
}

export function subscribeMatch(
  matchId: string,
  onNext: (match: Match | null) => void,
  onError: (err: Error) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onNext(null);
    return () => {};
  }
  const ref = doc(db, collections.matches, matchId);
  return onSnapshot(
    ref,
    (snap) => {
      onNext(snap.exists() ? mapMatchDoc(snap.id, snap.data()) : null);
    },
    (e) => onError(e)
  );
}

export function subscribeAllMatches(
  onNext: (rows: Match[]) => void,
  onError: (err: Error) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onNext([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, collections.matches)),
    (snap) => {
      const list = snap.docs.map((d) => mapMatchDoc(d.id, d.data()));
      list.sort((a, b) => {
        const ta = a.scheduledAt?.toMillis() ?? 0;
        const tb = b.scheduledAt?.toMillis() ?? 0;
        return tb - ta;
      });
      onNext(list);
    },
    (e) => onError(e)
  );
}

export function subscribeLiveMatches(
  onNext: (rows: Match[]) => void,
  onError: (err: Error) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onNext([]);
    return () => {};
  }
  const q = query(collection(db, collections.matches), where('status', '==', 'live'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapMatchDoc(d.id, d.data()));
      list.sort((a, b) => {
        const ta = a.scheduledAt?.toMillis() ?? 0;
        const tb = b.scheduledAt?.toMillis() ?? 0;
        return ta - tb;
      });
      onNext(list);
    },
    (e) => onError(e)
  );
}

export function subscribeCompletedMatches(
  onNext: (rows: Match[]) => void,
  onError: (err: Error) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onNext([]);
    return () => {};
  }
  const q = query(collection(db, collections.matches), where('status', '==', 'completed'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapMatchDoc(d.id, d.data()));
      list.sort((a, b) => {
        const ta = a.scheduledAt?.toMillis() ?? 0;
        const tb = b.scheduledAt?.toMillis() ?? 0;
        return tb - ta;
      });
      onNext(list);
    },
    (e) => onError(e)
  );
}

export function subscribeMatchesForSeries(
  seriesId: string,
  onNext: (rows: Match[]) => void,
  onError: (err: Error) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) {
    onNext([]);
    return () => {};
  }
  const q = query(collection(db, collections.matches), where('seriesId', '==', seriesId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapMatchDoc(d.id, d.data()));
      list.sort((a, b) => {
        const ta = a.scheduledAt?.toMillis() ?? 0;
        const tb = b.scheduledAt?.toMillis() ?? 0;
        return ta - tb;
      });
      onNext(list);
    },
    (e) => onError(e)
  );
}

export async function createMatchRecord(input: {
  seriesId: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  scheduledAt: Timestamp;
  oversPerInnings: number;
  venue: string;
}): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  await addDoc(collection(db, collections.matches), {
    seriesId: input.seriesId,
    teamAId: input.teamAId,
    teamBId: input.teamBId,
    teamAName: input.teamAName,
    teamBName: input.teamBName,
    scheduledAt: input.scheduledAt,
    status: 'scheduled',
    oversPerInnings: clampOversPerInnings(input.oversPerInnings),
    venue: input.venue.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMatchRecord(matchId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  await deleteDoc(doc(db, collections.matches, matchId));
}

/** Update date/venue/overs before the match goes live. */
export async function updateMatchFixture(
  matchId: string,
  patch: { scheduledAt: Timestamp; venue: string; oversPerInnings?: number }
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  const ref = doc(db, collections.matches, matchId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('Match not found.');
  }
  const st = snap.data()?.status;
  if (st !== 'scheduled' && st !== 'toss') {
    throw new Error('Only fixtures that are still scheduled or at toss can be edited.');
  }
  const payload: Record<string, unknown> = {
    scheduledAt: patch.scheduledAt,
    venue: patch.venue.trim(),
    updatedAt: serverTimestamp(),
  };
  if (patch.oversPerInnings !== undefined) {
    payload.oversPerInnings = clampOversPerInnings(patch.oversPerInnings);
  }
  await updateDoc(ref, payload);
}

async function countPlayersOnTeam(teamId: string): Promise<number> {
  const db = getFirestoreDb();
  if (!db || !teamId) {
    return 0;
  }
  const q = query(collection(db, collections.players), where('teamId', '==', teamId));
  const snap = await getDocs(q);
  return snap.size;
}

export async function recordToss(
  matchId: string,
  winner: 'A' | 'B',
  elected: TossDecision
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  await updateDoc(doc(db, collections.matches, matchId), {
    tossWinnerSide: winner,
    tossElected: elected,
    status: 'toss',
    updatedAt: serverTimestamp(),
  });
}

export async function startLiveScoring(matchId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  const ref = doc(db, collections.matches, matchId);
  const pre = await getDoc(ref);
  if (!pre.exists()) {
    throw new Error('Match not found.');
  }
  const preData = pre.data()!;
  const teamAId = typeof preData.teamAId === 'string' ? preData.teamAId : '';
  const teamBId = typeof preData.teamBId === 'string' ? preData.teamBId : '';
  if (!teamAId || !teamBId) {
    throw new Error('Match is missing team assignments.');
  }
  const [nA, nB] = await Promise.all([
    countPlayersOnTeam(teamAId),
    countPlayersOnTeam(teamBId),
  ]);
  if (nA < 2 || nB < 2) {
    throw new Error(
      `Each side needs at least 2 squad players before starting (${nA} vs ${nB} listed). Add players in Squads.`
    );
  }
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error('Match not found.');
    }
    const data = snap.data()!;
    const st = data.status;
    if (st !== 'scheduled' && st !== 'toss') {
      throw new Error('This match has already started or cannot begin scoring.');
    }
    if (!hasTossOnDoc(data)) {
      throw new Error('Record the toss before starting the match.');
    }
    const inn1Side = computeInn1SideFromDoc(data);
    const o = typeof data.oversPerInnings === 'number' ? data.oversPerInnings : 6;
    const maxBalls = maxBallsForOvers(o);
    const scoreboard: MatchScoreboard = {
      phase: 'inn1',
      maxBalls,
      inn1Side,
      strikerPlayerId: null,
      nonStrikerPlayerId: null,
      bowlerPlayerId: null,
      i1Runs: 0,
      i1Wk: 0,
      i1Balls: 0,
      i2Runs: 0,
      i2Wk: 0,
      i2Balls: 0,
      winnerSide: null,
      deliveryLog: [],
    };
    transaction.update(ref, {
      status: 'live',
      scoreboard,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function setBatters(
  matchId: string,
  patch: Partial<
    Pick<MatchScoreboard, 'strikerPlayerId' | 'nonStrikerPlayerId' | 'bowlerPlayerId'>
  >
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  const ref = doc(db, collections.matches, matchId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error('Match not found.');
    }
    const data = snap.data()!;
    if (data.status !== 'live') {
      throw new Error('Batters can only be set during a live match.');
    }
    const sb = parseScoreboard(data.scoreboard);
    if (!sb || sb.phase === 'done') {
      throw new Error('Scoreboard is not ready.');
    }
    const m = mapMatchDoc(snap.id, data);
    const inn1Side = sb.inn1Side ?? 'A';
    const innings: 1 | 2 = sb.phase === 'inn2' ? 2 : 1;
    const battingTeam = battingTeamId(m, inn1Side, innings);
    if (!battingTeam) {
      throw new Error('Missing team on this match.');
    }
    const nextStriker =
      patch.strikerPlayerId !== undefined ? patch.strikerPlayerId : sb.strikerPlayerId;
    const nextNon =
      patch.nonStrikerPlayerId !== undefined ? patch.nonStrikerPlayerId : sb.nonStrikerPlayerId;
    const nextBowler =
      patch.bowlerPlayerId !== undefined ? patch.bowlerPlayerId : sb.bowlerPlayerId;
    if (nextStriker && nextNon && nextStriker === nextNon) {
      throw new Error('Striker and non-striker must be two different players.');
    }
    const fieldingTeam = fieldingTeamId(m, inn1Side, innings);
    const readBatting = async (pid: string | null) => {
      if (!pid) {
        return;
      }
      const ps = await transaction.get(doc(db, collections.players, pid));
      if (!ps.exists()) {
        throw new Error('Player not found.');
      }
      const tid = ps.data()?.teamId;
      if (tid !== battingTeam) {
        throw new Error('Batters must belong to the batting team.');
      }
    };
    const readFielding = async (pid: string | null) => {
      if (!pid) {
        return;
      }
      const ps = await transaction.get(doc(db, collections.players, pid));
      if (!ps.exists()) {
        throw new Error('Player not found.');
      }
      const tid = ps.data()?.teamId;
      if (tid !== fieldingTeam) {
        throw new Error('The bowler must belong to the fielding team.');
      }
    };
    await readBatting(nextStriker ?? null);
    await readBatting(nextNon ?? null);
    await readFielding(nextBowler ?? null);
    const next: MatchScoreboard = {
      ...sb,
      strikerPlayerId: nextStriker ?? null,
      nonStrikerPlayerId: nextNon ?? null,
      bowlerPlayerId: nextBowler ?? null,
    };
    transaction.update(ref, {
      scoreboard: next,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function recordDelivery(
  matchId: string,
  input: { runs: number; wicket: boolean }
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  if (!input.wicket && (input.runs < 0 || input.runs > 6)) {
    throw new Error('Runs must be between 0 and 6.');
  }
  const ref = doc(db, collections.matches, matchId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error('Match not found.');
    }
    const data = snap.data()!;
    if (data.status !== 'live') {
      throw new Error('This match is not live.');
    }
    const sb = parseScoreboard(data.scoreboard);
    if (!sb || sb.phase === 'done') {
      throw new Error('Scoring has finished.');
    }

    if (input.wicket) {
      if (!sb.strikerPlayerId) {
        throw new Error('Pick who faces before recording a wicket.');
      }
    } else if (!sb.strikerPlayerId || !sb.nonStrikerPlayerId) {
      throw new Error('Choose striker and non-striker before recording runs.');
    }
    if (!sb.bowlerPlayerId) {
      throw new Error('Choose the bowler before recording a ball.');
    }

    const inn1Side = sb.inn1Side ?? 'A';
    const chaseSide = chaseSideFromInn1(inn1Side);

    const strikerBefore = sb.strikerPlayerId;
    const nonStrikerBefore = sb.nonStrikerPlayerId;
    const batterId = sb.strikerPlayerId;
    const bowlerBefore = sb.bowlerPlayerId;
    const bowlerId = sb.bowlerPlayerId;

    const next: MatchScoreboard = { ...sb };

    if (sb.phase === 'inn1') {
      next.i1Balls += 1;
      if (input.wicket) {
        next.i1Wk += 1;
        next.strikerPlayerId = null;
      } else {
        next.i1Runs += input.runs;
        if (input.runs % 2 === 1) {
          next.strikerPlayerId = nonStrikerBefore;
          next.nonStrikerPlayerId = strikerBefore;
        }
      }
      if (next.i1Balls >= next.maxBalls || next.i1Wk >= 10) {
        next.phase = 'inn2';
        next.strikerPlayerId = null;
        next.nonStrikerPlayerId = null;
        next.bowlerPlayerId = null;
      } else if (next.i1Balls > 0 && next.i1Balls % 6 === 0) {
        next.bowlerPlayerId = null;
      }
    } else if (sb.phase === 'inn2') {
      const target = sb.i1Runs + 1;
      next.i2Balls += 1;
      if (input.wicket) {
        next.i2Wk += 1;
        next.strikerPlayerId = null;
      } else {
        next.i2Runs += input.runs;
        if (input.runs % 2 === 1) {
          next.strikerPlayerId = nonStrikerBefore;
          next.nonStrikerPlayerId = strikerBefore;
        }
      }
      if (next.i2Runs >= target) {
        next.phase = 'done';
        next.winnerSide = chaseSide;
        next.bowlerPlayerId = null;
      } else if (next.i2Balls >= next.maxBalls || next.i2Wk >= 10) {
        next.phase = 'done';
        const openSide = inn1Side;
        if (next.i2Runs > next.i1Runs) {
          next.winnerSide = chaseSide;
        } else if (next.i2Runs < next.i1Runs) {
          next.winnerSide = openSide;
        } else {
          next.winnerSide = null;
        }
        next.bowlerPlayerId = null;
      } else if (next.i2Balls > 0 && next.i2Balls % 6 === 0) {
        next.bowlerPlayerId = null;
      }
    }

    const log: ScoreDeliveryLogEntry[] = [...(sb.deliveryLog ?? [])];
    log.push({
      inn: sb.phase === 'inn2' ? 2 : 1,
      runs: input.wicket ? 0 : input.runs,
      wicket: input.wicket,
      batterId,
      bowlerId,
      strikerBefore,
      nonStrikerBefore,
      bowlerBefore,
    });
    while (log.length > 500) {
      log.shift();
    }

    transaction.update(ref, {
      scoreboard: { ...next, deliveryLog: log },
      status: next.phase === 'done' ? 'completed' : 'live',
      updatedAt: serverTimestamp(),
    });
  });
}

export async function undoLastDelivery(matchId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  const ref = doc(db, collections.matches, matchId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error('Match not found.');
    }
    const data = snap.data()!;
    const status = data.status;
    const sb = parseScoreboard(data.scoreboard);
    if (!sb) {
      throw new Error('No scoreboard to undo.');
    }
    const log = sb.deliveryLog ?? [];
    if (log.length === 0) {
      throw new Error('Nothing to undo yet. Use “Correct totals” if the card was wrong before tracking.');
    }
    if (status !== 'live' && !(status === 'completed' && sb.phase === 'done')) {
      throw new Error('Undo is only available while the match is live, or to take back the last ball that finished it.');
    }

    const next = applyUndoFromLog(sb);
    transaction.update(ref, {
      scoreboard: next,
      status: next.phase === 'done' ? 'completed' : 'live',
      updatedAt: serverTimestamp(),
    });
  });
}

/** Replace scoreboard (e.g. manual correction). Clears delivery log so undo restarts from here. */
export async function setScoreboardOverride(
  matchId: string,
  scoreboard: MatchScoreboard
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error('Firestore is not available.');
  }
  const ref = doc(db, collections.matches, matchId);
  const normalized = normalizeScoreboard(scoreboard);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error('Match not found.');
    }
    const data = snap.data()!;
    const status = data.status;
    if (status !== 'live' && status !== 'completed') {
      throw new Error('You can only correct totals on a live or finished match.');
    }
    const nextStatus: MatchStatus =
      normalized.phase === 'done' ? 'completed' : 'live';
    transaction.update(ref, {
      scoreboard: normalized,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  });
}
