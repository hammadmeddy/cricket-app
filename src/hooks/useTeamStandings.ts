import { useEffect, useMemo, useState } from 'react';
import { computeTeamStandings } from '../lib/teamStandings';
import { subscribeCompletedMatches } from '../services/matchesService';
import { subscribeTeams } from '../services/teamsService';
import type { Match, Team } from '../types/models';

export function useTeamStandings() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamsReady, setTeamsReady] = useState(false);
  const [matchesReady, setMatchesReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubTeams = subscribeTeams(
      (list) => {
        setTeams(list);
        setTeamsReady(true);
        setError(null);
      },
      (e) => {
        setError(e.message);
        setTeamsReady(true);
      }
    );
    const unsubMatches = subscribeCompletedMatches(
      (list) => {
        setMatches(list);
        setMatchesReady(true);
        setError(null);
      },
      (e) => {
        setError(e.message);
        setMatchesReady(true);
      }
    );
    return () => {
      unsubTeams();
      unsubMatches();
    };
  }, []);

  const standings = useMemo(
    () => computeTeamStandings(teams, matches),
    [teams, matches]
  );

  const loading = !teamsReady || !matchesReady;

  return { standings, loading, error, completedCount: matches.length };
}
