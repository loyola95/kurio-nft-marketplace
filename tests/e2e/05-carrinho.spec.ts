import { expect, test, type Page } from '@playwright/test'
import { catalogCards, isMobile, login, mockControl, open } from '../support/app'

// Grupo 5 do enunciado: quantidades, remoção, cupom, resumo, disponibilidade e carrinho de visitante.

const visible = <T extends { filter(o: { visible: boolean }): T }>(l: T) =>
  l.filter({ visible: true })

/** Adiciona pela tela de detalhe (fluxo real) e cai no carrinho. */
async function buy(page: Page, nftId: string, quantity = 1) {
  await page.goto(`/nft/${nftId}`)
  const plus = visible(page.getByRole('button', { name: 'Aumentar quantidade' })).first()
  for (let i = 1; i < quantity; i++) await plus.click()
  await visible(page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }))
    .first()
    .click()
  await expect(page).toHaveURL(/\/carrinho/)
}

const items = (page: Page) => page.getByRole('list', { name: 'Itens do carrinho' })
const item = (page: Page, name: string) =>
  items(page).getByRole('listitem').filter({ hasText: name })
const summary = (page: Page) => page.getByRole('region', { name: 'Resumo da carteira' })
/** Valor de uma linha do resumo (dd marcado com o rótulo da linha). */
const summaryValue = (page: Page, label: string) =>
  summary(page).locator(`dd[data-label="${label}"]`)

test.describe('carrinho', () => {
  test('comprar no detalhe leva ao carrinho com o item', async ({ page }) => {
    await open(page)
    await buy(page, 'emerald-ape-042', 2)
    await expect(item(page, 'Emerald Ape #042')).toBeVisible()
    await expect(visible(item(page, 'Emerald Ape #042').getByLabel(/Quantidade/))).toHaveValue('2')
    await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')
    await expect(summaryValue(page, 'Total')).toHaveText('2.396 ETH')
  })

  test('alterar quantidade e remover atualizam o resumo', async ({ page }) => {
    await open(page)
    await buy(page, 'emerald-ape-042')
    await buy(page, 'golden-beat-207')
    const emerald = item(page, 'Emerald Ape #042')
    await visible(emerald.getByRole('button', { name: /Aumentar quantidade/ })).click()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('3.37 ETH')
    await visible(
      item(page, 'Golden Beat #207').getByRole('button', { name: /Remover .* do carrinho/ }),
    ).click()
    await expect(item(page, 'Golden Beat #207')).toHaveCount(0)
    await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')
    await page.reload()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')
  })

  test('cupom válido, inválido, expirado e remoção', async ({ page }) => {
    await open(page)
    await buy(page, 'emerald-ape-042', 2)
    const code = visible(page.getByLabel('Código promocional'))
    const apply = visible(page.getByRole('button', { name: 'Aplicar' }))

    await code.fill('NADA')
    await apply.click()
    await expect(code).toHaveAccessibleDescription('Código promocional inválido.')

    await code.fill('VERAO2025')
    await apply.click()
    await expect(code).toHaveAccessibleDescription('Este código promocional expirou.')

    await code.fill('kurio10')
    await apply.click()
    await expect(summary(page).getByText('KURIO10')).toBeVisible()
    await expect(summaryValue(page, 'Desconto do lançamento')).toHaveText('(-) 0.238 ETH')
    await expect(summaryValue(page, 'Total')).toHaveText('2.158 ETH')

    await summary(page).getByRole('button', { name: 'Remover cupom KURIO10' }).click()
    await expect(summaryValue(page, 'Desconto do lançamento')).toHaveText('(-) 0.00 ETH')
  })

  test('estoque menor ajusta a quantidade e avisa', async ({ page }) => {
    await open(page)
    await buy(page, 'emerald-ape-042', 3)
    await mockControl(page, 'events/nft-updated', {
      nftId: 'emerald-ape-042',
      editionId: 'emerald-ape-042-1-50',
      available: 1,
    })
    await page.reload()
    await expect(
      page.getByRole('status').filter({ hasText: 'a quantidade foi ajustada' }),
    ).toBeVisible()
    await expect(visible(item(page, 'Emerald Ape #042').getByLabel(/Quantidade/))).toHaveValue('1')
    await expect(
      visible(item(page, 'Emerald Ape #042').getByRole('button', { name: /Aumentar quantidade/ })),
    ).toBeDisabled()
  })

  test('itens do visitante continuam após o login', async ({ page }) => {
    await open(page)
    await buy(page, 'golden-beat-207')
    await visible(page.getByRole('button', { name: 'Conectar e finalizar' })).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/)
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/pagamento/)
    await page.goto('/carrinho')
    await expect(item(page, 'Golden Beat #207')).toBeVisible()
  })

  test('ações do card no hover adicionam ao carrinho', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'Hover só existe no desktop.')
    await open(page)
    const card = catalogCards(page).first()
    await card.hover()
    await card.getByRole('button', { name: 'Adicionar Emerald Ape #042 ao carrinho' }).click()
    await expect(page.getByText('Emerald Ape #042 adicionado ao carrinho.')).toBeVisible()
    await page.goto('/carrinho')
    await expect(item(page, 'Emerald Ape #042')).toBeVisible()
  })

  test('carrinho vazio oferece voltar ao catálogo', async ({ page }) => {
    await open(page, '/carrinho')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
    await page.getByRole('link', { name: 'Explorar o catálogo' }).click()
    await expect(page).toHaveURL(/\/(#catalogo)?(\?.*)?$/)
  })
})
