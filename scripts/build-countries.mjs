// Convertit les contours Natural Earth 1:110m (domaine public, via le paquet world-atlas)
// en GeoJSON local, avec un code ISO alpha-3, un nom français et un point de vue par pays.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const topo = require('world-atlas/countries-110m.json');
const iso = require('i18n-iso-countries');
iso.registerLocale(require('i18n-iso-countries/langs/fr.json'));

// Territoires sans code numérique ISO dans Natural Earth.
const MANUAL = { 'N. Cyprus': ['XNC', 'Chypre du Nord'], Somaliland: ['XSL', 'Somaliland'], Kosovo: ['XKX', 'Kosovo'] };
// Points de vue choisis à la main pour les pays avec données (évite la Guyane, l'Alaska…).
const VIEWS = { FRA: [2.4, 46.6, 3.4], USA: [-98, 39, 2.3], BRA: [-53, -12, 2.4], IND: [79, 22, 2.8], JPN: [137.5, 37.5, 3.5] };

const ring = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); };
const round = (n) => Math.round(n * 1000) / 1000;

const fc = feature(topo, topo.objects.countries);
fc.features = fc.features.map((f) => {
  const en = f.properties.name;
  const code = f.id ? iso.numericToAlpha3(f.id) : MANUAL[en]?.[0];
  const SHORT = { USA: 'États-Unis', TZA: 'Tanzanie', COD: 'RD Congo', COG: 'Congo', GBR: 'Royaume-Uni' };
  const name = SHORT[code] ?? ((f.id ? iso.getName(code, 'fr', { select: 'alias' }) : MANUAL[en]?.[1]) || en);
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const main = polys.reduce((best, p) => (ring(p[0]) > ring(best[0]) ? p : best), polys[0]);
  const wraps = Math.max(...main[0].map((c) => c[0])) - Math.min(...main[0].map((c) => c[0])) > 300;
  const xs = main[0].map((c) => (wraps && c[0] < 0 ? c[0] + 360 : c[0])), ys = main[0].map((c) => c[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const extent = Math.max(maxX - minX, (maxY - minY) * 1.4);
  let cx = (minX + maxX) / 2; // longitudes décalées si le polygone traverse l'antiméridien
  if (cx > 180) cx -= 360;
  const view = VIEWS[code] ?? [cx, (minY + maxY) / 2, Math.min(4.2, Math.max(1.2, Math.log2(360 / extent) - 1))];
  const coordinates = JSON.parse(JSON.stringify(f.geometry.coordinates, (_, v) => (typeof v === 'number' ? round(v) : v)));
  return { type: 'Feature', properties: { iso: code ?? `X${f.id}`, name, cx: round(view[0]), cy: round(view[1]), z: round(view[2]) }, geometry: { ...f.geometry, coordinates } };
});

writeFileSync(new URL('../public/data/countries.geojson', import.meta.url), JSON.stringify(fc));

// Graticule (méridiens et parallèles tous les 20°), pour l'ambiance « radar ».
const lines = [];
for (let lng = -180; lng < 180; lng += 20) lines.push(Array.from({ length: 37 }, (_, i) => [lng, -90 + i * 5]));
for (let lat = -80; lat <= 80; lat += 20) lines.push(Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat]));
writeFileSync(new URL('../public/data/graticule.geojson', import.meta.url), JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: lines } }] }));
console.log(`${fc.features.length} pays écrits dans public/data/countries.geojson`);
