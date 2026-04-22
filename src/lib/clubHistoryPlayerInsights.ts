import type {
  ClubDoubleWicketHallEntry,
  ClubLegacySnapshot,
  ClubMilestoneCount,
  ClubTestBattingRow,
  ClubTestBowlingRow,
} from '../types/clubLegacy';
import type { PlayerBattingStat, PlayerBowlingStat } from '../types/models';

/** "A + B" pair strings from legacy hall data. */
export function splitPairLabel(pairLabel: string): string[] {
  return pairLabel
    .split('+')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function uniquePlayerNamesFromDoubleWicketHall(
  hall: ClubDoubleWicketHallEntry[]
): string[] {
  const set = new Set<string>();
  for (const row of hall) {
    for (const n of splitPairLabel(row.pairLabel)) {
      set.add(n);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function doubleWicketRowsForPlayer(
  hall: ClubDoubleWicketHallEntry[],
  player: string
): ClubDoubleWicketHallEntry[] {
  const q = player.trim().toLowerCase();
  if (!q) {
    return hall;
  }
  return hall.filter((row) =>
    splitPairLabel(row.pairLabel).some((n) => n.toLowerCase() === q)
  );
}

/** Partner → how often they appeared together in the hall list (two-name rows only). */
export function partnerFrequencyForPlayer(
  hall: ClubDoubleWicketHallEntry[],
  player: string
): { partner: string; count: number }[] {
  const q = player.trim().toLowerCase();
  if (!q) {
    return [];
  }
  const map = new Map<string, number>();
  for (const row of hall) {
    const parts = splitPairLabel(row.pairLabel);
    if (parts.length !== 2) {
      continue;
    }
    const [a, b] = parts;
    const matchA = a.toLowerCase() === q;
    const matchB = b.toLowerCase() === q;
    if (matchA && !matchB) {
      map.set(b, (map.get(b) ?? 0) + 1);
    } else if (matchB && !matchA) {
      map.set(a, (map.get(a) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([partner, count]) => ({ partner, count }))
    .sort(
      (x, y) =>
        y.count - x.count ||
        x.partner.localeCompare(y.partner, undefined, { sensitivity: 'base' })
    );
}

export function legacyTestBattingForPlayer(
  L: ClubLegacySnapshot,
  player: string
): ClubTestBattingRow | null {
  const q = player.trim().toLowerCase();
  if (!q) {
    return null;
  }
  return L.testBatting.find((b) => b.name.toLowerCase() === q) ?? null;
}

export function legacyTestBowlingForPlayer(
  L: ClubLegacySnapshot,
  player: string
): ClubTestBowlingRow | null {
  const q = player.trim().toLowerCase();
  if (!q) {
    return null;
  }
  return L.testBowling.find((b) => b.name.toLowerCase() === q) ?? null;
}

export function legacyMilestoneCount(list: ClubMilestoneCount[], player: string): number | null {
  const q = player.trim().toLowerCase();
  if (!q) {
    return null;
  }
  const row = list.find((x) => x.name.toLowerCase() === q);
  return row ? row.count : null;
}

export function liveBattingForPlayer(
  rows: PlayerBattingStat[],
  player: string
): PlayerBattingStat | null {
  const q = player.trim().toLowerCase();
  if (!q) {
    return null;
  }
  return rows.find((b) => b.name.toLowerCase() === q) ?? null;
}

export function liveBowlingForPlayer(
  rows: PlayerBowlingStat[],
  player: string
): PlayerBowlingStat | null {
  const q = player.trim().toLowerCase();
  if (!q) {
    return null;
  }
  return rows.find((b) => b.name.toLowerCase() === q) ?? null;
}

/** Runs per ball × 6, when balls > 0. */
export function strikeRate(balls: number, runs: number): string {
  if (balls <= 0) {
    return '—';
  }
  return ((100 * runs) / balls).toFixed(1);
}

/** Runs conceded per over (6 balls). */
export function economyFromBalls(balls: number, runsConceded: number): string {
  if (balls <= 0) {
    return '—';
  }
  return ((6 * runsConceded) / balls).toFixed(2);
}
