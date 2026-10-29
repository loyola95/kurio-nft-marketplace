// Auditoria desktop: preset "desktop" do Lighthouse (1350×940, rede e CPU de desktop).
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview',
      startServerReadyPattern: 'Local',
      url: ['http://localhost:4173/', 'http://localhost:4173/nft/emerald-ape-042'],
      numberOfRuns: 3,
      settings: { preset: 'desktop', chromeFlags: '--headless=new' },
    },
    upload: { target: 'filesystem', outputDir: 'reports/lighthouse/desktop' },
  },
}
