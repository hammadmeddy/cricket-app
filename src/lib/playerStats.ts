import type { Match, Player, PlayerBattingStat, PlayerBowlingStat } from '../types/models';

/** Sum runs and balls faced from completed matches' delivery logs. */
export function computePlayerBattingStats(
  matches: Match[],
  players: Player[]
): PlayerBattingStat[] {
  const byId = new Map(players.map((p) => [p.id, p]));
  const agg = new Map<string, { runs: number; balls: number }>();

  const bump = (playerId: string | null | undefined, runs: number, faced: boolean) => {
    if (!playerId) {
      return;
    }
    const cur = agg.get(playerId) ?? { runs: 0, balls: 0 };
    cur.runs += runs;
    if (faced) {
      cur.balls += 1;
    }
    agg.set(playerId, cur);
  };

  for (const m of matches) {
    if (m.status !== 'completed') {
      continue;
    }
    const log = m.scoreboard?.deliveryLog ?? [];
    for (const d of log) {
      const runs = d.wicket ? 0 : d.runs;
      bump(d.batterId, runs, true);
    }
  }

  const rows: PlayerBattingStat[] = [];
  for (const [playerId, v] of agg) {
    const p = byId.get(playerId);
    rows.push({
      playerId,
      name: p?.name ?? 'Unknown player',
      teamId: p?.teamId ?? '',
      runs: v.runs,
      balls: v.balls,
    });
  }

  rows.sort((a, b) => {
    if (b.runs !== a.runs) {
      return b.runs - a.runs;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return rows;
}

/** Runs conceded, balls bowled, wickets from logs with bowlerId. */
export function computePlayerBowlingStats(
  matches: Match[],
  players: Player[]
): PlayerBowlingStat[] {
  const byId = new Map(players.map((p) => [p.id, p]));
  const agg = new Map<string, { balls: number; runs: number; wk: number }>();

  const bump = (bowlerId: string | null | undefined, runs: number, wicket: boolean) => {
    if (!bowlerId) {
      return;
    }
    const cur = agg.get(bowlerId) ?? { balls: 0, runs: 0, wk: 0 };
    cur.balls += 1;
    cur.runs += runs;
    if (wicket) {
      cur.wk += 1;
    }
    agg.set(bowlerId, cur);
  };

  for (const m of matches) {
    if (m.status !== 'completed') {
      continue;
    }
    const log = m.scoreboard?.deliveryLog ?? [];
    for (const d of log) {
      const runs = d.wicket ? 0 : d.runs;
      bump(d.bowlerId, runs, d.wicket);
    }
  }

  const rows: PlayerBowlingStat[] = [];
  for (const [playerId, v] of agg) {
    const p = byId.get(playerId);
    rows.push({
      playerId,
      name: p?.name ?? 'Unknown player',
      teamId: p?.teamId ?? '',
      balls: v.balls,
      runsConceded: v.runs,
      wickets: v.wk,
    });
  }

  rows.sort((a, b) => {
    if (b.wickets !== a.wickets) {
      return b.wickets - a.wickets;
    }
    if (a.runsConceded !== b.runsConceded) {
      return a.runsConceded - b.runsConceded;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return rows;
}
