import { LngLatLike, StyleSpecification } from "maplibre-gl";

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

export interface LayerItem {
    id: string;
    label: string;
    desc: string;
    color: string;
    visible: boolean;
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

export interface HexFeature {
    type: 'Feature';
    geometry: {
        type: 'Polygon';
        coordinates: [number, number][][];
    };
    properties: {
        density: number;
    };
}

export interface HexFeatureCollection {
    type: 'FeatureCollection';
    features: HexFeature[];
}

export function randInRange(min: number, max: number) {
    return min + Math.random() * (max - min);
}

// ── H3-style Hex Grid Generator (pure GeoJSON, no H3 library needed) ─
/**
 * Generates a grid of regular hexagon polygons covering the given bounding box.
 * Uses a flat-top hexagon layout projected in WGS84 degrees.
 */
export function generateHexGrid(
    minLng: number, minLat: number, maxLng: number, maxLat: number,
    radiusDeg: number,
): HexFeatureCollection {
    const w = radiusDeg * Math.sqrt(3);
    const h = radiusDeg * 2;
    const horizSpacing = w;
    const vertSpacing = h * 0.75;

    const features: HexFeature[] = [];

    let row = 0;
    for (let lat = minLat; lat < maxLat + h; lat += vertSpacing) {
        const offset = row % 2 === 0 ? 0 : w / 2;
        for (let lng = minLng - w; lng < maxLng + w; lng += horizSpacing) {
            const cx = lng + offset;
            const cy = lat;
            const coords: [number, number][] = [];
            for (let i = 0; i < 6; i++) {
                const angleDeg = 60 * i - 30;
                const angleRad = (Math.PI / 180) * angleDeg;
                coords.push([
                    Number((cx + radiusDeg * Math.sin(angleRad)).toFixed(5)),
                    Number((cy + radiusDeg * Math.cos(angleRad)).toFixed(5)),
                ]);
            }
            coords.push([coords[0][0], coords[0][1]]); // close ring

            // Only include hexes that overlap the bounding box
            const hexMinLng = Math.min(...coords.map(c => c[0]));
            const hexMaxLng = Math.max(...coords.map(c => c[0]));
            const hexMinLat = Math.min(...coords.map(c => c[1]));
            const hexMaxLat = Math.max(...coords.map(c => c[1]));
            if (hexMaxLng >= minLng && hexMinLng <= maxLng && hexMaxLat >= minLat && hexMinLat <= maxLat) {
                const density = Number((0.2 + (Math.sin(cx * 1.5) * Math.cos(cy * 2) + 1) * 0.38).toFixed(2));
                features.push({
                    type: 'Feature',
                    geometry: { type: 'Polygon', coordinates: [coords] },
                    properties: { density },
                });
            }
        }
        row++;
    }
    return { type: 'FeatureCollection', features };
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
    { id: 'u1', name: 'Alice', avatar: '👩‍💻', color: '#007aff', status: 'active', lastSeen: 0 },
    { id: 'u2', name: 'Bob', avatar: '👨‍🎨', color: '#ff375f', status: 'active', lastSeen: 0 },
    { id: 'u3', name: 'Cindy', avatar: '👩‍🔬', color: '#30d158', status: 'active', lastSeen: 0 },
    { id: 'u4', name: 'David', avatar: '👨‍🚀', color: '#ff9f0a', status: 'idle', lastSeen: 0 },
    { id: 'u5', name: 'Eve', avatar: '👩‍🎤', color: '#bf5af2', status: 'active', lastSeen: 0 },
    { id: 'u6', name: 'Frank', avatar: '🧑‍💼', color: '#32ade6', status: 'away', lastSeen: 0 },
];

// Map bounds for simulation (Greater Jakarta / Jabodetabek)
export const SIM_BOUNDS = { minLng: 106.65, maxLng: 107.05, minLat: -6.45, maxLat: -6.05 };
export const SIM_TICK_MS = 1400;

// Pre-compute Java hex grid (runs once at module load, lightweight)
export const JAVA_HEX_GRID = generateHexGrid(
    105.0, -8.8, 115.8, -5.8, // Java + Bali bounding box
    0.35,                      // ~35km hex radius in degrees
);

export const JAVA_POI_GEOJSON = {
    type: 'FeatureCollection' as const,
    features: [
        { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [106.8272, -6.1751] }, properties: { label: 'Jakarta', color: '#007aff', description: 'Capital of Indonesia & financial center' } },
        { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [106.7973, -6.5971] }, properties: { label: 'Bogor', color: '#30d158', description: 'City of Rain & Botanical Gardens' } },
        { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [107.6191, -6.9175] }, properties: { label: 'Bandung', color: '#5856d6', description: 'Parahyangan Highlands & tech hub' } },
        { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [108.5523, -6.7320] }, properties: { label: 'Cirebon', color: '#ff9f0a', description: 'Historic port & Sultanate palace' } },
        { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [110.4203, -6.9932] }, properties: { label: 'Semarang', color: '#007aff', description: 'Capital of Central Java & Lawang Sewu' } },
        { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [110.3645, -7.7956] }, properties: { label: 'Yogyakarta', color: '#bf5af2', description: 'Cultural heart of Java & Borobudur gateway' } },
        { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [110.8243, -7.5666] }, properties: { label: 'Surakarta (Solo)', color: '#af52de', description: 'Royal heritage & Keraton Surakarta' } },
        { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [112.7521, -7.2575] }, properties: { label: 'Surabaya', color: '#ff375f', description: 'City of Heroes & second-largest metropolis' } },
        { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [112.6326, -7.9666] }, properties: { label: 'Malang', color: '#ff2d55', description: 'Highland city & Mount Bromo gateway' } },
        { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [114.3646, -8.2192] }, properties: { label: 'Banyuwangi', color: '#30d158', description: 'Eastern tip of Java & Ijen crater gateway' } },
        { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [115.1889, -8.4095] }, properties: { label: 'Bali', color: '#ff9500', description: 'Island of the Gods' } },
    ],
};

