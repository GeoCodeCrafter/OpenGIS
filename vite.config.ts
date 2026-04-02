import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const isElectron = process.env.ELECTRON === 'true';

async function getPlugins() {
  const plugins = [react()];
  if (isElectron) {
    const { default: electron } = await import('vite-plugin-electron');
    const { default: renderer } = await import('vite-plugin-electron-renderer');
    plugins.push(
      electron([
        {
          entry: 'electron/main.ts',
          onstart(args) {
            args.startup();
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron', 'better-sqlite3'],
              },
            },
          },
        },
        {
          entry: 'electron/preload.ts',
          onstart(args) {
            args.reload();
          },
          vite: {
            build: {
              outDir: 'dist-electron',
            },
          },
        },
      ]),
      renderer(),
    );
  }
  return plugins;
}

export default defineConfig(async () => ({
  plugins: await getPlugins(),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
}));
