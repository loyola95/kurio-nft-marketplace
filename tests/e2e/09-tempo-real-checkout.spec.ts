import { expect, test } from '@playwright/test'
import { login, mockControl, open } from '../support/app'
import {
  buy,
  confirmOrder,
  connect,
  goToReview,
  openReview,
  receipt,
  review,
  startCheckout,
  toWalletStep,
} from '../support/checkout'

// Grupo 9 do enunciado (seção 7): preço ou disponibilidade muda durante a navegação;
// a interface avisa, atualiza o resumo e o checkout não confirma cotação desatualizada.

const EMERALD = { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50' }

test.describe('tempo real no checkout', () => {
  test('preço muda com o item no carrinho: aviso e resumo atualizados sem recarregar', async ({
    page,
  }) => {
    await open(page)
    await buy(page, 'emerald-ape-042')
    const subtotal = page
      .getByRole('region', { name: 'Resumo da carteira' })
      .locator('dd[data-label="Subtotal"]')
    await expect(subtotal).toHaveText('1.19 ETH')
    await mockControl(page, 'events/nft-updated', { ...EMERALD, priceEth: '1.5' })
    await expect(
      page.getByRole('status').filter({ hasText: 'mudou de 1.19 para 1.5 ETH' }),
    ).toBeVisible()
    await expect(subtotal).toHaveText('1.50 ETH')
  })

  test('na revisão, cotação desatualizada bloqueia até gerar outra e confirmar de novo', async ({
    page,
  }, testInfo) => {
    await startCheckout(page, [['emerald-ape-042', 1]])
    await goToReview(page, testInfo)
    const total = review(page).locator('dd[data-label="Total"]')
    await expect(total).toHaveText('1.206 ETH')

    await mockControl(page, 'events/nft-updated', { ...EMERALD, priceEth: '1.5' })
    await expect(
      review(page).getByText('Preço, disponibilidade ou cupom mudaram desde esta cotação.'),
    ).toBeVisible()
    const confirm = review(page).getByRole('button', { name: 'Confirmar compra' })
    await expect(confirm).toBeDisabled()
    // O valor revisado continua à vista até a pessoa pedir a nova cotação.
    await expect(total).toHaveText('1.206 ETH')

    await review(page).getByRole('button', { name: 'Atualizar cotação' }).click()
    await expect(total).toHaveText('1.516 ETH')
    await expect(confirm).toBeEnabled()
    await confirmOrder(page)
    await expect(receipt(page).locator('dd[data-label="Total"]')).toHaveText('1.516 ETH')
  })

  test('cenário preco-alterado-no-checkout: o preço sobe depois da cotação e a revisão usa o novo', async ({
    page,
  }, testInfo) => {
    await startCheckout(page, [['emerald-ape-042', 1]], 'preco-alterado-no-checkout')
    await expect(page.getByText('O preço de Emerald Ape #042 mudou para 1.44 ETH.')).toBeVisible()
    await goToReview(page, testInfo)
    await expect(review(page).locator('dd[data-label="Total"]')).toHaveText('1.456 ETH')
  })

  test('cenário esgotado-no-checkout bloqueia a compra e explica', async ({ page }, testInfo) => {
    await startCheckout(page, [['emerald-ape-042', 1]], 'esgotado-no-checkout')
    await toWalletStep(page, testInfo)
    const message = page
      .getByRole('alert')
      .filter({ hasText: 'Não há unidades suficientes de Emerald Ape #042' })
    await expect(message).toBeVisible()
    await expect(message.getByRole('link', { name: 'Revisar carrinho' })).toBeVisible()
    await connect(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(review(page)).toHaveCount(0)
    await expect(message).toBeVisible()
  })

  test('item esgota com a revisão aberta: envio bloqueado com o motivo', async ({
    page,
  }, testInfo) => {
    await startCheckout(page, [['emerald-ape-042', 1]])
    await goToReview(page, testInfo)
    await mockControl(page, 'events/nft-updated', { ...EMERALD, available: 0 })
    await expect(
      review(page).getByText('Não há unidades suficientes de Emerald Ape #042'),
    ).toBeVisible()
    await expect(review(page).getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
  })

  test('quem compra as últimas unidades não vê o próprio item esgotado durante o pendente', async ({
    page,
  }, testInfo) => {
    await open(page)
    await mockControl(page, 'events/nft-updated', { ...EMERALD, available: 2 })
    await buy(page, 'emerald-ape-042', 2)
    await page
      .getByRole('button', { name: 'Conectar e finalizar' })
      .filter({ visible: true })
      .click()
    await expect(page).toHaveURL(/\/entrar/)
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/pagamento$/)
    await mockControl(page, 'orders/hold', { hold: true })
    await toWalletStep(page, testInfo)
    await connect(page)
    await openReview(page)
    await confirmOrder(page)
    await page.goto('/carrinho')
    const item = page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')
    await expect(item.filter({ hasText: 'Emerald Ape #042' })).toHaveCount(1)
    await expect(page.getByText(/esgotou/)).toHaveCount(0)
    await mockControl(page, 'orders/hold', { hold: false })
    await expect(item).toHaveCount(0)
  })
})
