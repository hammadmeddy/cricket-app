import type { Match, TossDecision } from '../types/models';

export function inn1SideFromToss(winner: 'A' | 'B', elected: TossDecision): 'A' | 'B' {
  return elected === 'bat' ? winner : winner === 'A' ? 'B' : 'A';
}

export function chaseSideFromInn1(inn1Side: 'A' | 'B'): 'A' | 'B' {
  return inn1Side === 'A' ? 'B' : 'A';
}

export function teamNameForSide(match: Match, side: 'A' | 'B'): string {
  return side === 'A' ? match.teamAName : match.teamBName;
}

/** Team batting in the given innings number (1 = first innings in the match). */
export function battingSideForInnings(inn1Side: 'A' | 'B', innings: 1 | 2): 'A' | 'B' {
  if (innings === 1) {
    return inn1Side;
  }
  return chaseSideFromInn1(inn1Side);
}

export function battingTeamId(match: Match, inn1Side: 'A' | 'B', innings: 1 | 2): string {
  const side = battingSideForInnings(inn1Side, innings);
  return side === 'A' ? match.teamAId : match.teamBId;
}

/** Fielding side (A or B) while `innings` is batting. */
export function fieldingSideForInnings(inn1Side: 'A' | 'B', innings: 1 | 2): 'A' | 'B' {
  const bat = battingSideForInnings(inn1Side, innings);
  return bat === 'A' ? 'B' : 'A';
}

export function fieldingTeamId(match: Match, inn1Side: 'A' | 'B', innings: 1 | 2): string {
  const side = fieldingSideForInnings(inn1Side, innings);
  return side === 'A' ? match.teamAId : match.teamBId;
}
