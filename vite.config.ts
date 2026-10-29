/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * O App só é importado depois de worker.start() (o socket.io-client precisa do
 * WebSocket já interceptado). modulepreload baixa e compila os chunks dele em
 * paralelo com os mocks sem executar nada, então a ordem de boot não muda.
 */
function preloadAppChunks(entry = 'src/app/App.tsx'): Plugin {
  return {
    name: 'kurio:preload-app-chunks',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const chunks = Object.values(ctx.bundle ?? {}).filter((c) => c.type === 'chunk')
        const app = chunks.find((c) => c.facadeModuleId?.replaceAll('\\', '/').endsWith(entry))
        if (!app) return html
        const byFile = new Map(chunks.map((c) => [c.fileName, c]))
        const files = new Set<string>()
        const visit = (fileName: string) => {
          if (files.has(fileName)) return
          files.add(fileName)
          byFile.get(fileName)?.imports.forEach(visit)
        }
        visit(app.fileName)
        return [...files]
          .filter((file) => !html.includes(`/${file}"`))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'modulepreload', crossorigin: true, href: `/${file}` },
            injectTo: 'head' as const,
          }))
      },
    },
  }
}

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    preloadAppChunks(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Tira a lista pública de sufixos do chunk do MSW (ver o arquivo).
      tldts: fileURLToPath(new URL('./src/mocks/lib/tldts-lite.ts', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
