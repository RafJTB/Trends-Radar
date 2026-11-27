import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, setWorkerUrl, type GeoJSONSource, type StyleSpecification } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
type MLMap = MapLibreMap;

// Le worker de MapLibre est un fichier autonome : on le livre tel quel pour qu'il soit présent dans la build.
setWorkerUrl(workerUrl);
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CountriesGeo } from '../../data/countries';
import type { Iso3 } from '../../data/types';

export interface CountryPaint {
  /** Valeur normalisée 0-1 pour les pays avec données. */
  t: number;
  kind: 'data' | 'dim';
}

export interface HoverInfo { iso: Iso3; name: string; x: number; y: number }

interface Props {
  countries: CountriesGeo;
  /** Couleur de chaque pays ayant des données ; les autres restent gris. */
  paint: Record<Iso3, CountryPaint>;
  /** Pays mis en évidence (pays où apparaît le besoin sélectionné). */
  highlight: Iso3[];
  highlightColor: string;
  selected: Iso3 | null;
  worldViewTick: number;
  reducedMotion: boolean;
  onHover: (h: HoverInfo | null) => void;
  onSelect: (iso: Iso3) => void;
  onError: (message: string) => void;
  onInteract: () => void;
}

const SOURCE = 'countries';

const STYLE: StyleSpecification = {
  version: 8,
  projection: { type: 'globe' },
  sky: {
    'sky-color': '#030913',
    'horizon-color': '#0b3b5c',
    'sky-horizon-blend': 0.6,
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 0.6, 7, 0],
  },
  sources: {
    graticule: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
  },
  layers: [
    { id: 'ocean', type: 'background', paint: { 'background-color': '#05182e' } },
    { id: 'graticule', type: 'line', source: 'graticule', paint: { 'line-color': '#22d3ee', 'line-opacity': 0.09, 'line-width': 0.6 } },
  ],
};

/** Zoom qui fait tenir le globe dans le conteneur (diamètre ≈ 80 % du plus petit côté). */
function worldZoom(el: HTMLElement) {
  const size = Math.min(el.clientWidth, el.clientHeight);
  return Math.max(0, Math.log2((0.8 * size * Math.PI) / 512));
}
/** Les zooms par pays sont calibrés pour ~700 px : on les ajuste à la taille réelle. */
const countryZoom = (el: HTMLElement, z: number) => z + Math.log2(Math.min(el.clientWidth, el.clientHeight) / 700);

