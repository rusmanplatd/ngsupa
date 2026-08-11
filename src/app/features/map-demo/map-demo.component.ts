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
import { CARTO_DARK_STYLE, CARTO_POSITRON_STYLE, CARTO_VOYAGER_STYLE, countryCodeToFlagEmoji, ESRI_SATELLITE_STYLE, HexFeature, HexFeatureCollection, JAVA_HEAT_POINTS, JAVA_HEX_GRID, JAVA_ROUTE_COORDS, LayerItem, LIVE_USERS_SEED, LiveUser, MapStyle, OPENFREEMAP_LIBERTY_STYLE, OSM_STYLE, PoiMarker, POPULAR_LOCATIONS, randInRange, SearchResultItem, SIM_BOUNDS, SIM_TICK_MS } from './map-demo.types';

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

              <!-- Dynamic GeoJSON SVG Overlay -->
              <svg class="layer-svg-overlay" aria-hidden="false">
                <defs>
                  <filter id="heat-blur" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="16" />
                  </filter>
                  @for (hp of projectedHeatPoints(); track $index) {
                    <radialGradient [id]="'heat-grad-' + $index" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#ff2d55" stop-opacity="0.9" />
                      <stop offset="35%" stop-color="#ff9500" stop-opacity="0.75" />
                      <stop offset="70%" stop-color="#ffd60a" stop-opacity="0.45" />
                      <stop offset="100%" stop-color="#bf5af2" stop-opacity="0" />
                    </radialGradient>
                  }
                </defs>

                <!-- 1. H3 Hex Grid Layer -->
                @if (isLayerVisible('grid-layer')) {
                  <g class="hex-grid-group">
                    @for (hex of projectedHexGrid(); track $index) {
                      <polygon
                        [attr.points]="hex.points"
                        [attr.fill]="hex.fillColor"
                        stroke="#ff9f0a"
                        stroke-width="1.2"
                        stroke-opacity="0.75"
                        class="hex-polygon interactive-element"
                        (click)="onHexClick($event, hex)"
                      />
                    }
                  </g>
                }

                <!-- 2. Population Heat Layer -->
                @if (isLayerVisible('heat-layer')) {
                  <g class="heat-group" filter="url(#heat-blur)">
                    @for (hp of projectedHeatPoints(); track $index) {
                      <circle
                        [attr.cx]="hp.x"
                        [attr.cy]="hp.y"
                        [attr.r]="hp.radius"
                        [attr.fill]="'url(#heat-grad-' + $index + ')'"
                      />
                    }
                  </g>
                }

                <!-- 3. Route Overlay Layer -->
                @if (isLayerVisible('route-layer')) {
                  <g class="route-group interactive-element" (click)="onRouteClick($event)">
                    <!-- Outer glow -->
                    <path
                      [attr.d]="projectedRoutePath()"
                      fill="none"
                      stroke="rgba(48, 209, 88, 0.4)"
                      stroke-width="10"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <!-- Solid line -->
                    <path
                      [attr.d]="projectedRoutePath()"
                      fill="none"
                      stroke="#30d158"
                      stroke-width="3.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <!-- Animated dashed line -->
                    <path
                      [attr.d]="projectedRoutePath()"
                      fill="none"
                      stroke="#ffffff"
                      stroke-width="1.5"
                      stroke-dasharray="8 12"
                      class="route-dash-anim"
                    />
                  </g>
                }

                <!-- 4. Points of Interest Layer -->
                @if (isLayerVisible('poi-layer')) {
                  <g class="poi-group">
                    @for (poi of projectedPoiList(); track poi.id) {
                      <g class="poi-marker-item interactive-element" (click)="onPoiClick($event, poi)">
                        <!-- Pulse wave -->
                        <circle
                          [attr.cx]="poi.x"
                          [attr.cy]="poi.y"
                          r="12"
                          [attr.fill]="poi.color"
                          fill-opacity="0.25"
                        />
                        <!-- Outer white border -->
                        <circle
                          [attr.cx]="poi.x"
                          [attr.cy]="poi.y"
                          r="7.5"
                          [attr.fill]="poi.color"
                          stroke="#ffffff"
                          stroke-width="2.5"
                        />
                        <!-- Center dot -->
                        <circle
                          [attr.cx]="poi.x"
                          [attr.cy]="poi.y"
                          r="2.5"
                          fill="#ffffff"
                        />
                        <!-- City label -->
                        <text
                          [attr.x]="poi.x + 10"
                          [attr.y]="poi.y + 4"
                          class="poi-svg-label"
                        >{{ poi.label }}</text>
                      </g>
                    }
                  </g>
                }
              </svg>
            </div>

            <div class="layer-controls">
              <h3>Layer Controls</h3>
              @for (layer of layerItems(); track layer.id) {
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
                      (change)="toggleLayer(layer.id)"
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
      description: '<b>Jakarta</b><br>Capital of Indonesia & financial center',
    },
    {
      id: 'bogor',
      label: 'Bogor',
      lngLat: [106.7973, -6.5971],
      color: '#30d158',
      description: '<b>Bogor</b><br>City of Rain & Botanical Gardens',
    },
    {
      id: 'bandung',
      label: 'Bandung',
      lngLat: [107.6191, -6.9175],
      color: '#5856d6',
      description: '<b>Bandung</b><br>Parahyangan Highlands & tech hub',
    },
    {
      id: 'cirebon',
      label: 'Cirebon',
      lngLat: [108.5523, -6.7320],
      color: '#ff9f0a',
      description: '<b>Cirebon</b><br>Historic port & Sultanate palace',
    },
    {
      id: 'semarang',
      label: 'Semarang',
      lngLat: [110.4203, -6.9932],
      color: '#007aff',
      description: '<b>Semarang</b><br>Capital of Central Java & Lawang Sewu',
    },
    {
      id: 'yogyakarta',
      label: 'Yogyakarta',
      lngLat: [110.3645, -7.7956],
      color: '#bf5af2',
      description: '<b>Yogyakarta</b><br>Cultural heart of Java & Borobudur gateway',
    },
    {
      id: 'surakarta',
      label: 'Surakarta (Solo)',
      lngLat: [110.8243, -7.5666],
      color: '#af52de',
      description: '<b>Surakarta (Solo)</b><br>Royal heritage & Keraton Surakarta',
    },
    {
      id: 'surabaya',
      label: 'Surabaya',
      lngLat: [112.7521, -7.2575],
      color: '#ff375f',
      description: '<b>Surabaya</b><br>City of Heroes & second-largest metropolis',
    },
    {
      id: 'malang',
      label: 'Malang',
      lngLat: [112.6326, -7.9666],
      color: '#ff2d55',
      description: '<b>Malang</b><br>Highland city & Mount Bromo gateway',
    },
    {
      id: 'banyuwangi',
      label: 'Banyuwangi',
      lngLat: [114.3646, -8.2192],
      color: '#30d158',
      description: '<b>Banyuwangi</b><br>Eastern tip of Java & Ijen crater gateway',
    },
    {
      id: 'bali',
      label: 'Bali',
      lngLat: [115.1889, -8.4095],
      color: '#ff9500',
      description: '<b>Bali</b><br>Island of the Gods',
    },
  ];

  readonly layerItems = signal<LayerItem[]>([
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
      visible: true,
    },
    {
      id: 'grid-layer',
      label: 'H3 Grid',
      desc: 'Hex grid cells',
      color: '#ff9f0a',
      visible: true,
    },
  ]);

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

  // ── Projected SVG GeoJSON Layer Signals ──
  readonly projectedHexGrid = signal<{ points: string; fillColor: string; density: number; lngLat: [number, number] }[]>([]);
  readonly projectedHeatPoints = signal<{ x: number; y: number; radius: number }[]>([]);
  readonly projectedRoutePath = signal<string>('');
  readonly projectedPoiList = signal<{ id: string; label: string; x: number; y: number; color: string; description: string; lngLat: [number, number] }[]>([]);

  isLayerVisible(layerId: string): boolean {
    return this.layerItems().find((l) => l.id === layerId)?.visible ?? false;
  }

  private updateSvgLayerProjections(): void {
    if (!this.layerMap) return;

    // 1. POI Projections
    const pois = this.poiMarkers.map((p) => {
      const pt = this.layerMap!.project(p.lngLat);
      return {
        id: p.id,
        label: p.label,
        x: Math.round(pt.x * 10) / 10,
        y: Math.round(pt.y * 10) / 10,
        color: p.color,
        description: p.description,
        lngLat: p.lngLat as [number, number],
      };
    });
    this.projectedPoiList.set(pois);

    // 2. Heat Points Projections
    const currentZoom = this.layerMap.getZoom();
    const heat = JAVA_HEAT_POINTS.map((hp) => {
      const pt = this.layerMap!.project(hp.coords as [number, number]);
      const radius = Math.max(28, Math.min(85, 30 * Math.pow(1.25, currentZoom - 5) * (hp.w / 6)));
      return {
        x: Math.round(pt.x * 10) / 10,
        y: Math.round(pt.y * 10) / 10,
        radius: Math.round(radius),
      };
    });
    this.projectedHeatPoints.set(heat);

    // 3. Route Path Projection
    let d = '';
    for (let i = 0; i < JAVA_ROUTE_COORDS.length; i++) {
      const pt = this.layerMap.project(JAVA_ROUTE_COORDS[i]);
      const x = Math.round(pt.x * 10) / 10;
      const y = Math.round(pt.y * 10) / 10;
      d += i === 0 ? `M${x},${y}` : `L${x},${y}`;
    }
    this.projectedRoutePath.set(d);

    // 4. Hex Grid Projections
    const hexes = JAVA_HEX_GRID.features.map((feat) => {
      const ring = feat.geometry.coordinates[0];
      const pts = ring.map((coord) => {
        const pt = this.layerMap!.project(coord as [number, number]);
        return `${Math.round(pt.x * 10) / 10},${Math.round(pt.y * 10) / 10}`;
      }).join(' ');
      const density = feat.properties.density;
      const opacity = 0.15 + density * 0.55;
      const fillColor = `rgba(255, 159, 10, ${opacity.toFixed(2)})`;
      const centerLngLat = ring[0] as [number, number];
      return {
        points: pts,
        fillColor,
        density,
        lngLat: centerLngLat,
      };
    });
    this.projectedHexGrid.set(hexes);
  }

  onPoiClick(event: MouseEvent, poi: { label: string; description: string; lngLat: [number, number] }): void {
    event.stopPropagation();
    if (!this.layerMap) return;
    new Popup({ offset: 15, focusAfterOpen: false })
      .setLngLat(poi.lngLat)
      .setHTML(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px;">
          <div style="font-size: 0.95rem; font-weight: 700; color: #1c1c1e; margin-bottom: 2px;">📍 ${poi.label}</div>
          <div style="font-size: 0.8125rem; color: #6e6e73;">${poi.description}</div>
        </div>
      `)
      .addTo(this.layerMap);
  }

  onRouteClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.layerMap) return;
    new Popup({ offset: 10, focusAfterOpen: false })
      .setLngLat([110.4203, -6.9932])
      .setHTML(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px;">
          <div style="font-size: 0.95rem; font-weight: 700; color: #30d158; margin-bottom: 2px;">🛣️ Trans-Java Route</div>
          <div style="font-size: 0.8125rem; color: #6e6e73;">Jakarta — Surabaya — Bali GeoJSON corridor</div>
        </div>
      `)
      .addTo(this.layerMap);
  }

  onHexClick(event: MouseEvent, hex: { density: number; lngLat: [number, number] }): void {
    event.stopPropagation();
    if (!this.layerMap) return;
    const densityVal = (hex.density * 100).toFixed(0);
    new Popup({ offset: 10, focusAfterOpen: false })
      .setLngLat(hex.lngLat)
      .setHTML(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px;">
          <div style="font-size: 0.95rem; font-weight: 700; color: #ff9f0a; margin-bottom: 2px;">⬡ H3 Hex Cell</div>
          <div style="font-size: 0.8125rem; color: #1c1c1e;">Relative Density Index: <b>${densityVal}%</b></div>
        </div>
      `)
      .addTo(this.layerMap);
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

    (window as any).layerMap = this.layerMap;

    const update = () => this.updateSvgLayerProjections();

    this.layerMap.on('move', update);
    this.layerMap.on('zoom', update);
    this.layerMap.on('resize', update);
    this.layerMap.on('render', update);
    this.layerMap.on('load', () => {
      this.layerMap?.resize();
      update();
    });

    // Run initial projection update
    setTimeout(() => update(), 150);
  }

  toggleLayer(layerId: string): void {
    this.layerItems.update((items) =>
      items.map((item) => {
        if (item.id === layerId) {
          return { ...item, visible: !item.visible };
        }
        return item;
      })
    );
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
