// Lê os relatórios JSON de reports/lighthouse/<perfil>/ e grava RESULTS.md com a
// mediana das 3 medições por página e perfil, métricas e condições de execução.
// O texto escrito abaixo do marcador de análise é preservado entre execuções.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROOT = 'reports/lighthouse'
const OUT = path.join(ROOT, 'RESULTS.md')
const MARKER = '<!-- análise: texto abaixo é escrito à mão e preservado -->'
const PROFILES = [
  ['mobile', 'Mobile'],
  ['desktop', 'Desktop'],
  ['mobile-cpu2x', 'Mobile com CPU 2x (referência complementar, ver análise)'],
]
const CATEGORIES = [
  ['performance', 'Performance', 90],
  ['accessibility', 'Accessibility', 95],
  ['best-practices', 'Best Practices', 95],
  ['seo', 'SEO', 90],
]

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}
const ms = (v) => `${(v / 1000).toFixed(2).replace('.', ',')} s`
const pagePath = (url) => new URL(url).pathname

function loadRuns(profile) {
  const dir = path.join(ROOT, profile)
  const manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
  return manifest
    .map((entry) => ({
      url: entry.url,
      html: path.basename(entry.htmlPath),
      lhr: JSON.parse(readFileSync(path.join(dir, path.basename(entry.jsonPath)), 'utf8')),
    }))
    .sort((a, b) => a.html.localeCompare(b.html))
}

const sections = []
const benchmarks = []
let sample
for (const [profile, title] of PROFILES) {
  const runs = loadRuns(profile)
  sample ??= runs[0].lhr
  benchmarks.push(...runs.map((r) => Math.round(r.lhr.environment.benchmarkIndex)))
  const pages = [...new Set(runs.map((r) => r.url))]
  const rows = pages.map((url) => {
    const own = runs.filter((r) => r.url === url)
    const score = (id) => median(own.map((r) => Math.round(r.lhr.categories[id].score * 100)))
    const metric = (id) => median(own.map((r) => r.lhr.audits[id].numericValue))
    return {
      page: pagePath(url),
      runs: own.length,
      scores: CATEGORIES.map(([id, , goal]) => {
        const value = score(id)
        return `${value}${value >= goal ? '' : ' ⚠'}`
      }),
      lcp: ms(metric('largest-contentful-paint')),
      cls: metric('cumulative-layout-shift').toFixed(3).replace('.', ','),
      tbt: `${Math.round(metric('total-blocking-time'))} ms`,
      fcp: ms(metric('first-contentful-paint')),
      reports: own.map((r) => `[${r.html}](${profile}/${r.html})`).join(', '),
    }
  })
  const header = `| Página | Medições | ${CATEGORIES.map(([, label, goal]) => `${label} (≥ ${goal})`).join(' | ')} | LCP | CLS | TBT | FCP |`
  const divider = `| --- | ---: | ${CATEGORIES.map(() => '---:').join(' | ')} | ---: | ---: | ---: | ---: |`
  const lines = rows.map(
    (r) =>
      `| \`${r.page}\` | ${r.runs} | ${r.scores.join(' | ')} | ${r.lcp} | ${r.cls} | ${r.tbt} | ${r.fcp} |`,
  )
  const files = rows.map((r) => `- \`${r.page}\`: ${r.reports}`)
  sections.push(
    `### ${title}\n\n${header}\n${divider}\n${lines.join('\n')}\n\nRelatórios (HTML, com o JSON ao lado):\n${files.join('\n')}`,
  )
}

const settingsOf = (profile) => loadRuns(profile)[0].lhr.configSettings
const throttling = (s) =>
  `${s.formFactor}, ${s.screenEmulation.width}×${s.screenEmulation.height}, ` +
  `método ${s.throttlingMethod}, RTT ${s.throttling.rttMs} ms, ` +
  `${Math.round(s.throttling.throughputKbps)} Kbps, CPU ${s.throttling.cpuSlowdownMultiplier}x`

const cpus = os.cpus()
const environment = [
  `- Data: ${new Date(sample.fetchTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (horário de Brasília)`,
  `- Lighthouse ${sample.lighthouseVersion} via @lhci/cli; ${sample.environment.hostUserAgent.match(/(?:Headless)?Chrome\/[\d.]+/)?.[0] ?? sample.environment.hostUserAgent}`,
  `- Node ${process.version}; ${os.type()} ${os.release()} (${os.arch()})`,
  `- CPU: ${cpus[0]?.model.trim()} (${cpus.length} threads); RAM ${Math.round(os.totalmem() / 1024 ** 3)} GB; benchmarkIndex entre ${Math.min(...benchmarks)} e ${Math.max(...benchmarks)} nas medições`,
  `- Mobile: ${throttling(settingsOf('mobile'))}`,
  `- Desktop: ${throttling(settingsOf('desktop'))}`,
  `- Mobile com CPU 2x: ${throttling(settingsOf('mobile-cpu2x'))}`,
  `- Servidor: \`vite preview\` do build de produção (\`pnpm build\`), mocks ativos, cenário \`padrao\`, armazenamento limpo a cada medição`,
]

const previous = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''
const analysis = previous.includes(MARKER)
  ? previous.slice(previous.indexOf(MARKER) + MARKER.length).trim()
  : '## Análise\n\n(escrever aqui)'

const content = `# Resultados do Lighthouse

Gerado por \`pnpm lighthouse\` (configs em \`lighthouse/\`). Valores são a mediana de 3 medições por página e perfil; ⚠ marca nota abaixo da meta do enunciado.

## Resultados

${sections.join('\n\n')}

## Ambiente e condições

${environment.join('\n')}

${MARKER}

${analysis}
`
writeFileSync(OUT, content)
console.log(`Resumo gravado em ${OUT}`)
