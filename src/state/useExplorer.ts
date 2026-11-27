import { useReducer } from 'react';
import type { CategoryId, Iso3, Period } from '../data/types';
import type { SortKey } from '../domain/aggregate';

export interface ExplorerState {
  period: Period;
  category: CategoryId | 'all';
  /** Pays sélectionné (null = monde). Peut être un pays sans données. */
  country: Iso3 | null;
  needId: string | null;
  sort: SortKey;
  /** Incrémenté à chaque clic sur « Vue monde » pour recentrer le globe. */
  worldViewTick: number;
}

export type Action =
  | { type: 'period'; period: Period }
  | { type: 'category'; category: CategoryId | 'all' }
  | { type: 'country'; country: Iso3 | null }
  | { type: 'need'; needId: string | null; category?: CategoryId }
  | { type: 'sort'; sort: SortKey }
  | { type: 'worldView' };

function reducer(s: ExplorerState, a: Action): ExplorerState {
  switch (a.type) {
    case 'period': return { ...s, period: a.period };
    case 'category': return { ...s, category: a.category };
    case 'country': return { ...s, country: a.country };
    case 'need': {
      // Un besoin choisi via la recherche peut sortir du filtre de catégorie : on élargit le filtre.
      const category = a.category && s.category !== 'all' && s.category !== a.category ? 'all' : s.category;
      return { ...s, needId: a.needId, category };
    }
    case 'sort': return { ...s, sort: a.sort };
    case 'worldView': return { ...s, country: null, worldViewTick: s.worldViewTick + 1 };
  }
}

export const initialState: ExplorerState = { period: 30, category: 'all', country: null, needId: null, sort: 'score', worldViewTick: 0 };

export function useExplorer() {
  return useReducer(reducer, initialState);
}
