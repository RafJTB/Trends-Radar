const nf = new Intl.NumberFormat('fr-FR');
export const fmtInt = (n: number) => nf.format(Math.round(n));
export const fmtDec = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);

export function fmtEvolution(evo: number | null): string {
  if (evo === null) return 'nouveau';
  const pct = Math.round(evo * 100);
  return `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct)} %`;
}

export const evoTone = (evo: number | null) => (evo === null || evo > 0.02 ? 'up' : evo < -0.02 ? 'down' : 'flat');

const dShort = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dLong = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const fmtDate = (iso: string) => dShort.format(new Date(`${iso}T12:00:00Z`));
export const fmtDateLong = (iso: string) => dLong.format(new Date(`${iso}T12:00:00Z`));
export const fmtRange = ([a, b]: readonly [string, string] | readonly string[]) => `${fmtDate(a)} – ${fmtDate(b)}`;
