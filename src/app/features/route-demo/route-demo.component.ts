import {
  Component,
  ElementRef,
  viewChild,
  afterNextRender,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import {
  Map,
  NavigationControl,
  ScaleControl,
  Marker,
  LngLatLike,
  type StyleSpecification,
  GeoJSONSource,
} from 'maplibre-gl';
import type { LineString, Feature, FeatureCollection } from 'geojson';

// ── Vehicle Modes ────────────────────────────────────────────────────
export interface VehicleMode {
  id: string;
  label: string;
  icon: string;
  osrmProfile: 'foot' | 'bicycle' | 'driving';
  speedFactor: number; // multiplier applied to raw OSRM duration for UX demo
  color: string;
  description: string;
}

export const VEHICLE_MODES: VehicleMode[] = [
  {
    id: 'walking',
    label: 'Pejalan Kaki',
    icon: '🚶',
    osrmProfile: 'foot',
    speedFactor: 1,
    color: '#34d399',
    description: '~5 km/h',
  },
  {
    id: 'cycling',
    label: 'Sepeda',
    icon: '🚲',
    osrmProfile: 'bicycle',
    speedFactor: 1,
    color: '#60a5fa',
    description: '~15 km/h',
  },
  {
    id: 'motorcycle',
    label: 'Motor',
    icon: '🛵',
    osrmProfile: 'driving',
    speedFactor: 0.85,
    color: '#f59e0b',
    description: '~40 km/h',
  },
  {
    id: 'car',
    label: 'Mobil',
    icon: '🚗',
    osrmProfile: 'driving',
    speedFactor: 1,
    color: '#3b82f6',
    description: '~60 km/h',
  },
  {
    id: 'bus',
    label: 'Bus',
    icon: '🚌',
    osrmProfile: 'driving',
    speedFactor: 1.3,
    color: '#8b5cf6',
    description: '~45 km/h',
  },
  {
    id: 'truck',
    label: 'Truk',
    icon: '🚛',
    osrmProfile: 'driving',
    speedFactor: 1.6,
    color: '#ef4444',
    description: '~40 km/h',
  },
];

// ── Route Waypoint ───────────────────────────────────────────────────
export interface Waypoint {
  label: string;
  lngLat: [number, number];
  displayName: string;
}

// ── Route Result ─────────────────────────────────────────────────────
export interface RouteResult {
  index: number;
  geometry: LineString;
  distance: number; // meters
  duration: number; // seconds (adjusted)
  legs: OsrmLeg[];
}

export interface SvgRoutePath {
  index: number;
  d: string;
  color: string;
  isSelected: boolean;
}

interface OsrmLeg {
  steps: OsrmStep[];
}

interface OsrmStep {
  maneuver: {
    type: string;
    modifier?: string;
    location?: [number, number];
    bearing_after?: number;
  };
  name: string;
  distance: number;
  duration: number;
}

// ── Map Styles ───────────────────────────────────────────────────────
function createRouteMapStyle(isDark: boolean): StyleSpecification {
  return {
    version: 8,
    sources: {
      'carto-base': {
        type: 'raster',
        tiles: isDark
          ? [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          ]
          : [
            'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxzoom: 20,
      },
      'route-0': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      'route-1': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      'route-2': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    },
    layers: [
      { id: 'carto-base-layer', type: 'raster', source: 'carto-base', minzoom: 0, maxzoom: 20 },
      // Route 2 (Alternative 2 - bottom)
      {
        id: 'route-outline-2',
        type: 'line',
        source: 'route-2',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.4 },
      },
      {
        id: 'route-line-2',
        type: 'line',
        source: 'route-2',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#10b981', 'line-width': 5, 'line-opacity': 0.7 },
      },
      // Route 1 (Alternative 1)
      {
        id: 'route-outline-1',
        type: 'line',
        source: 'route-1',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.4 },
      },
      {
        id: 'route-line-1',
        type: 'line',
        source: 'route-1',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#f59e0b', 'line-width': 5, 'line-opacity': 0.7 },
      },
      // Route 0 (Main route - top)
      {
        id: 'route-outline-0',
        type: 'line',
        source: 'route-0',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 11, 'line-opacity': 0.85 },
      },
      {
        id: 'route-line-0',
        type: 'line',
        source: 'route-0',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3b82f6', 'line-width': 7, 'line-opacity': 1.0 },
      },
    ],
  };
}