export const JAVA_HEAT_POINTS = [
    { coords: [106.8272, -6.1751], w: 10 },   // Jakarta
    { coords: [106.9723, -6.2642], w: 7 },    // Bekasi
    { coords: [106.7590, -6.2615], w: 7 },    // Tangerang
    { coords: [106.8177, -6.3159], w: 6 },    // Depok
    { coords: [106.7973, -6.5971], w: 5 },    // Bogor
    { coords: [107.6191, -6.9175], w: 8 },    // Bandung
    { coords: [108.5523, -6.7320], w: 4 },    // Cirebon
    { coords: [109.2441, -7.4144], w: 4 },    // Purwokerto
    { coords: [110.4203, -6.9932], w: 6 },    // Semarang
    { coords: [110.3645, -7.7956], w: 6 },    // Yogyakarta
    { coords: [110.8243, -7.5666], w: 5 },    // Solo
    { coords: [111.4634, -7.1444], w: 3 },    // Madiun
    { coords: [112.7521, -7.2575], w: 9 },    // Surabaya
    { coords: [112.6326, -7.9666], w: 6 },    // Malang
    { coords: [113.7160, -7.9839], w: 3 },    // Jember
    { coords: [114.3646, -8.2192], w: 3 },    // Banyuwangi
    { coords: [115.2167, -8.6705], w: 6 },    // Denpasar
];

export const JAVA_HEAT_GEOJSON = {
    type: 'FeatureCollection' as const,
    features: JAVA_HEAT_POINTS.map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: p.coords },
        properties: { weight: p.w },
    })),
};

