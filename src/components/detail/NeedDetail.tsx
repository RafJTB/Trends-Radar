import { MessageSquareQuote, Wrench, X } from 'lucide-react';
import type { Dataset, Iso3, Period } from '../../data/types';
import { dailySeries, periodRanges, type NeedStats } from '../../domain/aggregate';
import { CATEGORY_BY_ID } from '../../domain/categories';
import { evoTone, fmtEvolution, fmtInt, fmtRange } from '../../domain/format';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ScoreBreakdown } from './ScoreBreakdown';
import { TrendChart } from './TrendChart';

interface Props {
  data: Dataset;
  stats: NeedStats;
  period: Period;
  countryName: (iso: Iso3) => string;
  selectedCountry: Iso3 | null;
  onCountry: (iso: Iso3 | null) => void;
  onClose: () => void;
}

export function NeedDetail({ data, stats, period, countryName, selectedCountry, onCountry, onClose }: Props) {
  const { need } = stats;
  const cat = CATEGORY_BY_ID[need.category];
  const scopeLabel = stats.scope ? countryName(stats.scope) : 'Monde';
  const ranges = periodRanges(data.meta.endDate, period);
  const series = dailySeries(need, period, stats.scope, data.meta.endDate, data.meta.days);
  const maxCountry = Math.max(1, ...stats.byCountry.map((c) => c.current));
  // Quand un pays est choisi mais que le besoin n'y apparaît pas, la fiche reste au niveau mondial.
  const notInCountry = selectedCountry && !stats.scope;

  return (
    <article className="detail fade-in" key={`${need.id}-${stats.scope}`} aria-labelledby="need-title">
      <header className="detail-head">
        <CategoryIcon id={need.category} />
        <div>
          <div className="detail-cat" style={{ color: cat.color }}>{cat.label}</div>
          <h2 id="need-title">{need.title}</h2>
        </div>
        <button type="button" className="btn ghost icon detail-close" onClick={onClose} aria-label="Fermer la fiche">
          <X size={18} />
        </button>
      </header>
      <p className="detail-summary">{need.summary}</p>
      <div className="context-line">
        Zone : <strong>{scopeLabel}</strong> · {period} derniers jours ({fmtRange(ranges.current)})
        {notInCountry && <> · ce besoin n’est pas relevé dans le pays choisi ({countryName(selectedCountry!)})</>}
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="kpi-label">Score d’opportunité</div>
          <div className="kpi-value num">{stats.score.total}<small> / 100</small></div>
          <div className="kpi-note">Plus il est haut, plus le besoin est intéressant à traiter.</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Demandes ({period} j)</div>
          <div className="kpi-value num">{fmtInt(stats.current)}</div>
          <div className="kpi-note num">
            <span className={`evo ${evoTone(stats.evolution)}`}>{fmtEvolution(stats.evolution)}</span> vs {fmtRange(ranges.previous)}
            <br />({fmtInt(stats.previous)} → {fmtInt(stats.current)})
          </div>
        </div>
      </div>

      <ScoreBreakdown score={stats.score} evolution={stats.evolution} color={cat.color} />

      <section aria-labelledby="evo-title">
        <h3 className="section-title" id="evo-title">Évolution quotidienne <span className="tag context-line">{scopeLabel}</span></h3>
        <TrendChart
          period={period}
          series={series}
          color={cat.color}
          label={`Demandes par jour pour ${need.title}, ${scopeLabel}. ${fmtInt(stats.current)} sur la période contre ${fmtInt(stats.previous)} sur la période précédente.`}
        />
      </section>

      <section aria-labelledby="countries-title">
        <h3 className="section-title" id="countries-title">Pays où le besoin apparaît</h3>
        <div className="country-bars">
          {stats.byCountry.map((c) => (
            <button
              key={c.iso}
              type="button"
              className="country-bar"
              aria-pressed={selectedCountry === c.iso}
              onClick={() => onCountry(selectedCountry === c.iso ? null : c.iso)}
              title={selectedCountry === c.iso ? 'Revenir au monde' : `Voir ${countryName(c.iso)}`}
            >
              <span>{countryName(c.iso)}</span>
              <span className="bar"><i style={{ width: `${(c.current / maxCountry) * 100}%`, '--c': cat.color } as React.CSSProperties} /></span>
              <span className="v num">{fmtInt(c.current)}</span>
            </button>
          ))}
        </div>
        <p className="section-note">Ces pays sont entourés sur le globe. Clique sur un pays pour y voir les chiffres.</p>
      </section>

      <section aria-labelledby="msg-title">
        <h3 className="section-title" id="msg-title"><MessageSquareQuote size={14} aria-hidden="true" />Exemples de messages</h3>
        <div className="messages">
          {need.messages.map((m, i) => (
            <blockquote className="message" key={i}>
              « {m.text} »
              <footer><span className="fictif">Fictif</span>{countryName(m.country)}{m.country !== 'FRA' && ' · traduit'}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section aria-labelledby="sol-title">
        <h3 className="section-title" id="sol-title"><Wrench size={14} aria-hidden="true" />Solutions existantes et leurs limites</h3>
        <ul className="solutions">
          {need.solutions.map((s) => (
            <li key={s.name}><strong>{s.name}</strong><span>{s.limit}</span></li>
          ))}
        </ul>
      </section>
    </article>
  );
}
