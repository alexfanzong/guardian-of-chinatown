import {readFileSync} from 'node:fs';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'game-license',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'LICENSE.txt',
          source: readFileSync(new URL('./LICENSE', import.meta.url), 'utf8'),
        });
      },
    },
  ],
  build: {license: {fileName: 'THIRD-PARTY-NOTICES.txt'}},
  base: './',
  server: {host: '127.0.0.1'},
  preview: {host: '127.0.0.1'},
});
