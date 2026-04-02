import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.opengis.app',
  appName: 'OpenGIS',
  webDir: 'dist',
  server: {
    // Allow loading tile images from any HTTPS origin in the WebView
    allowNavigation: ['*.tile.openstreetmap.org', '*.arcgisonline.com', '*.nasa.gov', 'overpass-api.de'],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
