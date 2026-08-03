import {
  Component,
  ElementRef,
  viewChild,
  afterNextRender,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  Map,
  NavigationControl,
  ScaleControl,
  FullscreenControl,
  Marker,
  Popup,
  type LngLatLike,
  type StyleSpecification,
} from 'maplibre-gl';
import maplibreglPkg from 'maplibre-gl/package.json';

export interface MapStyle {
  id: string;
  label: string;
  icon: string;
  style: string | StyleSpecification;
}

export interface PoiMarker {
  id: string;
  label: string;
  lngLat: LngLatLike;
  color: string;
  description: string;
}

export interface SearchResultItem {
  id: string;
  name: string;
  subtitle: string;
  lngLat: [number, number];
  flag?: string;
  type?: string;
  zoom?: number;
}

// ── Reliable Map Styles ───────────────────────────────────────────────
export const CARTO_VOYAGER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'carto-voyager-layer',
      type: 'raster',
      source: 'carto-voyager',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export const CARTO_POSITRON_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'carto-light': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'carto-light-layer',
      type: 'raster',
      source: 'carto-light',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export const CARTO_DARK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const ESRI_SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const OPENFREEMAP_LIBERTY_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// ── Helper: Country Code to Emoji Flag ──────────────────────────────
export function countryCodeToFlagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '📍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// ── Curated Local Database for Instant Location Search ───────────────
export const POPULAR_LOCATIONS: SearchResultItem[] = [
  {
    id: 'jakarta',
    name: 'Jakarta',
    subtitle: 'DKI Jakarta, Indonesia',
    flag: '🇮🇩',
    type: 'Capital City',
    lngLat: [106.8272, -6.1751],
    zoom: 12,
  },
  {
    id: 'bandung',
    name: 'Bandung',
    subtitle: 'Jawa Barat, Indonesia',
    flag: '🇮🇩',
    type: 'City',
    lngLat: [107.6191, -6.9175],
    zoom: 13,
  },
  {
    id: 'surabaya',
    name: 'Surabaya',
    subtitle: 'Jawa Timur, Indonesia',
    flag: '🇮🇩',
    type: 'City',
    lngLat: [112.7521, -7.2575],
    zoom: 12,
  },
  {
    id: 'yogyakarta',
    name: 'Yogyakarta',
    subtitle: 'DI Yogyakarta, Indonesia',
    flag: '🇮🇩',
    type: 'Cultural Capital',
    lngLat: [110.3645, -7.7956],
    zoom: 13,
  },
  {
    id: 'bali',
    name: 'Denpasar, Bali',
    subtitle: 'Bali, Indonesia',
    flag: '🇮🇩',
    type: 'Island Province',
    lngLat: [115.2167, -8.65],
    zoom: 12,
  },
  {
    id: 'medan',
    name: 'Medan',
    subtitle: 'Sumatera Utara, Indonesia',
    flag: '🇮🇩',
    type: 'City',
    lngLat: [98.6722, 3.5952],
    zoom: 12,
  },
  {
    id: 'semarang',
    name: 'Semarang',
    subtitle: 'Jawa Tengah, Indonesia',
    flag: '🇮🇩',
    type: 'City',
    lngLat: [110.4203, -6.9932],
    zoom: 12,
  },
  {
    id: 'makassar',
    name: 'Makassar',
    subtitle: 'Sulawesi Selatan, Indonesia',
    flag: '🇮🇩',
    type: 'Port City',
    lngLat: [119.4327, -5.1477],
    zoom: 12,
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    subtitle: 'Kanto, Japan',
    flag: '🇯🇵',
    type: 'Capital City',
    lngLat: [139.6917, 35.6895],
    zoom: 12,
  },
  {
    id: 'paris',
    name: 'Paris',
    subtitle: 'Île-de-France, France',
    flag: '🇫🇷',
    type: 'Capital City',
    lngLat: [2.3522, 48.8566],
    zoom: 13,
  },
  {
    id: 'nyc',
    name: 'New York City',
    subtitle: 'New York, USA',
    flag: '🇺🇸',
    type: 'Metropolis',
    lngLat: [-74.006, 40.7128],
    zoom: 12,
  },
  {
    id: 'london',
    name: 'London',
    subtitle: 'England, United Kingdom',
    flag: '🇬🇧',
    type: 'Capital City',
    lngLat: [-0.1276, 51.5074],
    zoom: 12,
  },
  {
    id: 'singapore',
    name: 'Singapore',
    subtitle: 'Republic of Singapore',
    flag: '🇸🇬',
    type: 'City-State',
    lngLat: [103.8198, 1.3521],
    zoom: 12,
  },
  {
    id: 'sydney',
    name: 'Sydney',
    subtitle: 'New South Wales, Australia',
    flag: '🇦🇺',
    type: 'Metropolis',
    lngLat: [151.2093, -33.8688],
    zoom: 12,
  },
];