export function Globe(props: Props) {
  const { countries, paint, highlight, highlightColor, selected, worldViewTick, reducedMotion } = props;
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const [ready, setReady] = useState(false);
  const spinning = useRef(!reducedMotion);
  const cb = useRef(props);
  cb.current = props;
  const hovered = useRef<Iso3 | null>(null);
  const prevStates = useRef<Set<Iso3>>(new Set());

  // ── Création de la carte (une seule fois)
  useEffect(() => {
    const el = container.current!;
    let m: MLMap;
    try {
      m = new MapLibreMap({
        container: el,
        style: STYLE,
        center: [12, 24],
        zoom: worldZoom(el),
        minZoom: 0,
        maxZoom: 6,
        renderWorldCopies: false,
        attributionControl: { compact: true, customAttribution: 'Contours : Natural Earth' },
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        canvasContextAttributes: { antialias: true },
      });
    } catch (e) {
      cb.current.onError(e instanceof Error ? e.message : String(e));
      return;
    }
    map.current = m;
    if (import.meta.env.DEV) (window as unknown as { __map: MLMap }).__map = m;
    m.touchZoomRotate.disableRotation();
    m.keyboard.disableRotation();

    m.on('error', (e) => console.warn('[globe]', e.error?.message));
    m.on('load', () => {
      m.addSource(SOURCE, { type: 'geojson', data: countries, promoteId: 'iso' });
      fetch(`${import.meta.env.BASE_URL}data/graticule.geojson`).then((r) => r.json()).then((g) => (m.getSource('graticule') as GeoJSONSource).setData(g)).catch(() => {});
      m.addLayer({
        id: 'country-fill',
        type: 'fill',
        source: SOURCE,
        paint: {
          'fill-color': [
            'case',
            ['==', ['feature-state', 'kind'], 'data'],
            ['interpolate', ['linear'], ['coalesce', ['feature-state', 't'], 0], 0, '#0c4a6e', 0.35, '#0891b2', 0.7, '#22d3ee', 1, '#a5f3fc'],
            ['==', ['feature-state', 'kind'], 'dim'],
            '#173247',
            '#1c2a3d',
          ],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.92],
        },
      });
      m.addLayer({ id: 'country-border', type: 'line', source: SOURCE, paint: { 'line-color': '#67e8f9', 'line-opacity': 0.22, 'line-width': 0.6 } });
      m.addLayer({
        id: 'country-highlight-glow', type: 'line', source: SOURCE,
        paint: { 'line-color': highlightColor, 'line-width': 7, 'line-blur': 5, 'line-opacity': ['case', ['boolean', ['feature-state', 'highlight'], false], 0.55, 0] },
      });
      m.addLayer({
        id: 'country-highlight', type: 'line', source: SOURCE,
        paint: { 'line-color': highlightColor, 'line-width': 1.6, 'line-opacity': ['case', ['boolean', ['feature-state', 'highlight'], false], 1, 0] },
      });
      m.addLayer({
        id: 'country-selected', type: 'line', source: SOURCE,
        paint: { 'line-color': '#ffffff', 'line-width': 2.2, 'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.95, 0] },
      });
      m.addLayer({
        id: 'country-hover', type: 'line', source: SOURCE,
        paint: { 'line-color': '#e0f7ff', 'line-width': 1.4, 'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0] },
      });
      setReady(true);
      spin();
    });

    // Survol
    m.on('mousemove', 'country-fill', (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const iso = f.properties.iso as Iso3;
      if (hovered.current !== iso) {
        if (hovered.current) m.setFeatureState({ source: SOURCE, id: hovered.current }, { hover: false });
        hovered.current = iso;
        m.setFeatureState({ source: SOURCE, id: iso }, { hover: true });
      }
      m.getCanvas().style.cursor = 'pointer';
      cb.current.onHover({ iso, name: f.properties.name as string, x: e.point.x, y: e.point.y });
    });
    m.on('mouseleave', 'country-fill', () => {
      if (hovered.current) m.setFeatureState({ source: SOURCE, id: hovered.current }, { hover: false });
      hovered.current = null;
      m.getCanvas().style.cursor = '';
      cb.current.onHover(null);
    });
    m.on('click', 'country-fill', (e) => {
      const f = e.features?.[0];
      if (f) cb.current.onSelect(f.properties.iso as Iso3);
    });

    // Rotation automatique lente, arrêtée définitivement à la première interaction
    function spin() {
      if (!spinning.current || m.isMoving()) return;
      const c = m.getCenter();
      m.easeTo({ center: [c.lng - 6, c.lat], duration: 1000, easing: (t) => t });
    }
    const stop = () => {
      if (!spinning.current) return;
      spinning.current = false;
      m.stop();
      cb.current.onInteract();
    };
    m.on('moveend', spin);
    m.on('mousedown', stop);
    m.on('touchstart', stop);
    m.on('wheel', stop);
    el.addEventListener('keydown', stop);

    const ro = new ResizeObserver(() => m.resize());
    ro.observe(el);
    return () => { ro.disconnect(); m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Couleurs des pays
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const next = new Set(Object.keys(paint));
    for (const iso of prevStates.current) if (!next.has(iso)) m.setFeatureState({ source: SOURCE, id: iso }, { kind: null, t: 0 });
    for (const [iso, p] of Object.entries(paint)) m.setFeatureState({ source: SOURCE, id: iso }, { kind: p.kind, t: p.t });
    prevStates.current = next;
  }, [paint, ready]);

  // ── Mise en évidence des pays du besoin
  const prevHighlight = useRef<Iso3[]>([]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    for (const iso of prevHighlight.current) m.setFeatureState({ source: SOURCE, id: iso }, { highlight: false });
    for (const iso of highlight) m.setFeatureState({ source: SOURCE, id: iso }, { highlight: true });
    prevHighlight.current = highlight;
    m.setPaintProperty('country-highlight', 'line-color', highlightColor);
    m.setPaintProperty('country-highlight-glow', 'line-color', highlightColor);
  }, [highlight, highlightColor, ready]);

  // ── Pays sélectionné : contour + zoom animé
  const prevSelected = useRef<Iso3 | null>(null);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    if (prevSelected.current) m.setFeatureState({ source: SOURCE, id: prevSelected.current }, { selected: false });
    prevSelected.current = selected;
    if (!selected) return;
    m.setFeatureState({ source: SOURCE, id: selected }, { selected: true });
    const f = countries.features.find((x) => x.properties.iso === selected);
    if (!f) return;
    spinning.current = false;
    const { cx, cy, z } = f.properties;
    const target = { center: [cx, cy] as [number, number], zoom: countryZoom(container.current!, z) };
    if (reducedMotion) m.jumpTo(target);
    else m.flyTo({ ...target, duration: 1800, essential: true, curve: 1.3 });
  }, [selected, ready, countries, reducedMotion]);

  // ── Bouton « Vue monde »
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || worldViewTick === 0) return;
    spinning.current = false;
    const target = { center: [m.getCenter().lng, 20] as [number, number], zoom: worldZoom(container.current!), bearing: 0, pitch: 0 };
    if (reducedMotion) m.jumpTo(target);
    else m.flyTo({ ...target, duration: 1400, essential: true });
  }, [worldViewTick, ready, reducedMotion]);

  // Si l'utilisateur active « réduire les animations » en cours de route
  useEffect(() => {
    if (reducedMotion && spinning.current) { spinning.current = false; map.current?.stop(); }
  }, [reducedMotion]);

  return (
    <div
      ref={container}
      className="globe"
      role="application"
      aria-label="Globe interactif. Glisse pour le faire tourner, utilise la molette ou les touches + et − pour zoomer. Les pays sont aussi accessibles depuis la liste."
    />
  );
}

/** Vérifie la présence de WebGL 2, requis par MapLibre 6. */
export function hasWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}
