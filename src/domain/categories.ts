import { Cpu, TrendingUp, HeartPulse, Dumbbell, Clapperboard, Plane, House, Leaf, type LucideIcon } from 'lucide-react';
import type { CategoryId } from '../data/types';

export interface Category { id: CategoryId; label: string; color: string; icon: LucideIcon }

export const CATEGORIES: Category[] = [
  { id: 'technologie', label: 'Technologie', color: '#22d3ee', icon: Cpu },
  { id: 'economie', label: 'Économie', color: '#fbbf24', icon: TrendingUp },
  { id: 'sante', label: 'Santé', color: '#fb7185', icon: HeartPulse },
  { id: 'sport', label: 'Sport', color: '#a3e635', icon: Dumbbell },
  { id: 'culture', label: 'Culture', color: '#c084fc', icon: Clapperboard },
  { id: 'voyages', label: 'Voyages', color: '#60a5fa', icon: Plane },
  { id: 'immobilier', label: 'Immobilier', color: '#fb923c', icon: House },
  { id: 'environnement', label: 'Environnement', color: '#34d399', icon: Leaf },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;
