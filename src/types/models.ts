import type { Timestamp } from 'firebase/firestore';

export type Team = {
  id: string;
  name: string;
  shortCode: string;
  createdAt?: Timestamp | null;
};

export type PlayerRole = 'batsman' | 'bowler' | 'all-rounder';

export type Player = {
  id: string;
  teamId: string;
  name: string;
  role: PlayerRole;
  createdAt?: Timestamp | null;
};

export type UserRole = 'admin' | 'player';

export type SeriesFormat =
  | 'best-of-3'
  | 'best-of-5'
  | 'best-of-7'
  | 'test'
  | 'double-wicket';

export type MatchStatus =
  | 'scheduled'
  | 'toss'
  | 'live'
  | 'completed'
  | 'abandoned';

export type TossDecision = 'bat' | 'bowl';

export type Series = {
  id: string;
  name: string;
  format: SeriesFormat;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  oversPerInnings: number;
  createdAt?: Timestamp | null;
};

/** Live / completed score — innings 1 then innings 2 (chase). */
export type LivePhase = 'inn1' | 'inn2' | 'done';

/** One legal delivery for undo stack (inn = innings when the ball was bowled). */
export type ScoreDeliveryLogEntry = {
  inn: 1 | 2;
  runs: number;
  wicket: boolean;
  /** Striker who faced this ball (for player stats). */
  batterId?: string | null;
  /** Bowler for this delivery (fielding team). */
  bowlerId?: string | null;
  /** Crease snapshot before this ball (for undo). Omitted on legacy logs. */
  strikerBefore?: string | null;
  nonStrikerBefore?: string | null;
  bowlerBefore?: string | null;
};

export type MatchScoreboard = {
  phase: LivePhase;
  maxBalls: number;
  i1Runs: number;
  i1Wk: number;
  i1Balls: number;
  i2Runs: number;
  i2Wk: number;
  i2Balls: number;
  winnerSide: 'A' | 'B' | null;
  /** Which side (A or B) bats first — from toss. Defaults to A for legacy matches. */
  inn1Side?: 'A' | 'B';
  strikerPlayerId?: string | null;
  nonStrikerPlayerId?: string | null;
  /** Current bowler (fielding team). Cleared between overs for a fresh selection. */
  bowlerPlayerId?: string | null;
  /** Ball-by-ball stack; last entry is undone first. Omitted on legacy docs. */
  deliveryLog?: ScoreDeliveryLogEntry[];
};

export type Match = {
  id: string;
  seriesId: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  scheduledAt: Timestamp | null;
  status: MatchStatus;
  oversPerInnings: number;
  venue: string;
  createdAt?: Timestamp | null;
  scoreboard?: MatchScoreboard | null;
  /** Who won the toss (side A or B). */
  tossWinnerSide?: 'A' | 'B' | null;
  /** What the toss winner elected (bat first or bowl first). */
  tossElected?: TossDecision | null;
};

/** Aggregated batting from delivery logs that include batterId. */
export type PlayerBattingStat = {
  playerId: string;
  name: string;
  teamId: string;
  runs: number;
  balls: number;
};

/** Aggregated bowling from delivery logs that include bowlerId. */
export type PlayerBowlingStat = {
  playerId: string;
  name: string;
  teamId: string;
  balls: number;
  runsConceded: number;
  wickets: number;
};

/** Aggregated from completed matches (W = 2 pts, tie = 1 pt each). */
export type TeamStanding = {
  rank: number;
  teamId: string;
  name: string;
  shortCode: string;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  winPct: number;
};

/** One row in a double-wicket tournament series (`series/{id}/doubleWicketResults`). */
export type DoubleWicketMatchResult = {
  id: string;
  seriesId: string;
  place: number;
  player1Name: string;
  player2Name: string;
  dateLabel: string;
  notes?: string;
};
