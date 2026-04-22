import type { PlayerRole } from '../types/models';

const ROLE_LABELS: Record<PlayerRole, string> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  'all-rounder': 'All-rounder',
};

export function formatPlayerRole(role: PlayerRole): string {
  return ROLE_LABELS[role];
}
