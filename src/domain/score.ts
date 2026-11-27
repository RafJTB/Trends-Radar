import type { Criteria } from '../data/types';

export const WEIGHTS = [
  { key: 'pain', label: 'Douleur', weight: 0.25 },
  { key: 'growth', label: 'Croissance', weight: 0.2 },
  { key: 'weakComp', label: 'Faiblesse de la concurrence', weight: 0.2 },
  { key: 'pay', label: 'Disposition à payer', weight: 0.2 },
  { key: 'feas', label: 'Faisabilité', weight: 0.15 },
] as const;

export type ScoreKey = (typeof WEIGHTS)[number]['key'];

/** Évolution −20 % ou moins → 0 ; +80 % ou plus → 100 ; linéaire entre les deux. */
export const GROWTH_FLOOR = -0.2;
export const GROWTH_CEIL = 0.8;

export function growthScore(evolution: number | null): number {
  if (evolution === null) return 100; // aucune demande avant : besoin émergent
  const s = ((evolution - GROWTH_FLOOR) / (GROWTH_CEIL - GROWTH_FLOOR)) * 100;
  return Math.round(Math.min(100, Math.max(0, s)));
}

export interface ScoreLine { key: ScoreKey; label: string; weight: number; value: number; contribution: number }
export interface ScoreDetail { lines: ScoreLine[]; exact: number; total: number }

export function computeScore(criteria: Criteria, evolution: number | null): ScoreDetail {
  const values: Record<ScoreKey, number> = { ...criteria, growth: growthScore(evolution) };
  const lines = WEIGHTS.map(({ key, label, weight }) => ({ key, label, weight, value: values[key], contribution: values[key] * weight }));
  const exact = lines.reduce((s, l) => s + l.contribution, 0);
  return { lines, exact, total: Math.round(exact) };
}
