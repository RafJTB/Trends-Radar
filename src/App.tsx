import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe2, Info } from 'lucide-react';
import { loadCountries, type CountriesGeo } from './data/countries';
import { demoSource } from './data/source';
import type { Dataset, Iso3 } from './data/types';
import { countryStats, needStats, rankNeeds, evolution, type CountryStats } from './domain/aggregate';
import { CATEGORY_BY_ID } from './domain/categories';
import { WEIGHTS } from './domain/score';
import { useExplorer } from './state/useExplorer';
import { useMedia, useReducedMotion } from './state/useMedia';
import { TopBar, DemoBadge } from './components/layout/TopBar';
import { SearchBox } from './components/layout/SearchBox';
import { CategorySelect } from './components/layout/CategorySelect';
import { PeriodSwitch } from './components/layout/PeriodSwitch';
import { NeedList } from './components/needs/NeedList';
import { NeedDetail } from './components/detail/NeedDetail';
import { Globe, hasWebGL2, type CountryPaint, type HoverInfo } from './components/globe/Globe';
import { GlobeFallback, HoverTooltip, Legend } from './components/globe/Overlays';
import { EmptyState } from './components/ui/EmptyState';

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: Dataset; geo: CountriesGeo | null; geoError: string | null };

export default function App() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoad({ status: 'loading' });
    Promise.allSettled([demoSource.load(), loadCountries()]).then(([d, g]) => {
      if (!alive) return;
      if (d.status === 'rejected') return setLoad({ status: 'error', message: String(d.reason?.message ?? d.reason) });
      setLoad({
        status: 'ready',
        data: d.value,
        geo: g.status === 'fulfilled' ? g.value : null,
        geoError: g.status === 'rejected' ? 'Les contours des pays n’ont pas pu être chargés.' : null,
      });
    });
    return () => { alive = false; };
  }, [attempt]);

  if (load.status === 'loading') return <Shell><div className="loading" role="status">Chargement des données…</div></Shell>;
  if (load.status === 'error')
    return (
      <Shell>
        <EmptyState title="Les données n’ont pas pu être chargées" action={<button className="btn" onClick={() => setAttempt((a) => a + 1)}>Réessayer</button>}>
          {load.message}
        </EmptyState>
      </Shell>
    );
  return <Explorer data={load.data} geo={load.geo} geoError={load.geoError} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="stars" aria-hidden="true" />
      <div className="app" style={{ display: 'block' }}>
        <TopBar><DemoBadge /></TopBar>
        {children}
      </div>
    </>
  );
}

