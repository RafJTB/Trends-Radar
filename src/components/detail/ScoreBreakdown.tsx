import type { ScoreDetail } from '../../domain/score';
import { GROWTH_CEIL, GROWTH_FLOOR } from '../../domain/score';
import { fmtDec, fmtEvolution } from '../../domain/format';

export function ScoreBreakdown({ score, evolution, color }: { score: ScoreDetail; evolution: number | null; color: string }) {
  return (
    <section aria-labelledby="score-title">
      <h3 className="section-title" id="score-title">Détail du score</h3>
      <div className="score-lines">
        {score.lines.map((l) => (
          <div className="score-line" key={l.key}>
            <div className="lbl">
              <b>{l.label}</b>
              <span className="num">{l.value} × {Math.round(l.weight * 100)} % = <strong>{fmtDec(l.contribution)}</strong></span>
            </div>
            <span className="bar" role="img" aria-label={`${l.label} : ${l.value} sur 100`}>
              <i style={{ width: `${l.value}%`, '--c': color } as React.CSSProperties} />
            </span>
          </div>
        ))}
      </div>
      <div className="score-total num">
        <span>Somme des contributions</span>
        <span>{fmtDec(score.exact)} → <strong>{score.total} / 100</strong></span>
      </div>
      <p className="score-help">
        Chaque critère est noté sur 100 puis pondéré. La croissance vient de l’évolution de la période
        ({fmtEvolution(evolution)} → {score.lines.find((l) => l.key === 'growth')?.value} / 100 ;
        {' '}{Math.round(GROWTH_FLOOR * 100)} % ou moins = 0, +{Math.round(GROWTH_CEIL * 100)} % ou plus = 100).
      </p>
    </section>
  );
}
