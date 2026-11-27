import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import type { CategoryId } from '../../data/types';
import { CATEGORIES, CATEGORY_BY_ID } from '../../domain/categories';

type Value = CategoryId | 'all';
const OPTIONS: { id: Value; label: string; color?: string }[] = [{ id: 'all', label: 'Toutes les catégories' }, ...CATEGORIES];

export function CategorySelect({ value, onChange }: { value: Value; onChange: (v: Value) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, OPTIONS.findIndex((o) => o.id === value)));
    list.current?.focus();
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, value]);

  const pick = (v: Value) => { onChange(v); setOpen(false); root.current?.querySelector('button')?.focus(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % OPTIONS.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + OPTIONS.length) % OPTIONS.length); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(OPTIONS[active].id); }
    else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); }
  };

  const current = value === 'all' ? null : CATEGORY_BY_ID[value];
  return (
    <div className="select" ref={root}>
      <button
        type="button"
        className="select-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Catégorie : ${current ? current.label : 'toutes'}`}
        onClick={() => setOpen((o) => !o)}
      >
        {current ? <span className="cat-dot" style={{ background: current.color }} /> : <LayoutGrid size={15} color="#7088a8" aria-hidden="true" />}
        <span>{current ? current.label : 'Toutes les catégories'}</span>
        <ChevronDown className="chev" size={15} aria-hidden="true" />
      </button>
      {open && (
        <ul className="select-list" role="listbox" tabIndex={-1} ref={list} aria-label="Catégorie" aria-activedescendant={`${id}-${active}`} onKeyDown={onKey}>
          {OPTIONS.map((o, i) => (
            <li key={o.id} id={`${id}-${i}`} role="option" aria-selected={o.id === value} className={i === active ? 'active' : ''} onClick={() => pick(o.id)} onMouseEnter={() => setActive(i)}>
              {o.color ? <span className="cat-dot" style={{ background: o.color }} /> : <LayoutGrid size={14} color="#7088a8" aria-hidden="true" />}
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
