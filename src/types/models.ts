export type PlayerRole = 'batsman' | 'bowler' | 'all-rounder';

export type UserRole = 'admin' | 'player';

export type SeriesFormat = 'best-of-3' | 'best-of-5' | 'best-of-7';

export type MatchStatus =
  | 'scheduled'
  | 'toss'
  | 'live'
  | 'completed'
  | 'abandoned';

export type TossDecision = 'bat' | 'bowl';
