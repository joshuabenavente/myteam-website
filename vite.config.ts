import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths, so the same build works at myteam.fans/ and at the old
  // github.io/nuggets-tracker/ address. Routing is in the hash, so every page is index.html.
  base: './',
  plugins: [react()],
})
