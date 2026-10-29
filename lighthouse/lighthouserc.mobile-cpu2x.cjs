// Referência complementar (não substitui a medição mobile padrão): mesmo perfil
// mobile com CPU 2x, multiplicador que a documentação de throttling do
// Lighthouse indica para máquinas com benchmarkIndex abaixo de 1500. O próprio
// Lighthouse avisa, nesta máquina, que a CPU é mais lenta do que ele espera.
const mobile = require('./lighthouserc.mobile.cjs')

module.exports = {
  ci: {
    collect: {
      ...mobile.ci.collect,
      settings: { ...mobile.ci.collect.settings, throttling: { cpuSlowdownMultiplier: 2 } },
    },
    upload: { target: 'filesystem', outputDir: 'reports/lighthouse/mobile-cpu2x' },
  },
}
