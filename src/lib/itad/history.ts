import type { PricePoint } from '../domain/models';
import { HISTORY_VERSION, type HistoryStore } from './types';

export const DAY_MS = 86_400_000;
/** Days are bucketed in ICT so "today" matches what a Thai visitor sees. */
export const ICT_OFFSET_MS = 7 * 60 * 60 * 1000;
/** ~13 months of daily points. 20 series × 400 days ≈ 56 KB — no tiering needed yet. */
export const HISTORY_CAP_DAYS = 400;

export const ictEpochDay = (at: number): number => Math.floor((at + ICT_OFFSET_MS) / DAY_MS);

export const epochDayToDate = (day: number): Date => new Date(day * DAY_MS - ICT_OFFSET_MS);

export const historyKey = (gameSlug: string, editionKey: string): string =>
  `${gameSlug}|${editionKey}`;

export const emptyHistory = (): HistoryStore => ({
  version: HISTORY_VERSION,
  startDay: 0,
  series: {}
});

/**
 * Fold one run's prices into the rolling daily series.
 *
 * The daily aggregate is the **minimum**, not the latest: the chart exists to
 * answer "how low did this go", and a thrice-daily cron would otherwise walk
 * straight past a flash sale.
 */
export const appendHistory = (
  previous: HistoryStore | null,
  samples: Readonly<Record<string, number>>,
  at: number
): HistoryStore => {
  const today = ictEpochDay(at);
  const base: HistoryStore =
    previous && previous.series && Number.isFinite(previous.startDay)
      ? { version: HISTORY_VERSION, startDay: previous.startDay, series: { ...previous.series } }
      : { version: HISTORY_VERSION, startDay: today, series: {} };

  if (Object.keys(base.series).length === 0) base.startDay = today;

  const index = today - base.startDay;
  // A backwards clock would corrupt the alignment; leave the series untouched.
  if (index < 0) return base;

  const keys = new Set([...Object.keys(base.series), ...Object.keys(samples)]);
  const series: Record<string, (number | null)[]> = {};

  for (const key of keys) {
    const arr = [...(base.series[key] ?? [])];
    // Pad honestly: a missed run is a gap, not a flat line.
    while (arr.length <= index) arr.push(null);

    const sample = samples[key];
    if (Number.isFinite(sample)) {
      const existing = arr[index];
      arr[index] = existing === null || existing === undefined ? sample : Math.min(existing, sample);
    }
    series[key] = arr;
  }

  const length = index + 1;
  const overflow = Math.max(0, length - HISTORY_CAP_DAYS);
  if (overflow > 0) {
    for (const key of Object.keys(series)) series[key] = series[key].slice(overflow);
  }

  return { version: HISTORY_VERSION, startDay: base.startDay + overflow, series };
};

/** Real recorded points for one series, most recent `days` window, oldest first. */
export const historyToPoints = (
  store: HistoryStore | null,
  key: string,
  days: number,
  now: number
): PricePoint[] => {
  const series = store?.series?.[key];
  if (!store || !series) return [];

  const today = ictEpochDay(now);
  const from = today - Math.max(1, Math.floor(days));
  const points: PricePoint[] = [];

  for (let i = 0; i < series.length; i += 1) {
    const value = series[i];
    if (value === null || value === undefined) continue;
    const day = store.startDay + i;
    if (day < from || day > today) continue;
    points.push({ date: epochDayToDate(day), priceSatang: value });
  }
  return points;
};

/**
 * Bucket to at most `maxPoints`, taking each bucket's minimum and always keeping
 * the true first and last readings so the endpoints stay honest.
 */
export const downsampleByBucketMin = (
  points: readonly PricePoint[],
  maxPoints: number
): PricePoint[] => {
  const limit = Math.max(2, Math.floor(maxPoints));
  if (points.length <= limit) return [...points];

  const buckets: PricePoint[] = [];
  const size = points.length / limit;

  for (let i = 0; i < limit; i += 1) {
    const start = Math.floor(i * size);
    const end = Math.min(points.length, Math.max(start + 1, Math.floor((i + 1) * size)));
    let lowest = points[start];
    for (let j = start + 1; j < end; j += 1) {
      if (points[j].priceSatang < lowest.priceSatang) lowest = points[j];
    }
    buckets.push(lowest);
  }

  buckets[0] = points[0];
  buckets[buckets.length - 1] = points[points.length - 1];
  return buckets;
};
