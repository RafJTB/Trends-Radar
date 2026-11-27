import type { ReactNode } from 'react';
import { RadarLogo } from '../ui/RadarLogo';

export function TopBar({ children }: { children: ReactNode }) {
  return (
    <header className="topbar">
      <div className="brand">
        <RadarLogo />
        <div>
          <h1 className="brand-name">Trend Radar</h1>
          <div className="brand-sub">Les besoins les plus demandés, pays par pays</div>
        </div>
      </div>
      <div className="topbar-tools">{children}</div>
    </header>
  );
}

export function DemoBadge() {
  return (
    <span className="demo-badge" role="note" title="Toutes les données affichées sont fictives.">
      <span className="dot" aria-hidden="true" />
      DÉMO : données fictives
    </span>
  );
}
