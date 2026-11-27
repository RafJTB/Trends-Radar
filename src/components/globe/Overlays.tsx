import { AlertTriangle } from 'lucide-react';
import type { CountryStats } from '../../domain/aggregate';
import { fmtInt } from '../../domain/format';
import type { HoverInfo } from './Globe';

export function Legend({ title, max }: { title: string; max: number }) {
  return (
    <div className="legend" aria-label="Légende du globe">
      <div className="legend-title">{title}</div>
      <div className="legend-bar" aria-hidden="true" />
      <div className="legend-scale num"><span>0</span><span>{fmtInt(max / 2)}</span><span>{fmtInt(max)}</span></div>
      <div className="legend-nodata"><i aria-hidden="true" />Données insuffisantes</div>
    </div>
  );
}

interface TooltipProps {
  hover: HoverInfo;
  stats: CountryStats | null;
  period: number;
  need: { title: string; volume: number } | null;
  bounds: { w: number; h: number };
}

export function HoverTooltip({ hover, stats, period, need, bounds }: TooltipProps) {
  // Garder l'infobulle dans la zone du globe
  const left = Math.min(hover.x + 16, bounds.w - 290);
  const top = Math.min(hover.y + 16, bounds.h - 130);
  return (
    <div className="tooltip" style={{ left: Math.max(8, left), top: Math.max(8, top) }} role="status">
      <div className="tooltip-name">{hover.name}</div>
      {!stats ? (
        <div className="tooltip-row">Données insuffisantes</div>
      ) : (
        <>
          <div className="tooltip-row"><strong className="num">{fmtInt(stats.current)}</strong> demandes sur {period} jours</div>
          <div className="tooltip-row">Besoin le plus demandé : <strong>{stats.topNeed?.need.title ?? 'aucun'}</strong></div>
          {need && <div className="tooltip-row">« {need.title} » : <strong className="num">{fmtInt(need.volume)}</strong></div>}
        </>
      )}
    </div>
  );
}

export function GlobeFallback({ message }: { message: string }) {
  return (
    <div className="globe-fallback">
      <div className="empty">
        <AlertTriangle size={40} color="#fbbf24" aria-hidden="true" />
        <h3>Le globe 3D ne peut pas s’afficher</h3>
        <p>{message}</p>
        <p>Tu peux tout consulter avec la liste : choisis une zone et un besoin dans le panneau de gauche.</p>
      </div>
    </div>
  );
}
