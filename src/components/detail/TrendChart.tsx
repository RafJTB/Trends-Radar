import { useEffect, useRef, useState } from 'react';
import type { DailySeries } from '../../domain/aggregate';
import { fmtDate, fmtInt } from '../../domain/format';

const H = 150;
const PAD = { l: 34, r: 8, t: 10, b: 22 };

export function TrendChart({ series, color, label, period }: { series: DailySeries; color: string; label: string; period: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(340);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = series.current.length;
  const max = Math.max(1, ...series.current, ...series.previous);
  const niceMax = (() => { const p = 10 ** Math.floor(Math.log10(max)); return Math.ceil(max / p) * p; })();
  const x = (i: number) => PAD.l + (i / Math.max(1, n - 1)) * (w - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / niceMax) * (H - PAD.t - PAD.b);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${path(series.current)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const gid = `g-${color.slice(1)}`;
  const ticks = [0, Math.floor((n - 1) / 2), n - 1];

  const onMove = (e: React.PointerEvent) => {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - PAD.l) / (w - PAD.l - PAD.r)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div className="chart" ref={box}>
      <svg height={H} role="img" aria-label={label} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".32" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD.l} x2={w - PAD.r} y1={y(niceMax * f)} y2={y(niceMax * f)} stroke="rgb(56 189 248 / .1)" />
            <text x={PAD.l - 6} y={y(niceMax * f) + 4} textAnchor="end" fontSize="10" fill="#7088a8">{fmtInt(niceMax * f)}</text>
          </g>
        ))}
        {ticks.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="10" fill="#7088a8">{fmtDate(series.dates[i])}</text>
        ))}
        <path d={path(series.previous)} fill="none" stroke="#7088a8" strokeWidth="1.4" strokeDasharray="4 4" />
        <path d={area} fill={`url(#${gid})`} />
        <path d={path(series.current)} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="rgb(230 241 255 / .3)" />
            <circle cx={x(hover)} cy={y(series.current[hover])} r="3.5" fill={color} />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="chart-tip num" style={{ left: Math.min(Math.max(x(hover), 70), w - 70), top: y(series.current[hover]) - 8 }}>
          {fmtDate(series.dates[hover])} : <strong>{fmtInt(series.current[hover])}</strong> · période préc. {fmtInt(series.previous[hover])}
        </div>
      )}
      <div className="chart-legend">
        <span><i style={{ borderColor: color }} />{period} derniers jours</span>
        <span><i style={{ borderColor: '#7088a8', borderTopStyle: 'dashed' }} />{period} jours précédents</span>
      </div>
    </div>
  );
}
