/// Port of src/lib/map-tiles.ts. Same tile sources as the web app, so the
/// map looks the same and shares the same MapTiler account/quota.
///
/// The key is read via --dart-define=MAPTILER_KEY=... at build time (Flutter
/// has no .env file equivalent of Next's NEXT_PUBLIC_*). Falls back to the
/// free OpenStreetMap tile servers — fine for development, not for
/// production (rate-limited, no SLA), exactly as the web app's own comment
/// warns.
class TileConfig {
  final String urlTemplate;
  final String attribution;
  final double maxZoom;
  const TileConfig({
    required this.urlTemplate,
    required this.attribution,
    required this.maxZoom,
  });
}

const String _maptilerKey = String.fromEnvironment('MAPTILER_KEY');

/// MapTiler's "Dataviz" style: clean, detail-rich, same OSM data, CDN-backed.
const TileConfig _maptilerConfig = TileConfig(
  urlTemplate: 'https://api.maptiler.com/maps/dataviz/{z}/{x}/{y}.png?key=$_maptilerKey',
  attribution: '© MapTiler © OpenStreetMap contributors',
  maxZoom: 20,
);

/// Free OpenStreetMap tile server — fallback only. Rate-limited, no SLA.
const TileConfig _osmConfig = TileConfig(
  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
);

/// Returns the best available tile configuration for the current build.
TileConfig getTileConfig() {
  return _maptilerKey.isNotEmpty ? _maptilerConfig : _osmConfig;
}
