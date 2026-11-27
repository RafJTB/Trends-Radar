import type { ReactNode } from 'react';

/** Illustration légère aux couleurs du thème : un mini-radar. */
function RadarArt() {
  return (
    <svg className="empty-art" viewBox="0 0 120 90" aria-hidden="true">
      <defs>
        <radialGradient id="ea" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#22d3ee" stopOpacity=".35" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="45" r="40" fill="url(#ea)" />
      {[38, 26, 14].map((r) => <circle key={r} cx="60" cy="45" r={r} fill="none" stroke="#22d3ee" strokeOpacity=".35" />)}
      <path d="M60 45 L92 22" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
      <circle cx="80" cy="56" r="3" fill="#fbbf24" />
      <circle cx="44" cy="30" r="2.5" fill="#a3e635" />
      <circle cx="70" cy="34" r="2" fill="#fb7185" />
    </svg>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty fade-in">
      <RadarArt />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
