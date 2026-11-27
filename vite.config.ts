import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version?: string }

const APP_VER = pkg.version ?? '1.7.3'

function versionManifestPlugin(): Plugin {
  const payload = () =>
    JSON.stringify(
      {
        version: APP_VER,
        builtAt: new Date().toISOString(),
      },
      null,
      2,
    )

  return {
    name: 'emit-version-json',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(payload())
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: payload(),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(APP_VER),
  },
  plugins: [react(), tailwindcss(), versionManifestPlugin()],
})