// ── Helpers ──────────────────────────────────────────────────────────
function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} mnt`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} jam ${m} mnt` : `${h} jam`;
}

function maneuverIcon(type: string, modifier?: string): string {
  if (type === 'turn') {
    if (modifier === 'left' || modifier === 'sharp left' || modifier === 'slight left') return '↰';
    if (modifier === 'right' || modifier === 'sharp right' || modifier === 'slight right') return '↱';
    if (modifier === 'uturn') return '↩';
    return '↑';
  }
  if (type === 'arrive') return '📍';
  if (type === 'depart') return '🚀';
  if (type === 'roundabout' || type === 'rotary') return '⟳';
  if (type === 'merge') return '⤵';
  if (type === 'fork') return '⑂';
  return '→';
}

// ── Preset Location Pairs for Demo ───────────────────────────────────
interface LocationPreset {
  label: string;
  a: Waypoint;
  b: Waypoint;
}

const PRESETS: LocationPreset[] = [
  {
    label: 'Monas → Senayan (Jakarta)',
    a: { label: 'A', lngLat: [106.827, -6.1754], displayName: 'Monas, Jakarta Pusat' },
    b: { label: 'B', lngLat: [106.8017, -6.2183], displayName: 'GBK Senayan, Jakarta Selatan' },
  },
  {
    label: 'Braga → Dago (Bandung)',
    a: { label: 'A', lngLat: [107.6065, -6.9164], displayName: 'Jl. Braga, Bandung' },
    b: { label: 'B', lngLat: [107.6134, -6.8814], displayName: 'Jl. Ir. H. Djuanda (Dago), Bandung' },
  },
  {
    label: 'Tugu → Malioboro (Yogyakarta)',
    a: { label: 'A', lngLat: [110.3585, -7.7897], displayName: 'Stasiun Tugu, Yogyakarta' },
    b: { label: 'B', lngLat: [110.3651, -7.7933], displayName: 'Jl. Malioboro, Yogyakarta' },
  },
  {
    label: 'Kuta → Ubud (Bali)',
    a: { label: 'A', lngLat: [115.1686, -8.7215], displayName: 'Pantai Kuta, Bali' },
    b: { label: 'B', lngLat: [115.2624, -8.5069], displayName: 'Ubud, Gianyar, Bali' },
  },
];