@Component({
  selector: 'app-map-demo',
  imports: [],
  styles: `
    :host { display: block; }

    .map-page {
      min-height: 100vh;
      background: var(--surface-grouped);
      color: var(--text-primary);
    }

    /* ── Header ── */
    .page-header {
      padding: 2rem 2rem 1.5rem;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--blur-lg));
      border-bottom: 1px solid var(--border-default);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-inner {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-text h1 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 0.25rem;
      background: linear-gradient(135deg, var(--color-system-blue), var(--color-system-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-text p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9375rem;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      background: var(--color-system-blue-light);
      color: var(--color-system-blue);
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      font-weight: 600;
    }

    /* ── Main content ── */
    .page-content {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem 2rem 4rem;
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }

    /* ── Section headings ── */
    .section-heading {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 1rem;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* ── Map container ── */
    .map-wrapper {
      position: relative;
      border-radius: var(--radius-xl);
      clip-path: inset(0 round var(--radius-xl));
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--border-default);
      background: var(--surface-elevated);
    }

    .map-wrapper .maplibregl-canvas {
      border-radius: var(--radius-xl);
    }

    .map-container {
      width: 100%;
      height: 520px;
    }

    /* ── Map overlay toolbar ── */
    .map-toolbar {
      position: absolute;
      top: 1rem;
      left: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 10;
    }

    .style-switcher {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      background: var(--glass-bg-thick);
      backdrop-filter: blur(var(--blur-md));
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: 0.5rem;
      box-shadow: var(--shadow-lg);
    }

    .style-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      background: transparent;
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-primary);
      cursor: pointer;
      transition: background 150ms ease, border-color 150ms ease;
      white-space: nowrap;
    }

    .style-btn:hover { background: var(--fill-primary); }

    .style-btn.active {
      background: var(--color-system-blue-light);
      border-color: var(--color-system-blue);
      color: var(--color-system-blue);
      font-weight: 600;
    }

    /* ── Info panel ── */
    .info-panel {
      position: absolute;
      bottom: 1.5rem;
      left: 1rem;
      background: var(--glass-bg-thick);
      backdrop-filter: blur(var(--blur-md));
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: 0.875rem 1rem;
      box-shadow: var(--shadow-lg);
      font-size: 0.8125rem;
      color: var(--text-secondary);
      z-index: 10;
    }

    .info-panel strong { color: var(--text-primary); display: block; margin-bottom: 0.25rem; }
    .coord-row { font-family: var(--font-mono); font-size: 0.75rem; }

    /* ── Feature cards grid ── */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .feature-card {
      background: var(--surface-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      transition: box-shadow 200ms ease, transform 200ms ease;
    }

    .feature-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .feature-icon {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }

    .feature-card h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.375rem;
    }

    .feature-card p {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    /* ── Layer controls ── */
    .layer-grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
      align-items: start;
    }

    @media (max-width: 900px) {
      .layer-grid { grid-template-columns: 1fr; }
    }

    .layer-controls {
      background: var(--surface-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
    }

    .layer-controls h3 {
      font-size: 1.0625rem;
      font-weight: 600;
      margin: 0 0 1rem;
    }

    .layer-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--separator);
    }

    .layer-item:last-child { border-bottom: none; }

    .layer-info { display: flex; align-items: center; gap: 0.75rem; }

    .layer-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .layer-label { font-size: 0.9375rem; font-weight: 500; }
    .layer-desc { font-size: 0.8125rem; color: var(--text-secondary); }

    .toggle-switch {
      position: relative;
      width: 44px;
      height: 26px;
      flex-shrink: 0;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    }

    .toggle-track {
      position: absolute;
      inset: 0;
      border-radius: var(--radius-full);
      background: var(--fill-secondary);
      cursor: pointer;
      transition: background 200ms ease;
    }

    .toggle-track::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: white;
      box-shadow: var(--shadow-sm);
      transition: transform 200ms var(--ease-spring);
    }

    .toggle-switch input:checked + .toggle-track {
      background: var(--color-system-green);
    }

    .toggle-switch input:checked + .toggle-track::after {
      transform: translateX(18px);
    }

    /* ── Geocoder / Search Section ── */
    .search-section {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
      align-items: start;
    }

    @media (max-width: 900px) {
      .search-section { grid-template-columns: 1fr; }
    }

    .geo-map-overlay {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: var(--glass-bg-thick);
      backdrop-filter: blur(var(--blur-md));
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: 0.75rem 1rem;
      box-shadow: var(--shadow-lg);
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      animation: fadeIn 200ms ease;
    }

    .geo-overlay-flag { font-size: 1.5rem; }
    .geo-overlay-title { font-weight: 700; font-size: 0.9375rem; color: var(--text-primary); }
    .geo-overlay-sub { font-size: 0.75rem; color: var(--text-secondary); font-family: var(--font-mono); }

    .search-panel {
      background: var(--surface-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .panel-header h3 {
      font-size: 1.0625rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .search-input-box {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .search-input-row {
      display: flex;
      gap: 0.5rem;
      position: relative;
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
    }

    .search-input-icon {
      position: absolute;
      left: 0.75rem;
      color: var(--text-tertiary);
      font-size: 0.875rem;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.6875rem 2rem 0.6875rem 2.25rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-opaque);
      background: var(--surface-primary);
      color: var(--text-primary);
      font: inherit;
      font-size: 0.9375rem;
      outline: none;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }

    .search-input:focus {
      border-color: var(--color-system-blue);
      box-shadow: var(--form-control-glow);
    }

    .search-clear-btn {
      position: absolute;
      right: 0.625rem;
      background: var(--fill-secondary);
      border: none;
      color: var(--text-secondary);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      cursor: pointer;
      transition: background 150ms ease, color 150ms ease;
    }

    .search-clear-btn:hover {
      background: var(--fill-tertiary);
      color: var(--text-primary);
    }

    .search-btn {
      padding: 0.6875rem 1.25rem;
      border-radius: var(--radius-lg);
      border: none;
      background: var(--color-system-blue);
      color: white;
      font: inherit;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms ease, transform 100ms ease, opacity 150ms ease;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      white-space: nowrap;
    }

    .search-btn:hover:not(:disabled) {
      background: var(--color-system-blue-hover);
    }

    .search-btn:active:not(:disabled) {
      transform: scale(0.97);
    }

    .search-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .search-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 600ms linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Search Results List ── */
    .search-results-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .section-subheading {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0.25rem 0 0.125rem;
    }

    .search-results-list {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      max-height: 220px;
      overflow-y: auto;
      padding-right: 2px;
    }

    .search-result-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-default);
      background: var(--surface-primary);
      color: var(--text-primary);
      font: inherit;
      font-size: 0.875rem;
      cursor: pointer;
      text-align: left;
      transition: background 150ms ease, border-color 150ms ease, transform 100ms ease;
    }

    .search-result-item:hover {
      background: var(--fill-primary);
      border-color: var(--color-system-blue);
      transform: translateX(2px);
    }

    .search-result-item.active {
      background: var(--color-system-blue-light);
      border-color: var(--color-system-blue);
    }

    .result-main {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      min-width: 0;
    }

    .result-flag { font-size: 1.125rem; flex-shrink: 0; }

    .result-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .result-name {
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-sub {
      font-size: 0.75rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-type-badge {
      font-size: 0.6875rem;
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
      background: var(--fill-secondary);
      color: var(--text-secondary);
      font-weight: 500;
      flex-shrink: 0;
      text-transform: capitalize;
    }

    .search-error-banner {
      padding: 0.75rem 1rem;
      background: oklch(95% 0.05 30);
      border: 1px solid oklch(85% 0.1 30);
      color: oklch(40% 0.15 30);
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }

    /* ── Quick Locations ── */
    .quick-locations-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quick-locations-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.375rem;
      max-height: 260px;
      overflow-y: auto;
      padding-right: 2px;
    }

    .quick-loc-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-default);
      background: var(--surface-primary);
      color: var(--text-primary);
      font: inherit;
      font-size: 0.875rem;
      cursor: pointer;
      text-align: left;
      transition: background 150ms ease, border-color 150ms ease, transform 100ms ease;
    }

    .quick-loc-btn:hover {
      background: var(--fill-primary);
      border-color: var(--color-system-blue);
      transform: translateX(2px);
    }

    .quick-loc-btn.active {
      background: var(--color-system-blue-light);
      border-color: var(--color-system-blue);
    }

    .quick-loc-content {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .quick-loc-flag { font-size: 1.125rem; flex-shrink: 0; }
    .quick-loc-name { font-weight: 600; color: var(--text-primary); }
    .quick-loc-sub { font-size: 0.75rem; color: var(--text-secondary); }
    .quick-loc-coords { font-size: 0.75rem; color: var(--text-tertiary); font-family: var(--font-mono); }

    /* ── Stats strip ── */
    .stats-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .stats-strip { grid-template-columns: repeat(2, 1fr); }
    }

    .stat-card {
      background: var(--surface-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      padding: 1.25rem;
      text-align: center;
      transition: box-shadow 200ms ease, transform 200ms ease;
    }

    .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--color-system-blue);
    }

    .stat-label {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    /* ── Code snippet ── */
    .code-block {
      background: var(--surface-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      overflow: auto;
    }

    .code-block-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .code-block-title {
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .code-dots {
      display: flex;
      gap: 6px;
    }

    .code-dots span {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    pre {
      margin: 0;
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      line-height: 1.7;
      color: var(--text-primary);
      overflow-x: auto;
      white-space: pre;
    }

    .kw  { color: var(--color-system-purple); }
    .fn  { color: var(--color-system-blue); }
    .str { color: var(--color-system-green); }
    .cm  { color: var(--text-tertiary); font-style: italic; }
    .nm  { color: var(--color-system-orange); }

    /* ── maplibre overrides ── */
    .maplibregl-ctrl-group {
      border-radius: var(--radius-lg) !important;
      overflow: hidden;
      box-shadow: var(--shadow-md) !important;
    }
  `,
  template: `
    <div class="map-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-inner">
          <div class="header-text">
            <h1>MapLibre GL JS</h1>
            <p>Interactive vector & raster map rendering powered by WebGL</p>
          </div>
          <span class="header-badge">
            <span>🗺️</span>
            <span>MapLibre v{{ maplibreVersion }}</span>
          </span>
        </div>
      </header>

      <main class="page-content">

        <!-- ─── Overview ─── -->
        <section aria-labelledby="section-overview">
          <h2 id="section-overview" class="section-heading">🗺 Interactive Basemaps</h2>
          <div class="map-wrapper">
            <div #mainMapEl class="map-container" id="main-map"></div>

            <!-- Style switcher overlay -->
            <div class="map-toolbar" aria-label="Map style controls">
              <div class="style-switcher">
                @for (s of mapStyles; track s.id) {
                  <button
                    class="style-btn"
                    [class.active]="currentStyle() === s.id"
                    (click)="switchStyle(s)"
                    [id]="'style-' + s.id">
                    {{ s.icon }} {{ s.label }}
                  </button>
                }
              </div>
            </div>

            <!-- Coordinate readout -->
            <div class="info-panel" aria-live="polite">
              <strong>Cursor Position</strong>
              <div class="coord-row">
                Lng: {{ cursorLng() }}&nbsp;&nbsp;Lat: {{ cursorLat() }}
              </div>
              <div class="coord-row" style="margin-top:4px">
                Zoom: {{ mapZoom() }}
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="stats-strip" style="margin-top:1.5rem">
            <div class="stat-card">
              <div class="stat-value">WebGL</div>
              <div class="stat-label">Renderer</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">60fps</div>
              <div class="stat-label">Hardware accelerated</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ poiMarkers.length }}</div>
              <div class="stat-label">POI markers</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ mapStyles.length }}</div>
              <div class="stat-label">Map styles</div>
            </div>
          </div>

          <!-- Features grid -->
          <div class="features-grid">
            @for (feat of features; track feat.title) {
              <div class="feature-card">
                <div class="feature-icon">{{ feat.icon }}</div>
                <h3>{{ feat.title }}</h3>
                <p>{{ feat.desc }}</p>
              </div>
            }
          </div>
        </section>

        <!-- ─── Layers ─── -->
        <section aria-labelledby="section-layers">
          <h2 id="section-layers" class="section-heading">🗂 Dynamic GeoJSON Layers</h2>
          <div class="layer-grid">
            <div class="map-wrapper">
              <div #layerMapEl class="map-container" id="layer-map"></div>
            </div>

            <div class="layer-controls">
              <h3>Layer Controls</h3>
              @for (layer of layerItems; track layer.id) {
                <div class="layer-item">
                  <div class="layer-info">
                    <div class="layer-dot" [style.background]="layer.color"></div>
                    <div>
                      <div class="layer-label">{{ layer.label }}</div>
                      <div class="layer-desc">{{ layer.desc }}</div>
                    </div>
                  </div>
                  <label class="toggle-switch" [attr.aria-label]="'Toggle ' + layer.label">
                    <input
                      type="checkbox"
                      [checked]="layer.visible"
                      (change)="toggleLayer(layer)"
                      [id]="'layer-toggle-' + layer.id">
                    <span class="toggle-track"></span>
                  </label>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- ─── Geocoder / Location Search ─── -->
        <section aria-labelledby="section-geocoder">
          <h2 id="section-geocoder" class="section-heading">📍 Location Search & Geocoding</h2>
          <div class="search-section">
            <div class="map-wrapper">
              <div #geoMapEl class="map-container" id="geo-map"></div>

              @if (selectedLocation(); as loc) {
                <div class="geo-map-overlay">
                  <span class="geo-overlay-flag">{{ loc.flag || '📍' }}</span>
                  <div>
                    <div class="geo-overlay-title">{{ loc.name }}</div>
                    <div class="geo-overlay-sub">{{ loc.lngLat[0].toFixed(4) }}°, {{ loc.lngLat[1].toFixed(4) }}°</div>
                  </div>
                </div>
              }
            </div>

            <div class="search-panel">
              <div class="panel-header">
                <h3>Jump to Location</h3>
              </div>

              <!-- Search input -->
              <div class="search-input-box">
                <div class="search-input-row">
                  <div class="search-input-wrapper">
                    <span class="search-input-icon">🔍</span>
                    <input
                      id="location-search-input"
                      class="search-input"
                      type="text"
                      placeholder="Search city, address, landmark…"
                      [value]="searchQuery()"
                      (input)="onSearchInput($event)"
                      (keyup.enter)="doSearch()"
                      aria-label="Search location"/>
                    @if (searchQuery().length > 0) {
                      <button
                        type="button"
                        class="search-clear-btn"
                        (click)="clearSearch()"
                        aria-label="Clear search">✕</button>
                    }
                  </div>
                  <button
                    type="button"
                    class="search-btn"
                    (click)="doSearch()"
                    [disabled]="isSearching()"
                    id="location-search-btn">
                    @if (isSearching()) {
                      <span class="search-spinner"></span>
                      <span>Searching</span>
                    } @else {
                      <span>Go</span>
                    }
                  </button>
                </div>
              </div>

              <!-- Error state -->
              @if (searchError()) {
                <div class="search-error-banner" role="alert">
                  <span>⚠️</span>
                  <span>{{ searchError() }}</span>
                </div>
              }

              <!-- Search Results List -->
              @if (searchResults().length > 0) {
                <div class="search-results-section">
                  <div class="section-subheading">Search Results ({{ searchResults().length }})</div>
                  <div class="search-results-list" role="list">
                    @for (res of searchResults(); track res.id) {
                      <button
                        type="button"
                        class="search-result-item"
                        [class.active]="selectedLocation()?.id === res.id"
                        (click)="selectLocation(res)">
                        <div class="result-main">
                          <span class="result-flag">{{ res.flag || '📍' }}</span>
                          <div class="result-text">
                            <span class="result-name">{{ res.name }}</span>
                            <span class="result-sub">{{ res.subtitle }}</span>
                          </div>
                        </div>
                        @if (res.type) {
                          <span class="result-type-badge">{{ res.type }}</span>
                        }
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Popular Locations -->
              <div class="quick-locations-section">
                <div class="section-subheading">Popular Destinations</div>
                <div class="quick-locations-grid">
                  @for (loc of quickLocations; track loc.id) {
                    <button
                      type="button"
                      class="quick-loc-btn"
                      [class.active]="selectedLocation()?.id === loc.id"
                      (click)="selectLocation(loc)"
                      [id]="'loc-' + loc.id">
                      <div class="quick-loc-content">
                        <span class="quick-loc-flag">{{ loc.flag }}</span>
                        <div>
                          <div class="quick-loc-name">{{ loc.name }}</div>
                          <div class="quick-loc-sub">{{ loc.subtitle }}</div>
                        </div>
                      </div>
                      <span class="quick-loc-coords">{{ loc.lngLat[0].toFixed(1) }}°, {{ loc.lngLat[1].toFixed(1) }}°</span>
                    </button>
                  }
                </div>
              </div>

            </div>
          </div>
        </section>

        <!-- ─── Code ─── -->
        <section aria-labelledby="section-code">
          <h2 id="section-code" class="section-heading">🧑‍💻 Getting Started</h2>
          <div class="code-block">
            <div class="code-block-header">
              <span class="code-block-title">Angular + MapLibre GL</span>
              <div class="code-dots">
                <span style="background:#ff5f57"></span>
                <span style="background:#febc2e"></span>
                <span style="background:#28c840"></span>
              </div>
            </div>
            <pre><span class="cm">// 1. Install MapLibre GL JS</span>
<span class="nm">npm</span> install maplibre-gl

<span class="cm">// 2. Import CSS and JS</span>
<span class="kw">import</span> <span class="str">'maplibre-gl/dist/maplibre-gl.css'</span>;
<span class="kw">import</span> &#123; Map, NavigationControl, Marker, Popup &#125; <span class="kw">from</span> <span class="str">'maplibre-gl'</span>;

<span class="cm">// 3. Angular component (afterNextRender)</span>
<span class="kw">afterNextRender</span>(() =&gt; &#123;
  <span class="kw">const</span> map = <span class="kw">new</span> <span class="fn">Map</span>(&#123;
    container: <span class="str">'map'</span>,
    style: <span class="str">'https://a.basemaps.cartocdn.com/rastertiles/voyager/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.png'</span>,
    center: [<span class="nm">106.8272</span>, <span class="nm">-6.1751</span>],
    zoom: <span class="nm">11</span>,
  &#125;);

  map.<span class="fn">addControl</span>(<span class="kw">new</span> <span class="fn">NavigationControl</span>());

  <span class="cm">// Add interactive marker</span>
  <span class="kw">new</span> <span class="fn">Marker</span>(&#123; color: <span class="str">'#007aff'</span> &#125;)
    .<span class="fn">setLngLat</span>([<span class="nm">106.8272</span>, <span class="nm">-6.1751</span>])
    .<span class="fn">setPopup</span>(<span class="kw">new</span> <span class="fn">Popup</span>().<span class="fn">setHTML</span>(<span class="str">'&lt;b&gt;Jakarta&lt;/b&gt;'</span>))
    .<span class="fn">addTo</span>(map);
&#125;);</pre>
          </div>
        </section>

      </main>
    </div>
  `,
})
export class MapDemoComponent implements OnDestroy {
  // ── Template refs ──
  readonly mainMapEl = viewChild<ElementRef<HTMLDivElement>>('mainMapEl');
  readonly layerMapEl = viewChild<ElementRef<HTMLDivElement>>('layerMapEl');
  readonly geoMapEl = viewChild<ElementRef<HTMLDivElement>>('geoMapEl');

