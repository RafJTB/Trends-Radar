import { useState } from 'react';
import { ArrowLeft, ListOrdered } from 'lucide-react';
import type { Dataset, Iso3 } from '../../data/types';
import type { CountryStats, NeedStats, SortKey } from '../../domain/aggregate';
import { CATEGORY_BY_ID } from '../../domain/categories';
import { evoTone, fmtEvolution, fmtInt } from '../../domain/format';
import type { ExplorerState } from '../../state/useExplorer';
import { CategoryIcon } from '../ui/CategoryIcon';
import { EmptyState } from '../ui/EmptyState';

interface Props {
  data: Dataset;
  state: ExplorerState;
  ranked: NeedStats[];
  countryName: string | null;
  countryHasData: boolean;
  countryStats: CountryStats | null;
  worldTotal: { current: number; evolution: number | null };
  onCountry: (iso: Iso3 | null) => void;
  onNeed: (id: string) => void;
  onSort: (s: SortKey) => void;
  onResetCategory: () => void;
}

export function NeedList({ data, state, ranked, countryName, countryHasData, countryStats, worldTotal, onCountry, onNeed, onSort, onResetCategory }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? ranked : ranked.slice(0, 10);
  const scopeLabel = state.country ? countryName ?? state.country : 'Monde';
  const catLabel = state.category === 'all' ? 'toutes catégories' : CATEGORY_BY_ID[state.category].label;
  const total = state.country ? countryStats : worldTotal;

  return (
    <aside className="panel panel-left" aria-label="Classement des besoins">
      <div className="panel-head">
        <h2 className="panel-title">
          <ListOrdered size={18} aria-hidden="true" />
          {state.country ? `Top 10 · ${scopeLabel}` : 'Top 10 mondial'}
        </h2>
        <p className="panel-sub">{state.period} derniers jours · {catLabel}</p>
        <div className="scope-chips" role="group" aria-label="Choisir une zone">
          <button type="button" className="chip" aria-pressed={!state.country} onClick={() => onCountry(null)}>Monde</button>
          {data.countries.map((c) => (
            <button key={c.iso} type="button" className="chip" aria-pressed={state.country === c.iso} onClick={() => onCountry(c.iso)}>{c.name}</button>
          ))}
        </div>
        {total && (state.country ? countryHasData : true) && (
          <div className="scope-summary">
            <span><strong className="num">{fmtInt(total.current)}</strong> demandes</span>
            <span><span className={`evo ${evoTone(total.evolution)} num`}>{fmtEvolution(total.evolution)}</span> vs {state.period} j précédents</span>
          </div>
        )}
      </div>

      {state.country && !countryHasData ? (
        <div className="panel-body">
          <EmptyState
            title={`Données insuffisantes pour ${scopeLabel}`}
            action={<button type="button" className="btn" onClick={() => onCountry(null)}><ArrowLeft size={15} aria-hidden="true" />Revenir au monde</button>}
          >
            Cette démo couvre 5 pays : France, États-Unis, Brésil, Inde et Japon.
          </EmptyState>
        </div>
      ) : ranked.length === 0 ? (
        <div className="panel-body">
          <EmptyState
            title="Aucun besoin pour ce filtre"
            action={<button type="button" className="btn" onClick={onResetCategory}>Voir toutes les catégories</button>}
          >
            Aucune demande « {catLabel} » relevée {state.country ? `(${scopeLabel}) ` : ''}sur {state.period} jours.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="list-tools">
            <span>{ranked.length} besoin{ranked.length > 1 ? 's' : ''}</span>
            <div className="segmented" role="group" aria-label="Trier la liste">
              <button type="button" aria-pressed={state.sort === 'score'} onClick={() => onSort('score')}>Score</button>
              <button type="button" aria-pressed={state.sort === 'volume'} onClick={() => onSort('volume')}>Demandes</button>
            </div>
          </div>
          <div className="panel-body">
            <ol className="need-list">
              {visible.map((s, i) => (
                <li key={s.need.id}>
                  <button
                    type="button"
                    className="need-row"
                    aria-current={state.needId === s.need.id}
                    onClick={() => onNeed(s.need.id)}
                  >
                    <span className="need-rank num">{i + 1}</span>
                    <CategoryIcon id={s.need.category} />
                    <span>
                      <span className="need-title">{s.need.title}</span>
                      <span className="need-meta num">
                        {fmtInt(s.current)} demandes · <span className={`evo ${evoTone(s.evolution)}`}>{fmtEvolution(s.evolution)}</span>
                      </span>
                    </span>
                    <span className="score-pill num" title="Score d’opportunité sur 100"><span className="sr-only">Score </span>{s.score.total}<span className="sr-only"> sur 100</span></span>
                  </button>
                </li>
              ))}
            </ol>
            {ranked.length > 10 && (
              <button type="button" className="list-more" onClick={() => setExpanded((e) => !e)}>
                {expanded ? 'Revenir au top 10' : `Voir les ${ranked.length - 10} autres besoins`}
              </button>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
