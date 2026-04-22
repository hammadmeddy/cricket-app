import { useEffect, useMemo, useState } from 'react';
import { subscribeAllMatches } from '../services/matchesService';
import { subscribeSeries } from '../services/seriesService';
import { subscribeTeams } from '../services/teamsService';
import type { Match, Series } from '../types/models';

export function useDashboardStats() {
  const [teamCount, setTeamCount] = useState(0);
  const [series, setSeries] = useState<Series[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [ready, setReady] = useState({ teams: false, series: false, matches: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u1 = subscribeTeams(
      (list) => {
        setTeamCount(list.length);
        setReady((r) => ({ ...r, teams: true }));
        setError(null);
      },
      (e) => {
        setError(e.message);
        setReady((r) => ({ ...r, teams: true }));
      }
    );
    const u2 = subscribeSeries(
      (list) => {
        setSeries(list);
        setReady((r) => ({ ...r, series: true }));
        setError(null);
      },
      (e) => {
        setError(e.message);
        setReady((r) => ({ ...r, series: true }));
      }
    );
    const u3 = subscribeAllMatches(
      (list) => {
        setMatches(list);
        setReady((r) => ({ ...r, matches: true }));
        setError(null);
      },
      (e) => {
        setError(e.message);
        setReady((r) => ({ ...r, matches: true }));
      }
    );
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const loading = !ready.teams || !ready.series || !ready.matches;

  const liveCount = useMemo(
    () => matches.filter((m) => m.status === 'live').length,
    [matches]
  );
  const completedCount = useMemo(
    () => matches.filter((m) => m.status === 'completed').length,
    [matches]
  );
  const awaitingStart = useMemo(
    () => matches.filter((m) => m.status === 'scheduled' || m.status === 'toss').length,
    [matches]
  );

  const nextFixtures = useMemo(() => {
    const upcoming = matches.filter(
      (m) => m.status === 'scheduled' || m.status === 'toss' || m.status === 'live'
    );
    upcoming.sort((a, b) => {
      const ta = a.scheduledAt?.toMillis() ?? 0;
      const tb = b.scheduledAt?.toMillis() ?? 0;
      return ta - tb;
    });
    return upcoming.slice(0, 4);
  }, [matches]);

  const recentSeries = useMemo(() => series.slice(0, 4), [series]);

  return {
    loading,
    error,
    teamCount,
    seriesCount: series.length,
    recentSeries,
    matchCount: matches.length,
    liveCount,
    completedCount,
    awaitingStart,
    nextFixtures,
  };
}