// ── Component ────────────────────────────────────────────────────────
@Component({
  selector: 'app-route-demo',
  imports: [],
  styleUrl: './route-demo.component.css',
  template: `
    <div class="route-page" role="main">

      <!-- ── Header ── -->
      <header class="page-header">
        <div class="header-inner">
          <a href="/map-demo" class="back-btn" aria-label="Kembali ke Map Demo">
            ← Peta Demo
          </a>
          <div class="header-title">
            <h1>🗺️ Route Demo</h1>
            <p>Navigasi rute A → B dengan 2 alternatif &amp; multi-mode kendaraan</p>
          </div>
          <div class="header-badge" aria-label="Powered by MapLibre GL and OSRM">
            <span>🧭</span> MapLibre + OSRM
          </div>
        </div>
      </header>

      <!-- ── Main Layout ── -->
      <div class="main-layout">

        <!-- ══ LEFT PANEL ══ -->
        <aside class="left-panel" aria-label="Panel Kontrol Rute">

          <!-- Preset Lokasi -->
          <section class="panel-section" aria-labelledby="presets-label">
            <p class="panel-section-title" id="presets-label">📌 Preset Lokasi Cepat</p>
            <div class="preset-list" role="listbox" aria-label="Pilih preset lokasi">
              @for (preset of presets; track preset.label) {
                <button
                  class="preset-btn"
                  [class.active]="activePresetIndex() === $index"
                  (click)="applyPreset(preset, $index)"
                  role="option"
                  [attr.aria-selected]="activePresetIndex() === $index"
                >
                  <span>🗺️</span>
                  <span>{{ preset.label }}</span>
                </button>
              }
            </div>
          </section>

          <!-- Waypoint Input -->
          <section class="panel-section" aria-labelledby="waypoints-label">
            <p class="panel-section-title" id="waypoints-label">📍 Titik Asal &amp; Tujuan</p>
            <div class="waypoint-inputs">
              <!-- A -->
              <div class="waypoint-row">
                <div class="waypoint-dot start" aria-hidden="true">A</div>
                <div class="waypoint-field">
                  <label class="waypoint-label" for="input-a">Titik Asal</label>
                  <input
                    id="input-a"
                    type="text"
                    class="waypoint-input"
                    [class.has-value]="pointA().displayName"
                    [value]="pointA().displayName"
                    (change)="onInputChange('a', $event)"
                    placeholder="Contoh: Monas, Jakarta"
                    aria-label="Titik asal perjalanan"
                  />
                </div>
              </div>

              <!-- Connector + Swap -->
              <div class="waypoint-row">
                <div class="waypoint-connector" aria-hidden="true">
                  <div class="connector-line"></div>
                </div>
                <div style="flex:1; display:flex; justify-content:flex-end;">
                  <button
                    class="swap-btn"
                    (click)="swapPoints()"
                    title="Balik asal dan tujuan"
                    aria-label="Tukar titik asal dan tujuan"
                  >⇅</button>
                </div>
              </div>

              <!-- B -->
              <div class="waypoint-row">
                <div class="waypoint-dot end" aria-hidden="true">B</div>
                <div class="waypoint-field">
                  <label class="waypoint-label" for="input-b">Titik Tujuan</label>
                  <input
                    id="input-b"
                    type="text"
                    class="waypoint-input"
                    [class.has-value]="pointB().displayName"
                    [value]="pointB().displayName"
                    (change)="onInputChange('b', $event)"
                    placeholder="Contoh: Senayan, Jakarta"
                    aria-label="Titik tujuan perjalanan"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- Vehicle Mode -->
          <section class="panel-section" aria-labelledby="vehicle-label">
            <p class="panel-section-title" id="vehicle-label">🚗 Mode Kendaraan</p>
            <div class="vehicle-grid" role="group" aria-label="Pilih mode kendaraan">
              @for (mode of vehicleModes; track mode.id) {
                <button
                  class="vehicle-btn"
                  [class.active]="selectedMode().id === mode.id"
                  [style.color]="selectedMode().id === mode.id ? mode.color : ''"
                  [style.border-color]="selectedMode().id === mode.id ? mode.color : ''"
                  [style.background]="selectedMode().id === mode.id ? mode.color + '14' : ''"
                  (click)="selectMode(mode)"
                  [attr.aria-pressed]="selectedMode().id === mode.id"
                  [attr.aria-label]="mode.label + ' - ' + mode.description"
                >
                  <span class="vehicle-icon" aria-hidden="true">{{ mode.icon }}</span>
                  <span class="vehicle-name">{{ mode.label }}</span>
                  <span class="vehicle-speed">{{ mode.description }}</span>
                </button>
              }
            </div>
          </section>

          <!-- Calculate -->
          <section class="panel-section">
            <button
              class="calc-btn"
              (click)="calculateRoute()"
              [disabled]="isLoading() || !pointA().lngLat || !pointB().lngLat"
              aria-label="Hitung rute perjalanan"
            >
              @if (isLoading()) {
                <div class="calc-spinner" aria-hidden="true"></div>
                <span>Menghitung Rute...</span>
              } @else {
                <span>🧭</span>
                <span>Hitung Rute {{ selectedMode().icon }}</span>
              }
            </button>

            @if (routeError()) {
              <div class="error-msg" role="alert" aria-live="polite">
                <span aria-hidden="true">⚠️</span>
                <span>{{ routeError() }}</span>
              </div>
            }
          </section>

          <!-- Route Results -->
          @if (routes().length > 0) {
            <section class="panel-section" aria-labelledby="routes-label">
              <p class="panel-section-title" id="routes-label">
                🛣️ {{ routes().length }} Rute Ditemukan
              </p>
              <div class="routes-list" role="listbox" aria-label="Daftar rute alternatif">
                @for (route of routes(); track route.index) {
                  <div
                    class="route-card"
                    [class.selected]="selectedRouteIndex() === route.index"
                    [style.--route-color]="routeColor(route.index)"
                    [style.--route-bg]="routeColor(route.index) + '0d'"
                    (click)="selectRoute(route.index)"
                    role="option"
                    [attr.aria-selected]="selectedRouteIndex() === route.index"
                    [attr.aria-label]="'Rute ' + (route.index + 1) + ': ' + formatDist(route.distance) + ', ' + formatDur(route.duration)"
                  >
                    <div class="route-card-header">
                      <div
                        class="route-badge"
                        [style.background]="routeColor(route.index)"
                        aria-hidden="true"
                      >
                        {{ selectedMode().icon }}
                        Rute {{ route.index + 1 }}
                        @if (route.index === 0) { ⭐ }
                      </div>
                      <span class="route-label">
                        {{ route.index === 0 ? 'Terbaik' : 'Alternatif' }}
                      </span>
                    </div>

                    <div class="route-stats">
                      <div class="stat">
                        <span class="stat-value">{{ formatDist(route.distance) }}</span>
                        <span class="stat-label">Jarak</span>
                      </div>
                      <div class="stat">
                        <span class="stat-value">{{ formatDur(route.duration) }}</span>
                        <span class="stat-label">Estimasi</span>
                      </div>
                    </div>

                    <button
                      class="route-select-btn"
                      [class.selected]="selectedRouteIndex() === route.index"
                      [style.--route-color]="routeColor(route.index)"
                      [style.border-color]="routeColor(route.index)"
                      [style.color]="selectedRouteIndex() === route.index ? 'white' : routeColor(route.index)"
                      [style.background]="selectedRouteIndex() === route.index ? routeColor(route.index) : 'transparent'"
                      (click)="selectRoute(route.index); $event.stopPropagation()"
                      [attr.aria-label]="'Pilih rute ' + (route.index + 1)"
                    >
                      {{ selectedRouteIndex() === route.index ? '✓ Dipilih' : 'Pilih Rute Ini' }}
                    </button>

                    <!-- Turn-by-turn steps -->
                    @if (route.legs[0]?.steps?.length > 0) {
                      <div class="steps-accordion">
                        <button
                          class="steps-toggle"
                          (click)="toggleSteps(route.index); $event.stopPropagation()"
                          [attr.aria-expanded]="expandedSteps() === route.index"
                          [attr.aria-controls]="'steps-' + route.index"
                        >
                          <span>📋 Petunjuk Arah ({{ route.legs[0].steps.length - 1 }} langkah)</span>
                          <span aria-hidden="true">{{ expandedSteps() === route.index ? '▲' : '▼' }}</span>
                        </button>
                        @if (expandedSteps() === route.index) {
                          <div
                            class="steps-list"
                            [id]="'steps-' + route.index"
                            role="list"
                            aria-label="Petunjuk arah rute"
                          >
                            @for (step of route.legs[0].steps; track $index) {
                              @if (step.name) {
                                <div class="step-item" role="listitem">
                                  <span class="step-icon" aria-hidden="true">
                                    {{ maneuverIcon(step.maneuver.type, step.maneuver.modifier) }}
                                  </span>
                                  <span class="step-name">
                                    {{ step.maneuver.type === 'arrive' ? 'Tiba di tujuan' :
                                       step.maneuver.type === 'depart' ? 'Mulai dari ' + step.name :
                                       'Menuju ' + step.name }}
                                  </span>
                                  <span class="step-dist" aria-label="{{ formatDist(step.distance) }}">
                                    {{ formatDist(step.distance) }}
                                  </span>
                                </div>
                              }
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </section>
          }

          <!-- Bottom padding -->
          <div style="height: 2rem;"></div>
        </aside>

        <!-- ══ MAP PANEL ══ -->
        <div class="map-panel" aria-label="Peta interaktif">
          <div #mapContainer class="map-container" aria-label="Peta rute"></div>

          <!-- SVG Route Overlay -->
          <svg class="route-svg-overlay" aria-hidden="true">
            <defs>
              <filter id="route-glow-0" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#3b82f6" flood-opacity="0.5"/>
              </filter>
              <filter id="route-glow-1" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#f59e0b" flood-opacity="0.5"/>
              </filter>
              <filter id="route-glow-2" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#10b981" flood-opacity="0.5"/>
              </filter>
            </defs>

            @for (path of svgRoutePaths(); track path.index) {
              <!-- Outline casing -->
              <path
                [attr.d]="path.d"
                [attr.stroke]="mapStyle() === 'dark' ? '#0f172a' : '#ffffff'"
                [attr.stroke-width]="path.isSelected ? 10 : 7"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
                [attr.opacity]="path.isSelected ? 0.95 : 0.6"
              />
              <!-- Colored route line -->
              <path
                [attr.d]="path.d"
                [attr.stroke]="path.color"
                [attr.stroke-width]="path.isSelected ? 6 : 4"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
                [attr.opacity]="path.isSelected ? 1.0 : 0.75"
                [attr.filter]="path.isSelected ? 'url(#route-glow-' + path.index + ')' : null"
              />
            }
          </svg>

          <!-- Map style toggle -->
          <div class="map-overlay" aria-label="Pengaturan tampilan peta">
            <div class="style-toggle" role="group" aria-label="Pilih gaya peta">
              <button
                class="style-opt"
                [class.active]="mapStyle() === 'light'"
                (click)="setMapStyle('light')"
                aria-pressed="{{mapStyle() === 'light'}}"
              >☀️ Terang</button>
              <button
                class="style-opt"
                [class.active]="mapStyle() === 'dark'"
                (click)="setMapStyle('dark')"
                aria-pressed="{{mapStyle() === 'dark'}}"
              >🌙 Gelap</button>
            </div>
          </div>

          <!-- Hint when no route -->
          @if (routes().length === 0 && !isLoading()) {
            <div class="map-empty-hint" aria-hidden="true">
              <div class="hint-card">
                <div class="hint-icon">🗺️</div>
                <p class="hint-title">Pilih Rute Perjalanan</p>
                <p class="hint-sub">Pilih preset lokasi atau masukkan titik A dan B, lalu klik "Hitung Rute"</p>
              </div>
            </div>
          }

          <!-- Route summary bar -->
          @if (selectedRoute()) {
            <div class="map-route-summary" role="status" aria-live="polite">
              <div class="summary-chip">
                <span>{{ selectedMode().icon }}</span>
                <strong>{{ selectedMode().label }}</strong>
              </div>
              <div class="summary-sep" aria-hidden="true"></div>
              <div class="summary-chip">
                <span>📏</span>
                <strong>{{ formatDist(selectedRoute()!.distance) }}</strong>
              </div>
              <div class="summary-sep" aria-hidden="true"></div>
              <div class="summary-chip">
                <span>⏱</span>
                <strong>{{ formatDur(selectedRoute()!.duration) }}</strong>
              </div>
              <div class="summary-sep" aria-hidden="true"></div>
              <div class="summary-chip">
                <span>🛣️</span>
                <strong>Rute {{ selectedRouteIndex() + 1 }}</strong>
              </div>
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class RouteDemoComponent implements OnDestroy {
  // ── Template refs ──
  private readonly mapContainerRef = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  // ── State ──
  readonly pointA = signal<Waypoint>({ label: 'A', lngLat: [106.827, -6.1754], displayName: 'Monas, Jakarta Pusat' });
  readonly pointB = signal<Waypoint>({ label: 'B', lngLat: [106.8017, -6.2183], displayName: 'GBK Senayan, Jakarta Selatan' });
  readonly selectedMode = signal<VehicleMode>(VEHICLE_MODES[3]); // default car
  readonly routes = signal<RouteResult[]>([]);
  readonly selectedRouteIndex = signal(0);
  readonly isLoading = signal(false);
  readonly routeError = signal<string | null>(null);
  readonly mapStyle = signal<'light' | 'dark'>('light');
  readonly activePresetIndex = signal(0);
  readonly expandedSteps = signal<number | null>(null);

  readonly selectedRoute = computed(() =>
    this.routes().find((r) => r.index === this.selectedRouteIndex()) ?? null
  );

  readonly svgRoutePaths = signal<SvgRoutePath[]>([]);

  // ── Data ──
  readonly presets = PRESETS;
  readonly vehicleModes = VEHICLE_MODES;

  // ── Map internals ──
  private map: Map | null = null;
  private markerA: Marker | null = null;
  private markerB: Marker | null = null;
  private mapReady = false;

  // Route colors: index 0 = main, index 1,2 = alternates
  private readonly ROUTE_COLORS = ['#3b82f6', '#f59e0b', '#10b981'];

  constructor() {
    afterNextRender(() => {
      this.initMap();
    });
  }

  // ── Public helpers for template ──
  formatDist = formatDistance;
  formatDur = formatDuration;
  maneuverIcon = maneuverIcon;

  routeColor(index: number): string {
    return this.ROUTE_COLORS[index] ?? '#6b7280';
  }

  // ── Map Init ──
  private initMap(): void {
    const el = this.mapContainerRef()?.nativeElement;
    if (!el) return;

    this.map = new Map({
      container: el,
      style: createRouteMapStyle(this.mapStyle() === 'dark'),
      center: [106.827, -6.1754],
      zoom: 12,
      attributionControl: { compact: true },
    });

    this.map.addControl(new NavigationControl(), 'bottom-right');
    this.map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-right');

    this.map.on('load', () => {
      this.mapReady = true;
      this.ensureRouteLayers();
      // Add initial markers and calculate default route
      this.updateMarkers();
      this.calculateRoute();
    });

    this.map.on('move', () => this.updateSvgRoutes());
    this.map.on('zoom', () => this.updateSvgRoutes());
    this.map.on('resize', () => this.updateSvgRoutes());
    this.map.on('render', () => this.updateSvgRoutes());
  }

  // ── Markers ──
  private createMarkerEl(letter: 'A' | 'B', color: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    `;

    // Pulse ring
    const ring = document.createElement('div');
    ring.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${color};
      opacity: 0;
      animation: pulse-ring 2s ease-out infinite;
    `;

    const pin = document.createElement('div');
    pin.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: ${color};
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const label = document.createElement('span');
    label.style.cssText = `
      transform: rotate(45deg);
      color: white;
      font-weight: 800;
      font-size: 13px;
      font-family: system-ui, sans-serif;
      line-height: 1;
    `;
    label.textContent = letter;

    pin.appendChild(label);
    wrapper.appendChild(ring);
    wrapper.appendChild(pin);

    // Add pulse keyframe if not exists
    if (!document.getElementById('marker-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'marker-pulse-style';
      style.textContent = `
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    return wrapper;
  }

  private updateMarkers(): void {
    const a = this.pointA();
    const b = this.pointB();
    if (!this.map || !a.lngLat || !b.lngLat) return;

    this.markerA?.remove();
    this.markerB?.remove();

    this.markerA = new Marker({ element: this.createMarkerEl('A', '#22c55e'), anchor: 'bottom' })
      .setLngLat(a.lngLat as LngLatLike)
      .addTo(this.map);

    this.markerB = new Marker({ element: this.createMarkerEl('B', '#ef4444'), anchor: 'bottom' })
      .setLngLat(b.lngLat as LngLatLike)
      .addTo(this.map);
  }

  // ── Route Calculation ──
  async calculateRoute(): Promise<void> {
    const a = this.pointA();
    const b = this.pointB();
    if (!a.lngLat || !b.lngLat) {
      this.routeError.set('Harap pilih titik asal dan tujuan terlebih dahulu.');
      return;
    }

    this.isLoading.set(true);
    this.routeError.set(null);

    const mode = this.selectedMode();
    const [aLng, aLat] = a.lngLat;
    const [bLng, bLat] = b.lngLat;
    const coords = `${aLng},${aLat};${bLng},${bLat}`;
    const url =
      `https://router.project-osrm.org/route/v1/${mode.osrmProfile}/${coords}` +
      `?alternatives=true&steps=true&geometries=geojson&overview=full&annotations=false`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: {
        code: string;
        routes: Array<{
          geometry: LineString;
          distance: number;
          duration: number;
          legs: OsrmLeg[];
        }>;
      } = await res.json();

      if (data.code !== 'Ok' || !data.routes?.length) {
        throw new Error('Tidak ada rute yang ditemukan oleh OSRM.');
      }

      // Map to RouteResult, apply speed factor
      const results: RouteResult[] = data.routes.slice(0, 3).map((r, i) => ({
        index: i,
        geometry: r.geometry,
        distance: r.distance,
        duration: r.duration * mode.speedFactor,
        legs: r.legs,
      }));

      this.routes.set(results);
      this.selectedRouteIndex.set(0);
      this.expandedSteps.set(null);

      // Update map layers
      this.renderRoutesOnMap(results);
      this.updateMarkers();
      this.fitMapToBounds(a.lngLat, b.lngLat, results[0].geometry);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
      this.routeError.set(
        `Gagal menghitung rute: ${msg}. Coba lagi atau pilih preset lokasi.`
      );
      this.routes.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Ensures route sources and layers exist on the map */
  private ensureRouteLayers(): void {
    if (!this.map) return;

    for (let i = 0; i < 3; i++) {
      const sourceId = `route-${i}`;
      const outlineId = `route-outline-${i}`;
      const lineId = `route-line-${i}`;
      const color = this.ROUTE_COLORS[i] ?? '#6b7280';

      if (!this.map.getSource(sourceId)) {
        try {
          this.map.addSource(sourceId, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });
        } catch { }
      }

      if (!this.map.getLayer(outlineId) && this.map.getSource(sourceId)) {
        try {
          this.map.addLayer({
            id: outlineId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
              visibility: 'visible',
            },
            paint: {
              'line-color': '#ffffff',
              'line-width': 10,
              'line-opacity': 0.8,
            },
          });
        } catch { }
      }

      if (!this.map.getLayer(lineId) && this.map.getSource(sourceId)) {
        try {
          this.map.addLayer({
            id: lineId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
              visibility: 'visible',
            },
            paint: {
              'line-color': color,
              'line-width': 6,
              'line-opacity': 0.95,
            },
          });
        } catch { }
      }
    }
  }

  private renderRoutesOnMap(routes: RouteResult[]): void {
    if (!this.map) return;

    this.ensureRouteLayers();
    const selected = this.selectedRouteIndex();

    for (let i = 0; i < 3; i++) {
      const route = routes[i];
      const sourceId = `route-${i}`;
      const outlineId = `route-outline-${i}`;
      const lineId = `route-line-${i}`;
      const color = this.ROUTE_COLORS[i] ?? '#6b7280';
      const isSelected = i === selected;

      const source = this.map.getSource(sourceId) as GeoJSONSource | undefined;

      if (!route) {
        if (source) {
          source.setData({ type: 'FeatureCollection', features: [] });
        }
        if (this.map.getLayer(lineId)) {
          this.map.setLayoutProperty(lineId, 'visibility', 'none');
        }
        if (this.map.getLayer(outlineId)) {
          this.map.setLayoutProperty(outlineId, 'visibility', 'none');
        }
        continue;
      }

      const geojsonData: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { routeIndex: i },
            geometry: route.geometry,
          },
        ],
      };

      if (source) {
        source.setData(geojsonData);
      }

      const lineWidth = isSelected ? 8 : 5;
      const lineOpacity = isSelected ? 1 : 0.65;
      const outlineWidth = isSelected ? 12 : 8;
      const outlineOpacity = isSelected ? 0.75 : 0.35;

      if (this.map.getLayer(outlineId)) {
        this.map.setLayoutProperty(outlineId, 'visibility', 'visible');
        this.map.setPaintProperty(outlineId, 'line-width', outlineWidth);
        this.map.setPaintProperty(outlineId, 'line-opacity', outlineOpacity);
        this.map.setPaintProperty(outlineId, 'line-color', '#ffffff');
      }

      if (this.map.getLayer(lineId)) {
        this.map.setLayoutProperty(lineId, 'visibility', 'visible');
        this.map.setPaintProperty(lineId, 'line-color', color);
        this.map.setPaintProperty(lineId, 'line-width', lineWidth);
        this.map.setPaintProperty(lineId, 'line-opacity', lineOpacity);
      }
    }

    // Move layers so selected is on top
    for (let i = 0; i < 3; i++) {
      if (i === selected) continue;
      const outlineId = `route-outline-${i}`;
      const lineId = `route-line-${i}`;
      if (this.map.getLayer(outlineId)) this.map.moveLayer(outlineId);
      if (this.map.getLayer(lineId)) this.map.moveLayer(lineId);
    }
    const selOutlineId = `route-outline-${selected}`;
    const selLineId = `route-line-${selected}`;
    if (this.map.getLayer(selOutlineId)) this.map.moveLayer(selOutlineId);
    if (this.map.getLayer(selLineId)) this.map.moveLayer(selLineId);

    this.updateSvgRoutes();
  }

  updateSvgRoutes(): void {
    if (!this.map) return;
    const currentRoutes = this.routes();
    if (!currentRoutes || currentRoutes.length === 0) {
      this.svgRoutePaths.set([]);
      return;
    }

    const selected = this.selectedRouteIndex();
    const paths: SvgRoutePath[] = [];

    // 1. Inactive alternate routes first (behind)
    for (let i = 0; i < currentRoutes.length; i++) {
      if (i === selected) continue;
      const r = currentRoutes[i];
      const d = this.projectGeometryToSvgPath(r.geometry);
      if (d) {
        paths.push({
          index: i,
          d,
          color: this.ROUTE_COLORS[i] ?? '#6b7280',
          isSelected: false,
        });
      }
    }

    // 2. Active selected route last (in front)
    const selRoute = currentRoutes[selected];
    if (selRoute) {
      const d = this.projectGeometryToSvgPath(selRoute.geometry);
      if (d) {
        paths.push({
          index: selected,
          d,
          color: this.ROUTE_COLORS[selected] ?? '#3b82f6',
          isSelected: true,
        });
      }
    }

    this.svgRoutePaths.set(paths);
  }

  private projectGeometryToSvgPath(geometry: LineString): string {
    if (!this.map || !geometry?.coordinates?.length) return '';
    const coords = geometry.coordinates as [number, number][];
    let d = '';
    const len = coords.length;
    for (let i = 0; i < len; i++) {
      const pt = this.map.project(coords[i]);
      const x = Math.round(pt.x * 10) / 10;
      const y = Math.round(pt.y * 10) / 10;
      d += i === 0 ? `M${x},${y}` : `L${x},${y}`;
    }
    return d;
  }

  private fitMapToBounds(a: [number, number], b: [number, number], geometry: LineString): void {
    if (!this.map) return;
    const coords = geometry.coordinates as [number, number][];
    if (!coords || coords.length === 0) return;
    let minLng = a[0], maxLng = a[0], minLat = a[1], maxLat = a[1];
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    this.map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
      padding: { top: 80, bottom: 120, left: 60, right: 60 },
      duration: 900,
      maxZoom: 15,
    });
  }

  // ── Actions ──
  applyPreset(preset: LocationPreset, index: number): void {
    this.activePresetIndex.set(index);
    this.pointA.set({ ...preset.a });
    this.pointB.set({ ...preset.b });
    this.routes.set([]);
    this.routeError.set(null);
    this.expandedSteps.set(null);
    this.updateMarkers();

    // Center map on midpoint
    if (this.map) {
      const midLng = (preset.a.lngLat[0] + preset.b.lngLat[0]) / 2;
      const midLat = (preset.a.lngLat[1] + preset.b.lngLat[1]) / 2;
      this.map.flyTo({ center: [midLng, midLat], zoom: 12, duration: 800 });
    }

    this.calculateRoute();
  }

  swapPoints(): void {
    const a = this.pointA();
    const b = this.pointB();
    this.pointA.set({ ...b, label: 'A' });
    this.pointB.set({ ...a, label: 'B' });
    this.routes.set([]);
    this.expandedSteps.set(null);
    this.updateMarkers();
    this.calculateRoute();
  }

  selectMode(mode: VehicleMode): void {
    this.selectedMode.set(mode);
    if (this.routes().length > 0) {
      this.routes.set([]);
      this.expandedSteps.set(null);
      this.calculateRoute();
    }
  }

  selectRoute(index: number): void {
    this.selectedRouteIndex.set(index);
    this.renderRoutesOnMap(this.routes());

    // Refit map to selected route
    const route = this.routes().find((r) => r.index === index);
    if (route) {
      this.fitMapToBounds(this.pointA().lngLat, this.pointB().lngLat, route.geometry);
    }
  }

  toggleSteps(index: number): void {
    this.expandedSteps.set(this.expandedSteps() === index ? null : index);
  }

  onInputChange(which: 'a' | 'b', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (which === 'a') {
      this.pointA.update((p) => ({ ...p, displayName: value }));
    } else {
      this.pointB.update((p) => ({ ...p, displayName: value }));
    }
    this.activePresetIndex.set(-1);
  }

  setMapStyle(style: 'light' | 'dark'): void {
    if (!this.map || this.mapStyle() === style) return;
    this.mapStyle.set(style);
    const newStyle = createRouteMapStyle(style === 'dark');

    this.map.setStyle(newStyle);
    this.updateSvgRoutes();

    // Listen to 'styledata' event which fires when style load finishes
    const onStyleData = () => {
      if (this.map?.isStyleLoaded()) {
        this.map.off('styledata', onStyleData);
        this.ensureRouteLayers();
        const currentRoutes = this.routes();
        if (currentRoutes.length > 0) {
          this.renderRoutesOnMap(currentRoutes);
        }
        this.updateSvgRoutes();
        this.updateMarkers();
      }
    };
    this.map.on('styledata', onStyleData);
  }

  // ── Cleanup ──
  ngOnDestroy(): void {
    this.markerA?.remove();
    this.markerB?.remove();
    this.map?.remove();
    this.map = null;
    this.mapReady = false;
  }
}