  // ── State ──
  readonly currentStyle = signal<string>('voyager');
  readonly cursorLng = signal<string>('—');
  readonly cursorLat = signal<string>('—');
  readonly mapZoom = signal<string>('—');

  readonly searchQuery = signal<string>('');
  readonly isSearching = signal<boolean>(false);
  readonly searchResults = signal<SearchResultItem[]>([]);
  readonly searchError = signal<string | null>(null);
  readonly selectedLocation = signal<SearchResultItem | null>(POPULAR_LOCATIONS[0]);
  readonly hasSearched = signal<boolean>(false);

  // ── Map instances ──
  private mainMap: Map | null = null;
  private layerMap: Map | null = null;
  private geoMap: Map | null = null;
  private markers: Marker[] = [];
  private geoMarker: Marker | null = null;

  readonly maplibreVersion = maplibreglPkg.version;

  // ── Map Styles Config ──
  readonly mapStyles: MapStyle[] = [
    {
      id: 'voyager',
      label: 'Voyager',
      icon: '🧭',
      style: CARTO_VOYAGER_STYLE,
    },
    {
      id: 'positron',
      label: 'Positron (Light)',
      icon: '☀️',
      style: CARTO_POSITRON_STYLE,
    },
    {
      id: 'dark-matter',
      label: 'Dark Matter',
      icon: '🌑',
      style: CARTO_DARK_STYLE,
    },
    {
      id: 'osm',
      label: 'OpenStreetMap',
      icon: '🌍',
      style: OSM_STYLE,
    },
    {
      id: 'satellite',
      label: 'Satellite',
      icon: '🛰️',
      style: ESRI_SATELLITE_STYLE,
    },
    {
      id: 'liberty',
      label: 'Liberty (Vector)',
      icon: '🗽',
      style: OPENFREEMAP_LIBERTY_STYLE,
    },
  ];

