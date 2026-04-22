import type { Match, Team, TeamStanding } from '../types/models';

type Row = {
  teamId: string;
  name: string;
  shortCode: string;
  played: number;
  wins: number;
  losses: number;
  ties: number;
};

function rowPoints(r: Row): number {
  return r.wins * 2 + r.ties;
}

function winPctInt(r: Row): number {
  if (r.played <= 0) {
    return 0;
  }
  return Math.round((100 * r.wins) / r.played);
}

/**
 * Builds standings from all known teams plus any team ids seen only on old match docs.
 * Only counts matches with status completed and a finished scoreboard (phase done).
 */
export function computeTeamStandings(teams: Team[], matches: Match[]): TeamStanding[] {
  const map = new Map<string, Row>();
  const teamById = new Map(teams.map((t) => [t.id, t]));

  teams.forEach((t) => {
    map.set(t.id, {
      teamId: t.id,
      name: t.name,
      shortCode: t.shortCode,
      played: 0,
      wins: 0,
      losses: 0,
      ties: 0,
    });
  });

  const ensureRow = (id: string, fallbackName: string) => {
    if (!map.has(id)) {
      map.set(id, {
        teamId: id,
        name: fallbackName,
        shortCode: '',
        played: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      });
    }
    const row = map.get(id)!;
    const t = teamById.get(id);
    if (t) {
      row.name = t.name;
      row.shortCode = t.shortCode;
    }
  };

  for (const m of matches) {
    if (m.status !== 'completed') {
      continue;
    }
    const a = m.teamAId;
    const b = m.teamBId;
    if (!a || !b) {
      continue;
    }
    const sb = m.scoreboard;
    if (!sb || sb.phase !== 'done') {
      continue;
    }

    ensureRow(a, m.teamAName || 'Team A');
    ensureRow(b, m.teamBName || 'Team B');

    const ra = map.get(a)!;
    const rb = map.get(b)!;
    ra.played += 1;
    rb.played += 1;

    const w = sb.winnerSide;
    if (w === 'A') {
      ra.wins += 1;
      rb.losses += 1;
    } else if (w === 'B') {
      rb.wins += 1;
      ra.losses += 1;
    } else {
      ra.ties += 1;
      rb.ties += 1;
    }
  }

  const sorted = [...map.values()].sort((x, y) => {
    const px = rowPoints(x);
    const py = rowPoints(y);
    if (py !== px) {
      return py - px;
    }
    if (y.wins !== x.wins) {
      return y.wins - x.wins;
    }
    const pcx = x.played > 0 ? x.wins / x.played : 0;
    const pcy = y.played > 0 ? y.wins / y.played : 0;
    if (pcy !== pcx) {
      return pcy - pcx;
    }
    return x.name.localeCompare(y.name);
  });

  return sorted.map((r, i) => ({
    rank: i + 1,
    teamId: r.teamId,
    name: r.name,
    shortCode: r.shortCode,
    played: r.played,
    wins: r.wins,
    losses: r.losses,
    ties: r.ties,
    points: rowPoints(r),
    winPct: winPctInt(r),
  }));
}
