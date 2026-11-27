import type { CategoryId } from '../../data/types';
import { CATEGORY_BY_ID } from '../../domain/categories';

export function CategoryIcon({ id, size = 'md' }: { id: CategoryId; size?: 'sm' | 'md' }) {
  const c = CATEGORY_BY_ID[id];
  const Icon = c.icon;
  return (
    <span className={`cat-icon ${size === 'sm' ? 'sm' : ''}`} style={{ '--c': c.color } as React.CSSProperties} aria-hidden="true">
      <Icon size={size === 'sm' ? 14 : 18} strokeWidth={2} />
    </span>
  );
}
