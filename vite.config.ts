import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import i18nSyncPlugin from './plugins/vite-i18n-sync'
import { carenetDebugSessionLogPlugin } from './plugins/vite-debug-session-log'

function envTruthy(v: string | undefined): boolean {
  if (!v) return false
  const s = String(v).trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

/** Project root = folder containing this config (not `process.cwd()`). Avoids wrong/missing `.env` when the shell starts Vite from another directory. */
const projectRoot = path.resolve(__dirname)

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, projectRoot, '')
  const playwrightE2E =
    envTruthy(process.env.VITE_PLAYWRIGHT_E2E) || envTruthy(fileEnv.VITE_PLAYWRIGHT_E2E)
  const vitest = process.env.VITEST === 'true'
  /** Capacitor/Android: Workbox SW + navigateFallback often yields a blank WebView; web builds keep PWA. */
  const disablePwa = process.env.VITE_DISABLE_PWA === 'true'

  /** PWA: cache app shell only; avoid caching Supabase/API (D016 offline uses Dexie). */
  const pwaPlugin = VitePWA({
    registerType: 'prompt',
    injectRegister: 'auto',
    includeAssets: ['pwa-192.png', 'pwa-512.png'],
    manifest: {
      name: 'CareNet',
      short_name: 'CareNet',
      description: 'Care marketplace platform for Bangladesh',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: 'pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: 'pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{css,js,html,ico,png,svg,woff2,webmanifest}'],
      navigateFallback: '/index.html',
      runtimeCaching: [],
      // Main bundle exceeds Workbox default 2 MiB precache limit until code-splitting improves (D008 §9).
      maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
    },
    devOptions: {
      enabled: false,
    },
  })

  return {
  root: projectRoot,
  envDir: projectRoot,
  define: {
    __CARENET_PLAYWRIGHT_E2E__: JSON.stringify(playwrightE2E),
    /** Ensures client `import.meta.env` sees the flag (not only `process.env` at config time). */
    'import.meta.env.VITE_PLAYWRIGHT_E2E': JSON.stringify(playwrightE2E ? 'true' : ''),
  },
  plugins: [
    carenetDebugSessionLogPlugin(projectRoot),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    i18nSyncPlugin(),
    ...(vitest || disablePwa ? [] : [pwaPlugin]),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      // Shim react-router so useNavigate is wrapped in startTransition
      // (prevents "component suspended during synchronous input" with React.lazy)
      'react-router-original': path.resolve(__dirname, 'node_modules/react-router'),
      'react-router': path.resolve(__dirname, 'src/lib/react-router-shim.ts'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})