import type { MatchStatus } from '../types/models';

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'Scheduled',
  toss: 'Ready to start',
  live: 'Live',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

export function formatMatchStatus(status: MatchStatus): string {
  return STATUS_LABELS[status];
}
