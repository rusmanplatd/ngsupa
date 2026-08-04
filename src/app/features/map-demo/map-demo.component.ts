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

export interface LiveUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
  lngLat: [number, number];
  status: 'active' | 'idle' | 'away';
  lastSeen: number;
  speed: number;          // degrees per tick
  heading: [number, number]; // dx, dy direction
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

// ── LiveShare: simulated users ───────────────────────────────────────
export const LIVE_USERS_SEED: Omit<LiveUser, 'lngLat' | 'speed' | 'heading'>[] = [
  { id: 'u1', name: 'Alice',   avatar: '👩‍💻', color: '#007aff', status: 'active', lastSeen: 0 },
  { id: 'u2', name: 'Bob',     avatar: '👨‍🎨', color: '#ff375f', status: 'active', lastSeen: 0 },
  { id: 'u3', name: 'Cindy',  avatar: '👩‍🔬', color: '#30d158', status: 'active', lastSeen: 0 },
  { id: 'u4', name: 'David',  avatar: '👨‍🚀', color: '#ff9f0a', status: 'idle',   lastSeen: 0 },
  { id: 'u5', name: 'Eve',    avatar: '👩‍🎤', color: '#bf5af2', status: 'active', lastSeen: 0 },
  { id: 'u6', name: 'Frank',  avatar: '🧑‍💼', color: '#32ade6', status: 'away',   lastSeen: 0 },
];

// Map bounds for simulation (Greater Jakarta / Jabodetabek)
const SIM_BOUNDS = { minLng: 106.65, maxLng: 107.05, minLat: -6.45, maxLat: -6.05 };
const SIM_TICK_MS = 1400;

function randInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