function Explorer({ data, geo, geoError }: { data: Dataset; geo: CountriesGeo | null; geoError: string | null }) {
  const [state, dispatch] = useExplorer();
  const reducedMotion = useReducedMotion();
  const mobile = useMedia('(max-width: 960px)');
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [globeError, setGlobeError] = useState<string | null>(() =>
    geoError ?? (hasWebGL2() ? null : 'Ton navigateur ou ta carte graphique ne prend pas en charge WebGL 2.'),
  );
  const center = useRef<HTMLDivElement>(null);

  const dataIsos = useMemo(() => new Set(data.countries.map((c) => c.iso)), [data]);
  const names = useMemo(() => {
    const m = new Map<Iso3, string>(geo?.features.map((f) => [f.properties.iso, f.properties.name]) ?? []);
    for (const c of data.countries) m.set(c.iso, c.name);
    return m;
  }, [geo, data]);
  const countryName = useCallback((iso: Iso3) => names.get(iso) ?? iso, [names]);

  const filters = useMemo(() => ({ period: state.period, category: state.category }), [state.period, state.category]);
  const countryHasData = state.country ? dataIsos.has(state.country) : true;

  // ── Chiffres dérivés, tous issus de domain/aggregate
  const statsByCountry = useMemo(() => {
    const m = new Map<Iso3, CountryStats>();
    for (const c of data.countries) m.set(c.iso, countryStats(data, filters, c.iso));
    return m;
  }, [data, filters]);

  const worldTotal = useMemo(() => {
    const all = [...statsByCountry.values()];
    const current = all.reduce((s, c) => s + c.current, 0);
    const previous = all.reduce((s, c) => s + c.previous, 0);
    return { current, evolution: evolution(current, previous) };
  }, [statsByCountry]);

  const ranked = useMemo(
    () => (countryHasData ? rankNeeds(data, filters, state.country, state.sort) : []),
    [data, filters, state.country, state.sort, countryHasData],
  );

  const need = state.needId ? data.needs.find((n) => n.id === state.needId) ?? null : null;
  const activeNeed = need && (state.category === 'all' || need.category === state.category) ? need : null;
  const detail = useMemo(() => {
    if (!activeNeed) return null;
    const scope = state.country && state.country in activeNeed.series ? state.country : null;
    return needStats(activeNeed, state.period, scope);
  }, [activeNeed, state.country, state.period]);

  // ── Couleurs du globe : demandes par pays, ou demandes du besoin sélectionné
  const { paint, legendMax, legendTitle } = useMemo(() => {
    const values = new Map<Iso3, number>();
    if (detail) for (const c of detail.byCountry) values.set(c.iso, c.current);
    else for (const [iso, s] of statsByCountry) values.set(iso, s.current);
    const max = Math.max(0, ...values.values());
    const p: Record<Iso3, CountryPaint> = {};
    for (const iso of dataIsos) {
      const v = values.get(iso);
      p[iso] = v === undefined ? { kind: 'dim', t: 0 } : { kind: 'data', t: max ? v / max : 0 };
    }
    const cat = state.category === 'all' ? '' : ` · ${CATEGORY_BY_ID[state.category].label}`;
    return {
      paint: p,
      legendMax: max,
      legendTitle: detail ? `Demandes pour ce besoin (${state.period} j)` : `Demandes sur ${state.period} jours${cat}`,
    };
  }, [detail, statsByCountry, dataIsos, state.category, state.period]);

  const highlight = useMemo(() => detail?.byCountry.map((c) => c.iso) ?? [], [detail]);
  const highlightColor = activeNeed ? CATEGORY_BY_ID[activeNeed.category].color : '#22d3ee';

  const searchCountries = useMemo(
    () => [...names].map(([iso, name]) => ({ iso, name, hasData: dataIsos.has(iso) })),
    [names, dataIsos],
  );

  const selectCountry = useCallback((iso: Iso3 | null) => dispatch({ type: 'country', country: iso }), [dispatch]);
  const selectNeed = (id: string | null) => dispatch({ type: 'need', needId: id });

  const hoverStats = hover ? statsByCountry.get(hover.iso) ?? null : null;
  const hoverNeed = hover && detail ? detail.byCountry.find((c) => c.iso === hover.iso) : undefined;
  const bounds = { w: center.current?.clientWidth ?? 800, h: center.current?.clientHeight ?? 600 };

  return (
    <>
      <div className="stars" aria-hidden="true" />
      <div className="app">
        <TopBar>
          <SearchBox
            needs={data.needs}
            countries={searchCountries}
            onNeed={(id, category) => dispatch({ type: 'need', needId: id, category })}
            onCountry={selectCountry}
          />
          <CategorySelect value={state.category} onChange={(c) => dispatch({ type: 'category', category: c })} />
          <PeriodSwitch value={state.period} onChange={(p) => dispatch({ type: 'period', period: p })} />
          <DemoBadge />
        </TopBar>

        <NeedList
          data={data}
          state={state}
          ranked={ranked}
          countryName={state.country ? countryName(state.country) : null}
          countryHasData={countryHasData}
          countryStats={state.country ? statsByCountry.get(state.country) ?? null : null}
          worldTotal={worldTotal}
          onCountry={selectCountry}
          onNeed={(id) => selectNeed(state.needId === id ? null : id)}
          onSort={(sort) => dispatch({ type: 'sort', sort })}
          onResetCategory={() => dispatch({ type: 'category', category: 'all' })}
        />

        <main className="center" ref={center} aria-label="Globe des besoins">
          {globeError || !geo ? (
            <GlobeFallback message={globeError ?? 'Les contours des pays sont indisponibles.'} />
          ) : (
            <>
              <div className="globe-ring" aria-hidden="true" />
              <Globe
                countries={geo}
                paint={paint}
                highlight={highlight}
                highlightColor={highlightColor}
                selected={state.country}
                worldViewTick={state.worldViewTick}
                reducedMotion={reducedMotion}
                onHover={setHover}
                onSelect={selectCountry}
                onError={(m) => setGlobeError(`Le moteur 3D n’a pas pu démarrer (${m}).`)}
                onInteract={() => setInteracted(true)}
              />
              <div className="globe-controls">
                <button type="button" className="btn" onClick={() => dispatch({ type: 'worldView' })}>
                  <Globe2 size={16} aria-hidden="true" />Vue monde
                </button>
              </div>
              <Legend title={legendTitle} max={legendMax} />
              <div className="globe-hint" style={{ opacity: interacted ? 0 : 1 }} aria-hidden="true">
                Glisse pour tourner · molette pour zoomer · clique sur un pays
              </div>
              {hover && !mobile && (
                <HoverTooltip
                  hover={hover}
                  stats={hoverStats}
                  period={state.period}
                  need={activeNeed && hoverNeed ? { title: activeNeed.title, volume: hoverNeed.current } : null}
                  bounds={bounds}
                />
              )}
            </>
          )}
        </main>

        {mobile && detail && <div className="sheet-backdrop" onClick={() => selectNeed(null)} aria-hidden="true" />}
        <aside className={`panel panel-right ${detail ? 'open' : ''}`} aria-label="Fiche du besoin">
          <div className="panel-body">
            {detail ? (
              <NeedDetail
                data={data}
                stats={detail}
                period={state.period}
                countryName={countryName}
                selectedCountry={state.country}
                onCountry={selectCountry}
                onClose={() => selectNeed(null)}
              />
            ) : (
              <EmptyState title="Choisis un besoin">
                Clique sur un besoin dans la liste pour voir son score, son évolution, des exemples de messages et les solutions existantes.
              </EmptyState>
            )}
            {!detail && (
              <div className="detail" style={{ paddingTop: 0 }}>
                <section className="kpi">
                  <h3 className="section-title"><Info size={14} aria-hidden="true" />Comment lire le score</h3>
                  <div className="score-lines">
                    {WEIGHTS.map((w) => (
                      <div className="score-line" key={w.key}>
                        <div className="lbl"><b>{w.label}</b><span className="num">{Math.round(w.weight * 100)} %</span></div>
                      </div>
                    ))}
                  </div>
                  <p className="score-help">Score sur 100. La croissance compare la période choisie à la précédente, de même durée.</p>
                </section>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
