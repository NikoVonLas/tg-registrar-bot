import { i18n } from '@/utils/sdk-helpers';

/**
 * Format date and time using i18n formatter
 */
export function formatDateTime(date: Date): string {
  return i18n.formatDateTime(date);
}

/**
 * Format cities statistics for display
 */
export function formatCitiesStats(
  byCities: Record<string, number>,
  limit: number = 20
): { text: string; hasMore: boolean; moreCount: number } {
  const entries = Object.entries(byCities);
  const topCities = entries.slice(0, limit);
  const hasMore = entries.length > limit;
  const moreCount = entries.length - limit;

  const text = topCities
    .map(([city, count]) => `• ${city}: ${count}`)
    .join('\n');

  return {
    text,
    hasMore,
    moreCount,
  };
}

/**
 * Format CSV line with proper escaping
 */
export function formatCsvLine(values: (string | number | undefined)[]): string {
  return values
    .map(v => {
      const str = String(v ?? '');
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(',');
}
