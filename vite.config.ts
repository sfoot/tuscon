import { defineConfig } from 'vite';

// GitHub Pages serves this repo at https://<user>.github.io/tuscon/,
// so all asset URLs are prefixed with /tuscon/ (dev server included).
export default defineConfig({
  base: '/tuscon/',
});
