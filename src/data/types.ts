// Format des données. Une vraie source devra produire exactement cette structure.

export type CategoryId =
  | 'technologie' | 'economie' | 'sante' | 'sport'
  | 'culture' | 'voyages' | 'immobilier' | 'environnement';

/** Code pays ISO 3166-1 alpha-3 (ex. « FRA »). */
export type Iso3 = string;

export interface Criteria {
  /** Douleur ressentie (0-100). */
  pain: number;
  /** Faiblesse de la concurrence (0-100 : 100 = aucune bonne solution). */
  weakComp: number;
  /** Disposition à payer (0-100). */
  pay: number;
  /** Faisabilité technique pour une petite équipe (0-100). */
  feas: number;
}

export interface Need {
  id: string;
  category: CategoryId;
  title: string;
  summary: string;
  keywords: string[];
  criteria: Criteria;
  messages: { country: Iso3; text: string }[];
  solutions: { name: string; limit: string }[];
  /** Demandes par jour et par pays, du plus ancien au plus récent (dernier jour = meta.endDate). */
  series: Record<Iso3, number[]>;
}

export interface Dataset {
  meta: { demo: boolean; description: string; endDate: string; days: number; generatedBy: string };
  countries: { iso: Iso3; name: string }[];
  needs: Need[];
}

export type Period = 7 | 30 | 90;