  readonly poiMarkers: PoiMarker[] = [
    {
      id: 'jakarta',
      label: 'Jakarta',
      lngLat: [106.8272, -6.1751],
      color: '#007aff',
      description: '<b>Jakarta</b><br>Capital of Indonesia',
    },
    {
      id: 'bandung',
      label: 'Bandung',
      lngLat: [107.6191, -6.9175],
      color: '#30d158',
      description: '<b>Bandung</b><br>Parahyangan Highlands',
    },
    {
      id: 'surabaya',
      label: 'Surabaya',
      lngLat: [112.7521, -7.2575],
      color: '#ff9f0a',
      description: '<b>Surabaya</b><br>City of Heroes',
    },
    {
      id: 'yogyakarta',
      label: 'Yogyakarta',
      lngLat: [110.3645, -7.7956],
      color: '#bf5af2',
      description: '<b>Yogyakarta</b><br>Cultural heart of Java',
    },
    {
      id: 'bali',
      label: 'Bali',
      lngLat: [115.1889, -8.4095],
      color: '#ff375f',
      description: '<b>Bali</b><br>Island of the Gods',
    },
  ];

  layerItems = [
    {
      id: 'poi-layer',
      label: 'Points of Interest',
      desc: 'City markers across Java',
      color: '#007aff',
      visible: true,
    },
    {
      id: 'heat-layer',
      label: 'Population Heat',
      desc: 'Density visualization',
      color: '#ff375f',
      visible: true,
    },
    {
      id: 'route-layer',
      label: 'Route Overlay',
      desc: 'Sample GeoJSON path',
      color: '#30d158',
      visible: false,
    },
    {
      id: 'grid-layer',
      label: 'H3 Grid',
      desc: 'Hex grid cells',
      color: '#ff9f0a',
      visible: false,
    },
  ];