@Component({
  selector: 'app-map-demo',
  imports: [],
  styleUrl: './map-demo.component.css',
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

        <!-- ─── LiveShare Demo ─── -->
        <section aria-labelledby="section-liveshare">
          <h2 id="section-liveshare" class="section-heading">👥 Live Presence &amp; Location Sharing</h2>
          <p class="section-description">
            Simulates Supabase Realtime presence channels — multiple users broadcasting
            their live location. Each avatar moves independently across the map in real time.
          </p>

          <div class="liveshare-layout">
            <!-- Map -->
            <div class="map-wrapper liveshare-map-wrapper">
              <div #liveMapEl class="map-container" id="live-map"></div>

              <!-- Live badge -->
              <div class="live-badge" aria-live="polite">
                <span class="live-dot"></span>
                <span>LIVE</span>
                <span class="live-count">{{ liveActiveCount() }} online</span>
              </div>

              <!-- Simulation controls -->
              <div class="sim-controls">
                <button
                  type="button"
                  class="sim-btn"
                  [class.active]="liveSimRunning()"
                  (click)="toggleSimulation()"
                  id="live-sim-toggle-btn">
                  {{ liveSimRunning() ? '⏸ Pause' : '▶ Resume' }}
                </button>
                <button
                  type="button"
                  class="sim-btn"
                  (click)="resetSimulation()"
                  id="live-sim-reset-btn">
                  🔄 Reset
                </button>
              </div>
            </div>

            <!-- Users Panel -->
            <div class="live-panel">
              <div class="live-panel-header">
                <h3>Active Sessions</h3>
                <span class="live-session-count">{{ liveUsers().length }} users</span>
              </div>

              <div class="live-users-list" role="list">
                @for (user of liveUsers(); track user.id) {
                  <div
                    class="live-user-row"
                    [class.idle]="user.status === 'idle'"
                    [class.away]="user.status === 'away'"
                    role="listitem">
                    <div class="live-user-avatar" [style.background]="user.color + '22'" [style.border-color]="user.color">
                      <span>{{ user.avatar }}</span>
                      <span class="live-user-status-dot" [class]="'status-' + user.status"></span>
                    </div>
                    <div class="live-user-info">
                      <div class="live-user-name">{{ user.name }}</div>
                      <div class="live-user-coords">
                        {{ user.lngLat[0].toFixed(2) }}°, {{ user.lngLat[1].toFixed(2) }}°
                      </div>
                    </div>
                    <span class="live-user-status-badge" [class]="'badge-' + user.status">{{ user.status }}</span>
                  </div>
                }
              </div>

              <!-- Channel info -->
              <div class="live-channel-info">
                <div class="channel-row">
                  <span class="channel-label">Channel</span>
                  <span class="channel-value">realtime:presence:map-demo</span>
                </div>
                <div class="channel-row">
                  <span class="channel-label">Events/s</span>
                  <span class="channel-value">{{ liveEventsPerSec() }}</span>
                </div>
                <div class="channel-row">
                  <span class="channel-label">Protocol</span>
                  <span class="channel-value">WebSocket</span>
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
  readonly liveMapEl = viewChild<ElementRef<HTMLDivElement>>('liveMapEl');

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

  // ── LiveShare signals ──
  readonly liveUsers = signal<LiveUser[]>([]);
  readonly liveSimRunning = signal<boolean>(true);
  readonly liveEventsPerSec = signal<string>('0');
  readonly liveActiveCount = computed(() => this.liveUsers().filter(u => u.status === 'active').length);

  // ── Map instances ──
  private mainMap: Map | null = null;
  private layerMap: Map | null = null;
  private geoMap: Map | null = null;
  private liveMap: Map | null = null;
  private markers: Marker[] = [];
  private geoMarker: Marker | null = null;
  private liveMarkers: Record<string, { marker: Marker; el: HTMLElement }> = {};
  private simInterval: ReturnType<typeof setInterval> | null = null;
  private eventCounter = 0;
  private eventRateInterval: ReturnType<typeof setInterval> | null = null;

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
      this.initLiveMap();

      setTimeout(() => {
        this.mainMap?.resize();
        this.layerMap?.resize();
        this.geoMap?.resize();
        this.liveMap?.resize();
      }, 300);

      window.addEventListener('resize', this.onWindowResize);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onWindowResize);
    this.stopSimulation();
    if (this.eventRateInterval) clearInterval(this.eventRateInterval);
    this.destroyAllMaps();
  }

  private onWindowResize = (): void => {
    this.mainMap?.resize();
    this.layerMap?.resize();
    this.geoMap?.resize();
    this.liveMap?.resize();
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

  // ── LiveShare / Simulation ──
  private initLiveMap(): void {
    if (this.liveMap) return;
    const el = this.liveMapEl()?.nativeElement;
    if (!el) return;

    this.liveMap = new Map({
      container: el,
      style: CARTO_DARK_STYLE,
      center: [106.845, -6.215],
      zoom: 10.5,
      attributionControl: false,
    });

    this.liveMap.addControl(new NavigationControl(), 'bottom-right');
    this.liveMap.addControl(new ScaleControl(), 'bottom-right');

    this.liveMap.on('load', () => {
      this.liveMap?.resize();
      this.initLiveUsers();
      this.startSimulation();
      this.startEventRateCounter();
    });
  }

  private initLiveUsers(): void {
    const users: LiveUser[] = LIVE_USERS_SEED.map((seed) => ({
      ...seed,
      lastSeen: Date.now(),
      lngLat: [
        randInRange(SIM_BOUNDS.minLng, SIM_BOUNDS.maxLng),
        randInRange(SIM_BOUNDS.minLat, SIM_BOUNDS.maxLat),
      ],
      speed: randInRange(0.002, 0.006),
      heading: [
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ],
    }));
    this.liveUsers.set(users);
    users.forEach((u) => this.addOrUpdateLiveMarker(u));
  }

  private addOrUpdateLiveMarker(user: LiveUser): void {
    if (!this.liveMap) return;
    const existing = this.liveMarkers[user.id];
    if (existing) {
      existing.marker.setLngLat(user.lngLat);
      existing.el.style.opacity = user.status === 'away' ? '0.45' : '1';
      return;
    }

    const el = document.createElement('div');
    el.className = 'live-avatar-marker';
    el.setAttribute('aria-label', `${user.name} is at this location`);
    el.innerHTML = `
      <div class="avatar-pin">
        <div class="avatar-bubble" style="background: ${user.color}; box-shadow: 0 2px 8px ${user.color}66, 0 0 0 2px ${user.color}44">
          <span class="avatar-emoji">${user.avatar}</span>
        </div>
        <div class="avatar-label" style="color: ${user.color}">${user.name}</div>
      </div>
    `;

    const marker = new Marker({ element: el, anchor: 'top' })
      .setLngLat(user.lngLat)
      .addTo(this.liveMap);

    this.liveMarkers[user.id] = { marker, el };
  }

  private startSimulation(): void {
    this.liveSimRunning.set(true);
    this.simInterval = setInterval(() => this.tickSimulation(), SIM_TICK_MS);
  }

  private stopSimulation(): void {
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    this.liveSimRunning.set(false);
  }

  private tickSimulation(): void {
    const current = this.liveUsers();
    const updated = current.map((user) => {
      if (user.status === 'away') return user;

      // Occasionally change direction or status
      let heading = user.heading;
      let status = user.status;

      if (Math.random() < 0.15) {
        const angle = Math.random() * Math.PI * 2;
        heading = [Math.cos(angle), Math.sin(angle)] as [number, number];
      }
      if (Math.random() < 0.08) {
        status = status === 'active' ? 'idle' : 'active';
      }

      let newLng = user.lngLat[0] + heading[0] * user.speed;
      let newLat = user.lngLat[1] + heading[1] * user.speed * 0.5;

      // Bounce off bounds
      if (newLng < SIM_BOUNDS.minLng || newLng > SIM_BOUNDS.maxLng) {
        heading = [-heading[0], heading[1]] as [number, number];
        newLng = Math.max(SIM_BOUNDS.minLng, Math.min(SIM_BOUNDS.maxLng, newLng));
      }
      if (newLat < SIM_BOUNDS.minLat || newLat > SIM_BOUNDS.maxLat) {
        heading = [heading[0], -heading[1]] as [number, number];
        newLat = Math.max(SIM_BOUNDS.minLat, Math.min(SIM_BOUNDS.maxLat, newLat));
      }

      return {
        ...user,
        lngLat: [newLng, newLat] as [number, number],
        heading,
        status,
        lastSeen: Date.now(),
      };
    });

    this.liveUsers.set(updated);
    updated.forEach((u) => this.addOrUpdateLiveMarker(u));
    this.eventCounter += updated.filter(u => u.status !== 'away').length;
  }

  private startEventRateCounter(): void {
    let last = 0;
    this.eventRateInterval = setInterval(() => {
      const rate = this.eventCounter - last;
      last = this.eventCounter;
      this.liveEventsPerSec.set(String(rate));
    }, 1000);
  }

  toggleSimulation(): void {
    if (this.liveSimRunning()) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  resetSimulation(): void {
    this.stopSimulation();
    // Remove all live markers
    Object.values(this.liveMarkers).forEach(({ marker }) => marker.remove());
    this.liveMarkers = {};
    this.liveUsers.set([]);
    this.eventCounter = 0;
    this.liveEventsPerSec.set('0');
    setTimeout(() => {
      this.initLiveUsers();
      this.startSimulation();
    }, 400);
  }

  // ── Cleanup ──
  private destroyAllMaps(): void {
    this.markers.forEach((m) => m.remove());
    this.markers = [];
    this.geoMarker?.remove();
    Object.values(this.liveMarkers).forEach(({ marker }) => marker.remove());
    this.liveMarkers = {};
    this.mainMap?.remove();
    this.layerMap?.remove();
    this.geoMap?.remove();
    this.liveMap?.remove();
    this.mainMap = null;
    this.layerMap = null;
    this.geoMap = null;
    this.liveMap = null;
  }
}
