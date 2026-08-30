import { defineConfig } from 'vite';
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ALL_ASSET_URLS } from './src/utils/assetManifest.js';

/**
 * Phaser loads assets at runtime by plain string paths ("assets/keg.png"),
 * so Vite's import pipeline never sees them. Copy exactly the files listed
 * in the asset manifest into dist/ after the bundle is written.
 */
const copyAssets = {
  name: 'copy-runtime-assets',
  closeBundle() {
    for (const url of ALL_ASSET_URLS) {
      const dest = join('dist', url);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(url, dest);
    }
  },
};

export default defineConfig({
  root: '.',
  plugins: [copyAssets],
  server: {
    port: 8080,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
