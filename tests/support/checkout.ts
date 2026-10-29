import { expect, type Page, type TestInfo } from '@playwright/test'
import { isMobile, login, open, type Scenario } from './app'

// Fluxo de compra reaproveitado pelos grupos 6, 7, 9 e 10.

const visible = <T extends { filter(o: { visible: boolean }): T }>(l: T) =>
  l.filter({ visible: true })

/** Adiciona pela tela de detalhe (fluxo real) e cai no carrinho. */
export async function buy(page: Page, nftId: string, quantity = 1) {
  await page.goto(`/nft/${nftId}`)
  const plus = visible(page.getByRole('button', { name: 'Aumentar quantidade' })).first()
  for (let i = 1; i < quantity; i++) await plus.click()
  await visible(page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }))
    .first()
    .click()
  await expect(page).toHaveURL(/\/carrinho/)
}

/** Primeiro NFT da rede com a edição 1/50 à venda (consulta a API simulada). */
export async function nftOfNetwork(page: Page, network: 'polygon' | 'solana') {
  return page.evaluate(async (net) => {
    const res = await fetch(`/api/nfts?networks=${net}&pageSize=9`)
    const body = (await res.json()) as { items: { id: string; available: number }[] }
    return body.items.find((i) => i.available > 0)!.id
  }, network)
}

/** Carrinho → "Conectar e finalizar" → login → pagamento. */
export async function checkoutAs(page: Page, who: 'ana' | 'bruno' = 'ana') {
  await visible(page.getByRole('button', { name: 'Conectar e finalizar' })).click()
  await expect(page).toHaveURL(/\/entrar/)
  await login(page, who)
  await expect(page).toHaveURL(/\/pagamento$/)
}

/** Abre a aplicação, coloca itens no carrinho e chega ao pagamento logado. */
export async function startCheckout(
  page: Page,
  items: [string, number][] = [['emerald-ape-042', 2]],
  scenario: Scenario = 'padrao',
) {
  await open(page, '/', scenario)
  for (const [id, qty] of items) await buy(page, id, qty)
  await checkoutAs(page)
}

/** Mobile: o formulário do colecionador é a primeira etapa. */
export async function toWalletStep(page: Page, testInfo: TestInfo) {
  if (!isMobile(testInfo)) return
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Carteira conectada' })).toBeVisible()
}

export const connectors = (page: Page) => page.getByRole('radiogroup', { name: 'Carteira e rede' })

export async function connect(page: Page, name = 'MetaMask') {
  await connectors(page)
    .getByRole('radio', { name: new RegExp(`^${name}`) })
    .check()
  await expect(page.getByText(`Carteira conectada com ${name}`)).toBeVisible()
}

export const review = (page: Page) => page.getByRole('dialog', { name: 'Revise sua compra' })

export async function openReview(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(review(page)).toBeVisible()
}

/** Formulário (pré-preenchido) → carteira conectada → revisão aberta. */
export async function goToReview(page: Page, testInfo: TestInfo) {
  await toWalletStep(page, testInfo)
  await connect(page)
  await openReview(page)
}

export async function confirmOrder(page: Page) {
  await review(page).getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedidos\/ord-\d+$/)
}

export const receipt = (page: Page) => page.getByRole('region', { name: /^Pedido/ })

/** Formulário "Perfil do colecionador" (o rodapé também tem um campo de e-mail). */
export const collector = (page: Page) => page.getByRole('form', { name: 'Perfil do colecionador' })
