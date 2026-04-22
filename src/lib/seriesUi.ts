import type { SeriesFormat } from '../types/models';

const FORMAT_LABELS: Record<SeriesFormat, string> = {
  'best-of-3': 'Best of 3',
  'best-of-5': 'Best of 5',
  'best-of-7': 'Best of 7',
  test: 'Test',
  'double-wicket': 'Double wicket',
};

export function formatSeriesFormat(format: SeriesFormat): string {
  return FORMAT_LABELS[format];
}
