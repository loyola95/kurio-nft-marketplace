import { z } from 'zod'

// Cenários da camada de mocks (selecionáveis por ?cenario=, painel ou /api/__mock/scenario).
export const SCENARIOS = [
  'padrao',
  'catalogo-vazio',
  'lento',
  'latencia-variavel',
  'fora-de-ordem',
  'offline',
  'erro-servidor',
  'falha-transitoria',
  'sessao-expirada',
  'sem-permissao',
  'favorito-falha',
  'preco-alterado-no-checkout',
  'esgotado-no-checkout',
  'timeout-pedido',
  'pagamento-recusado',
  'carteira-recusada',
  'tempo-real-instavel',
] as const

export const ScenarioName = z.enum(SCENARIOS)
export type ScenarioName = z.infer<typeof ScenarioName>