export const JAVA_ROUTE_COORDS: [number, number][] = [
    [106.8292, -6.1731],
    [106.8216, -6.1713],
    [106.8151, -6.1848],
    [106.8155, -6.2013],
    [106.7985, -6.2055],
    [106.7889, -6.2258],
    [106.7908, -6.2291],
    [106.7841, -6.2364],
    [106.7813, -6.2481],
    [106.7837, -6.2697],
    [106.7802, -6.2866],
    [106.7669, -6.2906],
    [106.7653, -6.2971],
    [106.7545, -6.3111],
    [106.7472, -6.3124],
    [106.7497, -6.3527],
    [106.7417, -6.4049],
    [106.7371, -6.4068],
    [106.7315, -6.4263],
    [106.7349, -6.4346],
    [106.7292, -6.4661],
    [106.7317, -6.4826],
    [106.7368, -6.4894],
    [106.7507, -6.4943],
    [106.7575, -6.4998],
    [106.7581, -6.5187],
    [106.766, -6.529],
    [106.7792, -6.556],
    [106.778, -6.5578],
    [106.7877, -6.5701],
    [106.79, -6.5987],
    [106.7942, -6.5983],
    [106.7971, -6.5931],
    [106.8025, -6.5931],
    [106.805, -6.601],
    [106.7989, -6.6031],
    [106.7998, -6.605],
    [106.812, -6.6178],
    [106.8152, -6.6176],
    [106.8259, -6.6337],
    [106.8423, -6.6468],
    [106.8544, -6.6627],
    [106.8568, -6.6625],
    [106.8591, -6.6554],
    [106.8691, -6.6524],
    [106.8774, -6.6542],
    [106.9031, -6.6499],
    [106.9098, -6.6525],
    [106.9259, -6.6689],
    [106.9301, -6.6789],
    [106.9376, -6.6869],
    [106.9513, -6.6841],
    [106.9601, -6.6887],
    [106.9633, -6.6939],
    [106.9689, -6.6945],
    [106.9728, -6.7039],
    [106.9801, -6.7061],
    [106.9827, -6.7043],
    [106.9815, -6.7002],
    [106.9857, -6.6989],
    [106.9866, -6.7011],
    [106.9881, -6.6976],
    [106.9907, -6.7018],
    [106.9951, -6.6995],
    [106.9924, -6.7075],
    [106.9959, -6.712],
    [106.9979, -6.7095],
    [107.0085, -6.7142],
    [107.0209, -6.7124],
    [107.0293, -6.7165],
    [107.033, -6.7231],
    [107.0365, -6.724],
    [107.0358, -6.7269],
    [107.0383, -6.7253],
    [107.0402, -6.7277],
    [107.048, -6.7464],
    [107.047, -6.7575],
    [107.0633, -6.7726],
    [107.0649, -6.7875],
    [107.0825, -6.7989],
    [107.0857, -6.7983],
    [107.0846, -6.8006],
    [107.1121, -6.8032],
    [107.1315, -6.8145],
    [107.1921, -6.7966],
    [107.2351, -6.8075],
    [107.2411, -6.8155],
    [107.2741, -6.8078],
    [107.2845, -6.8079],
    [107.2953, -6.8121],
    [107.3078, -6.8263],
    [107.3427, -6.8331],
    [107.3652, -6.8318],
    [107.3954, -6.8203],
    [107.4019, -6.8243],
    [107.4061, -6.8237],
    [107.4141, -6.8352],
    [107.4165, -6.8329],
    [107.4262, -6.8348],
    [107.4323, -6.8308],
    [107.4652, -6.8324],
    [107.4973, -6.8515],
    [107.499, -6.8593],
    [107.5039, -6.8636],
    [107.5317, -6.8687],
    [107.5492, -6.8779],
    [107.5691, -6.9104],
    [107.5763, -6.9133],
    [107.5917, -6.9165],
    [107.609, -6.9138],
    [107.6195, -6.9214],
    [107.6219, -6.9201],
    [107.6196, -6.9176],
    [107.6219, -6.9201],
    [107.6551, -6.902],
    [107.6811, -6.9052],
    [107.6913, -6.9123],
    [107.7031, -6.9144],
    [107.7168, -6.9343],
    [107.7263, -6.9331],
    [107.7342, -6.9384],
    [107.7504, -6.9401],
    [107.7838, -6.9289],
    [107.784, -6.9251],
    [107.7927, -6.9184],
    [107.7928, -6.9132],
    [107.8049, -6.8966],
    [107.8287, -6.8976],
    [107.8434, -6.8851],
    [107.8507, -6.8861],
    [107.8699, -6.8777],
    [107.8717, -6.8704],
    [107.881, -6.866],
    [107.8876, -6.8673],
    [107.9004, -6.8616],
    [107.9067, -6.8634],
    [107.9213, -6.8603],
    [107.9262, -6.8401],
    [107.9419, -6.827],
    [107.9471, -6.8144],
    [107.9576, -6.8157],
    [107.9798, -6.8072],
    [107.9865, -6.8078],
    [108.019, -6.7885],
    [108.0219, -6.7911],
    [108.0309, -6.7885],
    [108.0397, -6.7901],
    [108.0409, -6.7875],
    [108.0457, -6.7929],
    [108.0502, -6.7906],
    [108.0798, -6.7938],
    [108.0829, -6.7892],
    [108.1022, -6.778],
    [108.1157, -6.7811],
    [108.1209, -6.7674],
    [108.1323, -6.762],
    [108.1435, -6.7609],
    [108.1659, -6.7667],
    [108.199, -6.7606],
    [108.2208, -6.7415],
    [108.2295, -6.7395],
    [108.2349, -6.7419],
    [108.2519, -6.742],
    [108.2696, -6.7274],
    [108.2997, -6.7203],
    [108.3094, -6.7094],
    [108.3171, -6.7053],
    [108.34, -6.7037],
    [108.3549, -6.7057],
    [108.3625, -6.7026],
    [108.3705, -6.6944],
    [108.3886, -6.6941],
    [108.3983, -6.696],
    [108.4089, -6.7036],
    [108.4419, -6.7107],
    [108.4554, -6.7073],
    [108.4627, -6.7019],
    [108.4872, -6.7004],
    [108.5322, -6.7098],
    [108.5433, -6.7381],
    [108.5481, -6.7395],
    [108.5525, -6.7323],
    [108.5482, -6.7396],
    [108.5724, -6.7428],
    [108.5821, -6.7393],
    [108.5995, -6.7677],
    [108.6121, -6.7789],
    [108.6471, -6.7886],
    [108.6568, -6.7994],
    [108.6907, -6.8111],
    [108.6987, -6.8173],
    [108.7232, -6.8168],
    [108.7504, -6.8266],
    [108.783, -6.8311],
    [108.8135, -6.8459],
    [108.841, -6.873],
    [108.8491, -6.8759],
    [108.8959, -6.8712],
    [108.9185, -6.8747],
    [108.9564, -6.875],
    [108.9868, -6.8672],
    [108.997, -6.8519],
    [109.0072, -6.845],
    [109.0264, -6.8428],
    [109.0719, -6.8491],
    [109.0991, -6.8603],
    [109.1198, -6.8595],
    [109.1255, -6.8536],
    [109.1428, -6.8552],
    [109.1506, -6.8595],
    [109.1695, -6.8635],
    [109.2514, -6.873],
    [109.2939, -6.8749],
    [109.3261, -6.8704],
    [109.3554, -6.873],
    [109.3684, -6.8711],
    [109.3791, -6.8797],
    [109.4074, -6.881],
    [109.4341, -6.8859],
    [109.4348, -6.8925],
    [109.4393, -6.8961],
    [109.4338, -6.9058],
    [109.4336, -6.9198],
    [109.4415, -6.9226],
    [109.4575, -6.9254],
    [109.4984, -6.9247],
    [109.5303, -6.9336],
    [109.5613, -6.9341],
    [109.5862, -6.941],
    [109.6098, -6.9428],
    [109.6512, -6.9514],
    [109.7204, -6.9447],
    [109.7451, -6.9333],
    [109.782, -6.9232],
    [109.7991, -6.9139],
    [109.8086, -6.9119],
    [109.8534, -6.9198],
    [109.8705, -6.92],
    [109.8898, -6.9256],
    [109.9176, -6.9206],
    [109.9294, -6.9213],
    [109.9779, -6.9348],
    [110.0166, -6.9604],
    [110.0583, -6.9756],
    [110.1312, -6.9877],
    [110.1567, -6.988],
    [110.1884, -6.9926],
    [110.2537, -6.9736],
    [110.2772, -6.9726],
    [110.2854, -6.9683],
    [110.2981, -6.9734],
    [110.3126, -6.9724],
    [110.3302, -6.9764],
    [110.3423, -6.986],
    [110.3515, -6.9823],
    [110.3666, -6.9879],
    [110.4005, -6.9806],
    [110.4098, -6.9837],
    [110.4197, -6.9896],
    [110.4194, -6.9931],
    [110.4225, -6.9916],
    [110.4202, -7.0005],
    [110.4161, -7.0019],
    [110.4158, -7.0106],
    [110.4205, -7.024],
    [110.4176, -7.0347],
    [110.4222, -7.0419],
    [110.4126, -7.0638],
    [110.4087, -7.0867],
    [110.4091, -7.1027],
    [110.4132, -7.1163],
    [110.4069, -7.1231],
    [110.4038, -7.1328],
    [110.417, -7.1755],
    [110.4274, -7.1857],
    [110.4235, -7.2035],
    [110.4249, -7.2131],
    [110.4308, -7.2202],
    [110.4301, -7.2339],
    [110.4348, -7.2393],
    [110.4347, -7.2436],
    [110.4296, -7.2474],
    [110.4242, -7.2647],
    [110.4144, -7.2689],
    [110.4099, -7.2747],
    [110.3835, -7.2668],
    [110.3708, -7.2758],
    [110.3641, -7.2916],
    [110.3602, -7.2941],
    [110.3632, -7.3073],
    [110.3576, -7.3046],
    [110.3512, -7.3098],
    [110.347, -7.3088],
    [110.3303, -7.3158],
    [110.3255, -7.327],
    [110.3174, -7.3297],
    [110.321, -7.3425],
    [110.3095, -7.3505],
    [110.2912, -7.355],
    [110.2772, -7.3629],
    [110.2506, -7.3875],
    [110.2398, -7.4042],
    [110.2301, -7.4271],
    [110.2225, -7.4615],
    [110.2342, -7.4838],
    [110.2339, -7.4919],
    [110.2238, -7.5033],
    [110.228, -7.5238],
    [110.2368, -7.5418],
    [110.2426, -7.5485],
    [110.2527, -7.5528],
    [110.2644, -7.5768],
    [110.2723, -7.5753],
    [110.2785, -7.57],
    [110.283, -7.574],
    [110.2915, -7.587],
    [110.2909, -7.5903],
    [110.3149, -7.6256],
    [110.3215, -7.6282],
    [110.3193, -7.6337],
    [110.3263, -7.6574],
    [110.3509, -7.7048],
    [110.3591, -7.7131],
    [110.3635, -7.7296],
    [110.3608, -7.7852],
    [110.3574, -7.7913],
    [110.366, -7.7918],
    [110.3654, -7.7964],
    [110.3619, -7.796],
    [110.3617, -7.7916],
    [110.3676, -7.7928],
    [110.3733, -7.7869],
    [110.3869, -7.7862],
    [110.3881, -7.7831],
    [110.4471, -7.7834],
    [110.4663, -7.773],
    [110.4802, -7.7573],
    [110.5153, -7.7542],
    [110.5553, -7.7247],
    [110.5896, -7.7147],
    [110.5953, -7.7167],
    [110.6039, -7.7127],
    [110.6136, -7.7128],
    [110.6162, -7.6905],
    [110.6457, -7.6845],
    [110.6567, -7.6704],
    [110.676, -7.6589],
    [110.6841, -7.6505],
    [110.6997, -7.6185],
    [110.7027, -7.5925],
    [110.7127, -7.5851],
    [110.7249, -7.561],
    [110.7367, -7.5503],
    [110.7591, -7.5605],
    [110.7805, -7.5575],
    [110.8199, -7.5696],
    [110.8223, -7.5645],
    [110.8262, -7.5675],
    [110.8332, -7.5664],
    [110.8372, -7.5598],
    [110.8476, -7.5577],
    [110.8518, -7.5636],
    [110.8733, -7.5683],
    [110.8848, -7.5561],
    [110.9125, -7.514],
    [110.9296, -7.4704],
    [110.9714, -7.4491],
    [110.9871, -7.436],
    [110.9847, -7.4345],
    [110.9923, -7.4215],
    [110.0073, -7.421],
    [111.0072, -7.4182],
    [111.013, -7.4153],
    [111.047, -7.4017],
    [111.0519, -7.4081],
    [111.0672, -7.3959],
    [111.0742, -7.3839],
    [111.078, -7.3819],
    [111.0836, -7.3857],
    [111.0889, -7.3846],
    [111.1066, -7.3739],
    [111.1068, -7.3819],
    [111.1442, -7.3828],
    [111.1654, -7.3891],
    [111.2258, -7.3889],
    [111.2891, -7.4089],
    [111.37, -7.4073],
    [111.407, -7.4158],
    [111.441, -7.4432],
    [111.4555, -7.4796],
    [111.4588, -7.5021],
    [111.4803, -7.5309],
    [111.5196, -7.5513],
    [111.5776, -7.5417],
    [111.6088, -7.5328],
    [111.6262, -7.5229],
    [111.637, -7.5206],
    [111.6775, -7.5329],
    [111.7398, -7.5372],
    [111.7659, -7.5532],
    [111.7814, -7.5573],
    [111.7984, -7.5551],
    [111.8215, -7.5402],
    [111.8396, -7.5369],
    [111.8528, -7.5402],
    [111.8774, -7.5519],
    [111.9066, -7.56],
    [111.9283, -7.5823],
    [111.9507, -7.5952],
    [112.0071, -7.601],
    [112.0321, -7.5936],
    [112.0671, -7.5893],
    [112.0896, -7.5767],
    [112.1013, -7.5735],
    [112.1203, -7.5776],
    [112.1274, -7.5766],
    [112.1558, -7.5484],
    [112.1863, -7.527],
    [112.2364, -7.4978],
    [112.3012, -7.4848],
    [112.344, -7.4903],
    [112.3554, -7.4887],
    [112.3822, -7.4675],
    [112.3941, -7.4623],
    [112.4081, -7.4462],
    [112.438, -7.4357],
    [112.4723, -7.4006],
    [112.4799, -7.396],
    [112.5398, -7.3813],
    [112.5821, -7.3602],
    [112.6162, -7.3547],
    [112.6315, -7.355],
    [112.6583, -7.3379],
    [112.6724, -7.3411],
    [112.6863, -7.3388],
    [112.6973, -7.3427],
    [112.7272, -7.3465],
    [112.7351, -7.3069],
    [112.7473, -7.2853],
    [112.7452, -7.2774],
    [112.7508, -7.27],
    [112.7511, -7.2561],
    [112.7492, -7.2768],
    [112.7452, -7.2774],
    [112.7463, -7.2904],
    [112.7433, -7.2908],
    [112.7364, -7.3051],
    [112.7295, -7.3369],
    [112.7262, -7.4111],
    [112.7083, -7.5087],
    [112.6911, -7.5703],
    [112.6902, -7.596],
    [112.6854, -7.6164],
    [112.6897, -7.6404],
    [112.6878, -7.6564],
    [112.6962, -7.6651],
    [112.6997, -7.6654],
    [112.7027, -7.671],
    [112.716, -7.7154],
    [112.7241, -7.729],
    [112.7337, -7.7571],
    [112.7461, -7.7719],
    [112.7332, -7.8035],
    [112.6978, -7.8296],
    [112.6966, -7.8477],
    [112.6814, -7.8676],
    [112.6582, -7.9092],
    [112.6412, -7.9441],
    [112.6364, -7.9617],
    [112.6318, -7.9646],
    [112.6332, -7.9675],
    [112.6415, -7.9433],
    [112.6578, -7.91],
    [112.6804, -7.8689],
    [112.6963, -7.848],
    [112.6977, -7.8296],
    [112.7335, -7.803],
    [112.7441, -7.7748],
    [112.7553, -7.7555],
    [112.8034, -7.7175],
    [112.8291, -7.7023],
    [112.8372, -7.6994],
    [112.8756, -7.7001],
    [112.8933, -7.6625],
    [112.8897, -7.6592],
    [112.8863, -7.6604],
    [112.8841, -7.668],
    [112.8918, -7.6745],
    [112.9108, -7.6786],
    [112.9193, -7.6862],
    [112.9574, -7.7016],
    [112.9763, -7.7124],
    [113.0156, -7.7201],
    [113.0331, -7.7409],
    [113.042, -7.7466],
    [113.0674, -7.7479],
    [113.1087, -7.756],
    [113.1641, -7.8056],
    [113.2192, -7.8197],
    [113.2367, -7.8292],
    [113.2349, -7.8341],
    [113.227, -7.8335],
    [113.2283, -7.8422],
    [113.2368, -7.8651],
    [113.2412, -7.8652],
    [113.2522, -7.8734],
    [113.2567, -7.8822],
    [113.2559, -7.894],
    [113.2502, -7.9006],
    [113.2487, -7.9074],
    [113.2614, -7.9462],
    [113.2501, -7.9789],
    [113.2512, -7.9953],
    [113.2323, -8.0305],
    [113.2383, -8.0622],
    [113.236, -8.0716],
    [113.2376, -8.0782],
    [113.2486, -8.0803],
    [113.2761, -8.1098],
    [113.3237, -8.1174],
    [113.3262, -8.1278],
    [113.3417, -8.1283],
    [113.3475, -8.1261],
    [113.3525, -8.1198],
    [113.3597, -8.1186],
    [113.3818, -8.1293],
    [113.3993, -8.1269],
    [113.4241, -8.1386],
    [113.4292, -8.1489],
    [113.4368, -8.1553],
    [113.4704, -8.1695],
    [113.4837, -8.1851],
    [113.5096, -8.1962],
    [113.5285, -8.2009],
    [113.5656, -8.202],
    [113.6042, -8.2102],
    [113.6096, -8.2054],
    [113.6732, -8.1818],
    [113.7019, -8.168],
    [113.7047, -8.1782],
    [113.7295, -8.1865],
    [113.7579, -8.1872],
    [113.7751, -8.1805],
    [113.7818, -8.1744],
    [113.7933, -8.1714],
    [113.7994, -8.1771],
    [113.8151, -8.1727],
    [113.8231, -8.177],
    [113.8308, -8.1743],
    [113.8486, -8.1819],
    [113.8658, -8.1801],
    [113.8926, -8.1951],
    [113.8945, -8.1985],
    [113.891, -8.2012],
    [113.8914, -8.2166],
    [113.8989, -8.2271],
    [113.911, -8.2312],
    [113.923, -8.2495],
    [113.9264, -8.2487],
    [113.9224, -8.253],
    [113.9259, -8.2515],
    [113.9298, -8.2543],
    [113.9288, -8.2587],
    [113.9335, -8.2575],
    [113.9332, -8.2613],
    [113.9381, -8.261],
    [113.9355, -8.2705],
    [113.9362, -8.2754],
    [113.9389, -8.276],
    [113.9378, -8.2791],
    [113.9406, -8.2742],
    [113.9556, -8.2726],
    [113.968, -8.2764],
    [113.9797, -8.2884],
    [113.9877, -8.2892],
    [113.9898, -8.2986],
    [114.0283, -8.3007],
    [114.0592, -8.3181],
    [114.0689, -8.3183],
    [114.0906, -8.3295],
    [114.1085, -8.3277],
    [114.1301, -8.3585],
    [114.1423, -8.3662],
    [114.1505, -8.3634],
    [114.1579, -8.3645],
    [114.1673, -8.3461],
    [114.1674, -8.3408],
    [114.1937, -8.3227],
    [114.2062, -8.3042],
    [114.2181, -8.3063],
    [114.2317, -8.3152],
    [114.2361, -8.3149],
    [114.241, -8.3077],
    [114.2445, -8.3142],
    [114.2523, -8.3186],
    [114.2629, -8.3156],
    [114.2665, -8.3098],
    [114.2896, -8.3133],
    [114.2979, -8.3023],
    [114.3103, -8.2943],
    [114.3201, -8.2719],
    [114.3358, -8.2601],
    [114.3642, -8.2294],
    [114.3687, -8.2201],
    [114.3633, -8.219],
    [114.3636, -8.2164],
    [114.3775, -8.2132],
    [114.377, -8.2064],
    [114.3737, -8.206],
    [114.3762, -8.1941],
    [114.39, -8.1616],
    [114.4009, -8.1458],
    [114.4344, -8.1622],
    [114.4379, -8.1615],
    [114.4346, -8.1667],
    [114.4505, -8.2188],
    [114.4556, -8.2281],
    [114.4809, -8.254],
    [114.4857, -8.2555],
    [114.491, -8.2682],
    [114.4991, -8.2744],
    [114.5064, -8.2897],
    [114.5288, -8.3188],
    [114.5489, -8.3325],
    [114.5755, -8.3474],
    [114.6339, -8.3577],
    [114.6752, -8.3702],
    [114.6828, -8.3736],
    [114.6831, -8.3767],
    [114.6948, -8.3789],
    [114.7121, -8.388],
    [114.7438, -8.3892],
    [114.7564, -8.3929],
    [114.7713, -8.4016],
    [114.7844, -8.3994],
    [114.7929, -8.4025],
    [114.8053, -8.4117],
    [114.8083, -8.4196],
    [114.8215, -8.4157],
    [114.8217, -8.4202],
    [114.8293, -8.4261],
    [114.8606, -8.433],
    [114.8666, -8.4406],
    [114.8783, -8.4425],
    [114.8859, -8.4499],
    [114.9169, -8.4675],
    [114.94, -8.4774],
    [114.9448, -8.4854],
    [114.9491, -8.4846],
    [114.9509, -8.4888],
    [114.9661, -8.4953],
    [114.9969, -8.5284],
    [115.0038, -8.5281],
    [115.0081, -8.5249],
    [115.0164, -8.5125],
    [115.0196, -8.498],
    [115.0315, -8.5041],
    [115.037, -8.4917],
    [115.0436, -8.4966],
    [115.0474, -8.4922],
    [115.0476, -8.4949],
    [115.0688, -8.5027],
    [115.072, -8.5073],
    [115.0906, -8.5127],
    [115.0915, -8.5182],
    [115.0986, -8.5222],
    [115.1008, -8.5285],
    [115.1118, -8.5338],
    [115.1106, -8.5366],
    [115.1156, -8.5457],
    [115.15, -8.5594],
    [115.1706, -8.5637],
    [115.1683, -8.5404],
    [115.1841, -8.5],
    [115.1826, -8.4761],
    [115.1867, -8.4573],
    [115.199, -8.4298],
    [115.1939, -8.4284],
    [115.1902, -8.4182],
    [115.1811, -8.4151],
    [115.1809, -8.4042],
    [115.1869, -8.4045],
    [115.1894, -8.4097],
];