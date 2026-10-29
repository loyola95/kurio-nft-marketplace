// Auditoria mobile: perfil padrão do Lighthouse (Moto G Power, 4G lento, CPU 4x).
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview',
      startServerReadyPattern: 'Local',
      url: ['http://localhost:4173/', 'http://localhost:4173/nft/emerald-ape-042'],
      numberOfRuns: 3,
      settings: { chromeFlags: '--headless=new' },
    },
    upload: { target: 'filesystem', outputDir: 'reports/lighthouse/mobile' },
  },
}
