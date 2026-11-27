import { describe, expect, it } from 'vitest';
import data from '../../src/data/demo-needs.json';
import type { Dataset, Period } from '../../src/data/types';
import { countryStats, dailySeries, needStats, rankNeeds, windowVolume } from '../../src/domain/aggregate';
import { computeScore, growthScore } from '../../src/domain/score';

const ds = data as unknown as Dataset;
const PERIODS: Period[] = [7, 30, 90];

describe('score', () => {
  it('respecte les pondérations 25/20/20/20/15', () => {
    const s = computeScore({ pain: 100, weakComp: 0, pay: 0, feas: 0 }, -1);
    expect(s.exact).toBe(25);
    expect(computeScore({ pain: 0, weakComp: 0, pay: 0, feas: 100 }, -1).exact).toBe(15);
    expect(computeScore({ pain: 100, weakComp: 100, pay: 100, feas: 100 }, 5).total).toBe(100);
  });
  it('convertit la croissance en note bornée', () => {
    expect(growthScore(-0.5)).toBe(0);
    expect(growthScore(-0.2)).toBe(0);
    expect(growthScore(0.3)).toBe(50);
    expect(growthScore(2)).toBe(100);
    expect(growthScore(null)).toBe(100);
  });
  it('le total affiché est l’arrondi de la somme des contributions', () => {
    for (const n of ds.needs) {
      const s = needStats(n, 30, null).score;
      expect(s.total).toBe(Math.round(s.lines.reduce((a, l) => a + l.contribution, 0)));
    }
  });
});

describe('cohérence des chiffres', () => {
  it('le volume mondial d’un besoin = somme de ses pays', () => {
    for (const p of PERIODS) for (const n of ds.needs) {
      const w = needStats(n, p, null);
      expect(w.current).toBe(w.byCountry.reduce((a, c) => a + c.current, 0));
      expect(w.previous).toBe(w.byCountry.reduce((a, c) => a + c.previous, 0));
    }
  });
  it('le total d’un pays = somme des besoins de sa liste', () => {
    for (const p of PERIODS) for (const c of ds.countries) {
      const f = { period: p, category: 'all' as const };
      expect(countryStats(ds, f, c.iso).current).toBe(rankNeeds(ds, f, c.iso).reduce((a, s) => a + s.current, 0));
    }
  });
  it('la somme des pays = somme mondiale', () => {
    const f = { period: 30 as Period, category: 'all' as const };
    const countries = ds.countries.reduce((a, c) => a + countryStats(ds, f, c.iso).current, 0);
    const world = rankNeeds(ds, f, null).reduce((a, s) => a + s.current, 0);
    expect(countries).toBe(world);
  });
  it('le graphique se somme au volume de la fiche', () => {
    for (const p of PERIODS) for (const n of ds.needs.slice(0, 8)) for (const scope of [null, Object.keys(n.series)[0]]) {
      const d = dailySeries(n, p, scope, ds.meta.endDate, ds.meta.days);
      const s = needStats(n, p, scope);
      expect(d.current.reduce((a, v) => a + v, 0)).toBe(s.current);
      expect(d.previous.reduce((a, v) => a + v, 0)).toBe(s.previous);
      expect(d.dates.at(-1)).toBe(ds.meta.endDate);
    }
  });
  it('les fenêtres ne se chevauchent pas', () => {
    const s = Array.from({ length: 180 }, (_, i) => i);
    expect(windowVolume(s, 7, 0)).toBe(173 + 174 + 175 + 176 + 177 + 178 + 179);
    expect(windowVolume(s, 7, 1)).toBe(166 + 167 + 168 + 169 + 170 + 171 + 172);
  });
  it('le filtre de catégorie s’applique', () => {
    const r = rankNeeds(ds, { period: 30, category: 'sante' }, null);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((s) => s.need.category === 'sante')).toBe(true);
  });
});
