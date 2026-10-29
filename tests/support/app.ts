import { expect, type Page, type TestInfo } from '@playwright/test'

export type Scenario =
  | 'padrao'
  | 'catalogo-vazio'
  | 'lento'
  | 'latencia-variavel'
  | 'fora-de-ordem'
  | 'offline'
  | 'erro-servidor'
  | 'falha-transitoria'
  | 'sessao-expirada'
  | 'sem-permissao'
  | 'favorito-falha'
  | 'preco-alterado-no-checkout'
  | 'esgotado-no-checkout'
  | 'timeout-pedido'
  | 'pagamento-recusado'
  | 'carteira-recusada'
  | 'tempo-real-instavel'

export const isMobile = (testInfo: TestInfo) => testInfo.project.name.startsWith('mobile')

/**
 * Abre a aplicação num cenário conhecido. Cada teste roda num contexto novo
 * (armazenamento vazio), então o banco simulado nasce do seed.
 */
export async function open(page: Page, path = '/', scenario: Scenario = 'padrao') {
  const url = new URL(path, 'http://x')
  url.searchParams.set('cenario', scenario)
  await page.goto(`${url.pathname}${url.search}${url.hash}`)
  await expect(page.locator('#conteudo')).toBeVisible()
}

/** Endpoints de controle do mock, chamados de dentro da página (passam pelo MSW). */
export async function mockControl(page: Page, path: string, body?: unknown) {
  return page.evaluate(
    async ({ path, body }) => {
      const res = await fetch(`/api/__mock/${path}`, {
        method: body === undefined && path === 'state' ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      return res.json()
    },
    { path, body },
  )
}

export const setScenario = (page: Page, name: Scenario) => mockControl(page, 'scenario', { name })
export const mockState = (page: Page) => mockControl(page, 'state')

/** Espera a grade terminar de buscar (aria-busy=false). */
export async function catalogSettled(page: Page) {
  await expect(page.locator('#catalogo [aria-busy]')).toHaveAttribute('aria-busy', 'false')
}

export function catalogCards(page: Page) {
  return page.locator('#catalogo').getByRole('article')
}

/** Filtros ficam na lateral no desktop e numa gaveta no mobile. */
export async function withFilters(page: Page, testInfo: TestInfo, fn: () => Promise<void>) {
  if (isMobile(testInfo)) {
    await page.getByRole('button', { name: /^Filtros/ }).click()
    await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeVisible()
    await fn()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeHidden()
  } else {
    await fn()
  }
}

export async function searchCatalog(page: Page, testInfo: TestInfo, term: string) {
  if (isMobile(testInfo)) {
    await page.getByRole('searchbox', { name: 'Buscar NFTs por nome ou coleção' }).fill(term)
  } else {
    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    const dialog = page.getByRole('dialog', { name: 'Buscar NFTs' })
    await dialog.getByRole('searchbox', { name: 'Termo de busca' }).fill(term)
    await dialog.getByRole('button', { name: 'Buscar' }).click()
  }
}

export async function login(page: Page, who: 'ana' | 'bruno' = 'ana') {
  await page.getByLabel('E-mail', { exact: true }).fill(`${who}@kurio.dev`)
  await page.getByLabel('Senha', { exact: true }).fill('Kurio@123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}
