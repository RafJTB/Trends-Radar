import type { FeatureCollection, Geometry } from 'geojson';
import type { Iso3 } from './types';

export interface CountryProps { iso: Iso3; name: string; cx: number; cy: number; z: number }
export type CountriesGeo = FeatureCollection<Geometry, CountryProps>;

export async function loadCountries(): Promise<CountriesGeo> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/countries.geojson`);
  if (!res.ok) throw new Error(`Contours des pays introuvables (${res.status})`);
  return res.json();
}
