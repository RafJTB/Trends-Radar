// Tous les chiffres affichés (globe, liste, fiche, graphique) viennent de ces fonctions,
// calculées à partir des séries quotidiennes : c'est ce qui garantit leur cohérence.
import type { CategoryId, Dataset, Iso3, Need, Period } from '../data/types';
import { computeScore, type ScoreDetail } from './score';

export interface Filters { period: Period; category: CategoryId | 'all' }

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);

/** Volume sur la période en cours (offset 0) ou la précédente (offset 1). */
export function windowVolume(series: number[], period: Period, offset: 0 | 1 = 0): number {
  const end = series.length - offset * period;
  return sum(series.slice(Math.max(0, end - period), end));
}

export function evolution(current: number, previous: number): number | null {
  return previous === 0 ? null : (current - previous) / previous;
}

export function needCountries(need: Need): Iso3[] {
  return Object.keys(need.series);
}

export interface NeedStats {
  need: Need;
  scope: Iso3 | null;
  current: number;
  previous: number;
  evolution: number | null;
  score: ScoreDetail;
  /** Volumes par pays, du plus fort au plus faible (toujours au niveau mondial). */
  byCountry: { iso: Iso3; current: number; previous: number }[];
}

/** Statistiques d'un besoin, dans le monde (scope null) ou dans un pays. */
export function needStats(need: Need, period: Period, scope: Iso3 | null): NeedStats {
  const byCountry = needCountries(need)
    .map((iso) => ({ iso, current: windowVolume(need.series[iso], period, 0), previous: windowVolume(need.series[iso], period, 1) }))
    .sort((a, b) => b.current - a.current);
  const rows = scope ? byCountry.filter((c) => c.iso === scope) : byCountry;
  const current = sum(rows.map((r) => r.current));
  const previous = sum(rows.map((r) => r.previous));
  const evo = evolution(current, previous);
  return { need, scope, current, previous, evolution: evo, score: computeScore(need.criteria, evo), byCountry };
}

export type SortKey = 'score' | 'volume';

/** Besoins visibles avec les filtres, classés. Un besoin absent du pays choisi est exclu. */
export function rankNeeds(data: Dataset, filters: Filters, scope: Iso3 | null, sort: SortKey = 'score'): NeedStats[] {
  return data.needs
    .filter((n) => filters.category === 'all' || n.category === filters.category)
    .filter((n) => !scope || scope in n.series)
    .map((n) => needStats(n, filters.period, scope))
    .filter((s) => s.current > 0)
    .sort((a, b) => (sort === 'score' ? b.score.exact - a.score.exact || b.current - a.current : b.current - a.current));
}

export interface CountryStats { iso: Iso3; current: number; previous: number; evolution: number | null; topNeed: NeedStats | null; needCount: number }

/** Total des demandes d'un pays avec les filtres, et son besoin le plus demandé. */
export function countryStats(data: Dataset, filters: Filters, iso: Iso3): CountryStats {
  const ranked = rankNeeds(data, filters, iso, 'volume');
  const current = sum(ranked.map((s) => s.current));
  const previous = sum(ranked.map((s) => s.previous));
  return { iso, current, previous, evolution: evolution(current, previous), topNeed: ranked[0] ?? null, needCount: ranked.length };
}

export interface DailySeries { dates: string[]; current: number[]; previous: number[] }

/** Courbe quotidienne d'un besoin sur la période, avec la période précédente alignée jour pour jour. */
export function dailySeries(need: Need, period: Period, scope: Iso3 | null, endDate: string, days: number): DailySeries {
  const isos = scope ? [scope] : needCountries(need);
  const total = Array.from({ length: days }, (_, i) => sum(isos.map((c) => need.series[c]?.[i] ?? 0)));
  const end = new Date(`${endDate}T12:00:00Z`);
  const dates = Array.from({ length: period }, (_, i) => {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - (period - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  return { dates, current: total.slice(days - period), previous: total.slice(days - 2 * period, days - period) };
}

/** Dates de début et de fin des deux périodes comparées. */
export function periodRanges(endDate: string, period: Period) {
  const shift = (n: number) => {
    const d = new Date(`${endDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };
  return { current: [shift(period - 1), shift(0)], previous: [shift(2 * period - 1), shift(period)] } as const;
}