  readonly quickLocations = POPULAR_LOCATIONS;

  readonly features = [
    {
      icon: '🎨',
      title: 'Vector & Raster Tiles',
      desc: 'High-resolution rendering powered by WebGL with support for vector and raster sources.',
    },
    {
      icon: '⚡',
      title: 'WebGL Accelerated',
      desc: 'Smooth 60fps pan, zoom, and rotation animations powered by GPU hardware acceleration.',
    },
    {
      icon: '🌍',
      title: 'Multiple Basemaps',
      desc: 'Switch between Voyager, Positron, Dark Matter, OpenStreetMap, and ESRI Satellite instantly.',
    },
    {
      icon: '📌',
      title: 'Interactive Markers',
      desc: 'Drop custom styled HTML markers with responsive popup cards anywhere on the map.',
    },
    {
      icon: '🗂',
      title: 'Dynamic GeoJSON',
      desc: 'Add, toggle, or filter circles, heatmaps, and route polylines dynamically at runtime.',
    },
    {
      icon: '🔍',
      title: 'Smart Geocoding',
      desc: 'Instant global search powered by OpenStreetMap Photon API with smooth camera transitions.',
    },
  ];

  // ── Lifecycle ──
  constructor() {
    afterNextRender(() => {
      this.initMainMap();
      this.initLayerMap();
      this.initGeoMap();

      setTimeout(() => {
        this.mainMap?.resize();
        this.layerMap?.resize();
        this.geoMap?.resize();
      }, 300);

      window.addEventListener('resize', this.onWindowResize);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onWindowResize);
    this.destroyAllMaps();
  }

  private onWindowResize = (): void => {
    this.mainMap?.resize();
    this.layerMap?.resize();
    this.geoMap?.resize();
  };

  // ── Main map ──
  private initMainMap(): void {
    if (this.mainMap) return;
    const el = this.mainMapEl()?.nativeElement;
    if (!el) return;

    const currentStyleObj =
      this.mapStyles.find((s) => s.id === this.currentStyle()) ?? this.mapStyles[0];

    this.mainMap = new Map({
      container: el,
      style: currentStyleObj.style,
      center: [106.8272, -6.1751],
      zoom: 5.5,
      attributionControl: false,
    });

    this.mainMap.addControl(new NavigationControl(), 'bottom-right');
    this.mainMap.addControl(new ScaleControl(), 'bottom-right');
    this.mainMap.addControl(new FullscreenControl(), 'bottom-right');

    this.mainMap.on('mousemove', (e) => {
      this.cursorLng.set(e.lngLat.lng.toFixed(4));
      this.cursorLat.set(e.lngLat.lat.toFixed(4));
    });

    this.mainMap.on('zoom', () => {
      this.mapZoom.set(this.mainMap!.getZoom().toFixed(2));
    });

    this.mainMap.on('load', () => {
      this.mapZoom.set(this.mainMap!.getZoom().toFixed(2));
      this.mainMap?.resize();
      this.addPoiMarkers();
    });
  }

  private addPoiMarkers(): void {
    if (!this.mainMap) return;
    for (const poi of this.poiMarkers) {
      const popup = new Popup({ offset: 25, focusAfterOpen: false }).setHTML(poi.description);
      const marker = new Marker({ color: poi.color })
        .setLngLat(poi.lngLat)
        .setPopup(popup)
        .addTo(this.mainMap);
      this.markers.push(marker);
    }
  }

  switchStyle(style: MapStyle): void {
    this.currentStyle.set(style.id);
    if (this.mainMap) {
      this.mainMap.setStyle(style.style);
    }
  }

  // ── Layer map ──
  private initLayerMap(): void {
    if (this.layerMap) return;
    const el = this.layerMapEl()?.nativeElement;
    if (!el) return;

    this.layerMap = new Map({
      container: el,
      style: CARTO_POSITRON_STYLE,
      center: [109.0, -7.2],
      zoom: 6,
      attributionControl: false,
    });

    this.layerMap.addControl(new NavigationControl(), 'bottom-right');
    this.layerMap.addControl(new ScaleControl(), 'bottom-right');

    this.layerMap.on('load', () => {
      this.layerMap?.resize();
      this.addLayerMapSources();
    });
  }

  private addLayerMapSources(): void {
    if (!this.layerMap) return;

    // POI GeoJSON
    this.layerMap.addSource('poi-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: this.poiMarkers.map((p) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: p.lngLat as number[] },
          properties: { label: p.label, color: p.color },
        })),
      },
    });

    this.layerMap.addLayer({
      id: 'poi-layer',
      type: 'circle',
      source: 'poi-source',
      paint: {
        'circle-radius': 10,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9,
      },
    });

    // Simulated heatmap source (same points, more blur)
    this.layerMap.addSource('heat-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: this.poiMarkers.map((p) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: p.lngLat as number[] },
          properties: { weight: 1 },
        })),
      },
    });

    this.layerMap.addLayer({
      id: 'heat-layer',
      type: 'heatmap',
      source: 'heat-source',
      paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': 1.5,
        'heatmap-radius': 60,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(0,0,255,0)',
          0.2, 'royalblue',
          0.4, 'cyan',
          0.6, 'lime',
          0.8, 'yellow',
          1, 'red',
        ],
        'heatmap-opacity': 0.7,
      },
    });

    // Route line
    this.layerMap.addSource('route-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [106.8272, -6.1751],
            [107.6191, -6.9175],
            [110.3645, -7.7956],
            [112.7521, -7.2575],
          ],
        },
        properties: {},
      },
    });

    this.layerMap.addLayer({
      id: 'route-layer',
      type: 'line',
      source: 'route-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#30d158', 'line-width': 4, 'line-dasharray': [2, 2] },
    });

    // Set initial visibility
    this.layerMap.setLayoutProperty('route-layer', 'visibility', 'none');
    this.layerMap.setLayoutProperty('heat-layer', 'visibility', 'visible');
  }

  toggleLayer(layer: (typeof this.layerItems)[0]): void {
    layer.visible = !layer.visible;
    if (!this.layerMap?.isStyleLoaded()) return;
    const existingLayer = this.layerMap.getLayer(layer.id);
    if (existingLayer) {
      this.layerMap.setLayoutProperty(
        layer.id,
        'visibility',
        layer.visible ? 'visible' : 'none',
      );
    }
  }

  // ── Geocoder / Location Search Map ──
  private initGeoMap(): void {
    if (this.geoMap) return;
    const el = this.geoMapEl()?.nativeElement;
    if (!el) return;

    this.geoMap = new Map({
      container: el,
      style: CARTO_VOYAGER_STYLE,
      center: [106.8272, -6.1751],
      zoom: 11,
      attributionControl: false,
    });

    this.geoMap.addControl(new NavigationControl(), 'bottom-right');
    this.geoMap.addControl(new ScaleControl(), 'bottom-right');

    this.geoMap.on('load', () => {
      this.geoMap?.resize();
      const initialLoc = POPULAR_LOCATIONS[0];
      this.setGeoMarker(initialLoc);
    });
  }

  private setGeoMarker(loc: SearchResultItem): void {
    if (!this.geoMap) return;

    const formattedCoords = `${Math.abs(loc.lngLat[0]).toFixed(2)}° ${loc.lngLat[0] >= 0 ? 'E' : 'W'}, ${Math.abs(loc.lngLat[1]).toFixed(2)}° ${loc.lngLat[1] >= 0 ? 'N' : 'S'}`;
    const popupHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2px 4px; min-width: 140px;">
        <div style="font-size: 1rem; font-weight: 700; color: #1c1c1e; margin-bottom: 2px;">
          ${loc.flag ? loc.flag + ' ' : ''}${loc.name}
        </div>
        <div style="font-size: 0.8125rem; color: #6e6e73; margin-bottom: 4px;">
          ${loc.subtitle}
        </div>
        <div style="font-size: 0.75rem; font-family: monospace; color: #007aff; font-weight: 600;">
          ${formattedCoords}
        </div>
      </div>
    `;

    this.geoMarker?.remove();
    this.geoMarker = new Marker({ color: '#ff375f' })
      .setLngLat(loc.lngLat)
      .setPopup(new Popup({ offset: 25, focusAfterOpen: false }).setHTML(popupHtml))
      .addTo(this.geoMap);
    this.geoMarker.togglePopup();
  }

  selectLocation(loc: SearchResultItem): void {
    this.selectedLocation.set(loc);
    if (!this.geoMap) return;

    this.geoMap.flyTo({
      center: loc.lngLat,
      zoom: loc.zoom ?? 12,
      duration: 1600,
      essential: true,
    });

    this.setGeoMarker(loc);
  }

  onSearchInput(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    if (!val.trim()) {
      this.searchResults.set([]);
      this.searchError.set(null);
      this.hasSearched.set(false);
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchError.set(null);
    this.hasSearched.set(false);
  }

  async doSearch(): Promise<void> {
    const query = this.searchQuery().trim();
    if (!query) {
      this.clearSearch();
      return;
    }

    this.isSearching.set(true);
    this.searchError.set(null);
    this.hasSearched.set(true);

    // 1. Search local curated database
    const qLower = query.toLowerCase();
    const localMatches = POPULAR_LOCATIONS.filter(
      (l) =>
        l.name.toLowerCase().includes(qLower) ||
        l.subtitle.toLowerCase().includes(qLower),
    );

    try {
      // 2. Query Photon Komoot Geocoding API
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`,
      );

      if (!res.ok) {
        throw new Error(`Geocoding HTTP error: ${res.status}`);
      }

      const data = await res.json();
      const rawFeatures: Array<{
        geometry: { coordinates: [number, number] };
        properties: {
          osm_id?: number;
          name?: string;
          city?: string;
          state?: string;
          country?: string;
          countrycode?: string;
          type?: string;
          osm_value?: string;
        };
      }> = data.features || [];

      const remoteItems: SearchResultItem[] = rawFeatures.map((f, index) => {
        const p = f.properties || {};
        const coords = f.geometry.coordinates;
        const subParts = [p.city, p.state, p.country].filter(Boolean);
        const uniqueSub = Array.from(new Set(subParts)).join(', ');

        return {
          id: `photon-${p.osm_id ?? index}`,
          name: p.name || query,
          subtitle: uniqueSub || p.country || 'Location',
          flag: countryCodeToFlagEmoji(p.countrycode),
          type: p.type || p.osm_value || 'Place',
          lngLat: [coords[0], coords[1]],
          zoom: p.type === 'city' || p.osm_value === 'city' ? 12 : 14,
        };
      });

      // Combine and deduplicate
      const combined = [...localMatches];
      for (const r of remoteItems) {
        const isDuplicate = combined.some(
          (c) =>
            Math.abs(c.lngLat[0] - r.lngLat[0]) < 0.05 &&
            Math.abs(c.lngLat[1] - r.lngLat[1]) < 0.05,
        );
        if (!isDuplicate) {
          combined.push(r);
        }
      }

      this.searchResults.set(combined);

      if (combined.length > 0) {
        this.selectLocation(combined[0]);
      } else {
        this.searchError.set(`No locations found for "${query}". Try another city or landmark.`);
      }
    } catch {
      // Fallback gracefully to local matches if network request fails
      if (localMatches.length > 0) {
        this.searchResults.set(localMatches);
        this.selectLocation(localMatches[0]);
      } else {
        this.searchError.set(
          `Could not find "${query}". Try searching for Bandung, Jakarta, Bali, Tokyo, Paris...`,
        );
      }
    } finally {
      this.isSearching.set(false);
    }
  }

  // ── Cleanup ──
  private destroyAllMaps(): void {
    this.markers.forEach((m) => m.remove());
    this.markers = [];
    this.geoMarker?.remove();
    this.mainMap?.remove();
    this.layerMap?.remove();
    this.geoMap?.remove();
    this.mainMap = null;
    this.layerMap = null;
    this.geoMap = null;
  }
}
