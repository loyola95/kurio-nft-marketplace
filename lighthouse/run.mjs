// Auditoria completa: build otimizado, 3 medições por página nos perfis mobile e
// desktop, relatórios em reports/lighthouse/ e resumo em RESULTS.md.
// Uso: pnpm lighthouse [--skip-build]
import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { chromium } from '@playwright/test'

const run = (command) => execSync(command, { stdio: 'inherit', env: process.env })

// Sem Chrome indicado, usa o Chromium do Playwright (já exigido pelos testes).
process.env.CHROME_PATH ??= chromium.executablePath()

if (!process.argv.includes('--skip-build')) run('pnpm build')

for (const profile of ['mobile', 'desktop', 'mobile-cpu2x']) {
  // A pasta temporária do LHCI acumula rodadas; cada perfil começa do zero.
  rmSync('.lighthouseci', { recursive: true, force: true })
  rmSync(`reports/lighthouse/${profile}`, { recursive: true, force: true })
  run(`pnpm exec lhci collect --config=lighthouse/lighthouserc.${profile}.cjs`)
  run(`pnpm exec lhci upload --config=lighthouse/lighthouserc.${profile}.cjs`)
}

run('node lighthouse/summarize.mjs')
