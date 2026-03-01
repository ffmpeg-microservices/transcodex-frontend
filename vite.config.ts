import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // sockjs-client uses Node's `global` — polyfill it for the browser
    global: 'globalThis',
  },
})
