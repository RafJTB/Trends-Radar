import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Globe2, Search } from 'lucide-react';
import type { CategoryId, Iso3, Need } from '../../data/types';
import { CategoryIcon } from '../ui/CategoryIcon';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Option =
  | { kind: 'need'; id: string; label: string; category: CategoryId }
  | { kind: 'country'; id: Iso3; label: string; hasData: boolean };

interface Props {
  needs: Need[];
  countries: { iso: Iso3; name: string; hasData: boolean }[];
  onNeed: (id: string, category: CategoryId) => void;
  onCountry: (iso: Iso3) => void;
}

export function SearchBox({ needs, countries, onNeed, onCountry }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  const options = useMemo<Option[]>(() => {
    const t = norm(q.trim());
    if (!t) return [];
    // Pertinence : titre, puis mots-clés, puis description
    const rank = (x: Need) => (norm(x.title).includes(t) ? 0 : norm(x.keywords.join(' ')).includes(t) ? 1 : norm(x.summary).includes(t) ? 2 : -1);
    const n = needs
      .map((x) => ({ x, r: rank(x) }))
      .filter((o) => o.r >= 0)
      .sort((a, b) => a.r - b.r)
      .slice(0, 6)
      .map(({ x }) => ({ kind: 'need' as const, id: x.id, label: x.title, category: x.category }));
    const c = countries
      .filter((x) => norm(x.name).includes(t))
      .sort((a, b) => Number(b.hasData) - Number(a.hasData) || Number(!norm(a.name).startsWith(t)) - Number(!norm(b.name).startsWith(t)))
      .slice(0, 5)
      .map((x) => ({ kind: 'country' as const, id: x.iso, label: x.name, hasData: x.hasData }));
    return [...n, ...c];
  }, [q, needs, countries]);

  useEffect(() => setActive(0), [q]);

  // Ctrl K / Cmd K : focus sur la recherche
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const choose = (o: Option) => {
    if (o.kind === 'need') onNeed(o.id, o.category);
    else onCountry(o.id);
    setQ('');
    setOpen(false);
    input.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && options[active]) { e.preventDefault(); choose(options[active]); }
    else if (e.key === 'Escape') { setOpen(false); setQ(''); }
  };

  const show = open && q.trim().length > 0;
  const firstCountry = options.findIndex((o) => o.kind === 'country');

  return (
    <div className="search">
      <div className="search-box">
        <Search size={16} aria-hidden="true" />
        <input
          ref={input}
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={show && options[active] ? `${listId}-${active}` : undefined}
          aria-label="Rechercher un besoin ou un pays"
          placeholder="Besoin ou pays…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
        />
        <span className="kbd" aria-hidden="true">{isMac ? '⌘ K' : 'Ctrl K'}</span>
      </div>
      {show && (
        <ul className="search-results" id={listId} role="listbox" aria-label="Résultats">
          {options.length === 0 && <li className="search-empty" role="presentation">Aucun besoin ni pays ne correspond à « {q} ».</li>}
          {options.map((o, i) => (
            <li key={`${o.kind}-${o.id}`} role="presentation">
              {i === 0 && o.kind === 'need' && <div className="search-group">Besoins</div>}
              {i === firstCountry && <div className="search-group">Pays</div>}
              <div
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className="search-option"
                onMouseDown={(e) => { e.preventDefault(); choose(o); }}
                onMouseEnter={() => setActive(i)}
              >
                {o.kind === 'need' ? <CategoryIcon id={o.category} size="sm" /> : <Globe2 size={16} color="#7088a8" aria-hidden="true" />}
                <span>{o.label}</span>
                {o.kind === 'country' && !o.hasData && <small>Données insuffisantes</small>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
