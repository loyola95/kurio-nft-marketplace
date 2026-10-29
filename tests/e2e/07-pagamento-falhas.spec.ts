import { expect, test } from '@playwright/test'
import { isMobile, mockControl, mockState } from '../support/app'
import {
  buy,
  nftOfNetwork,
  confirmOrder,
  connect,
  connectors,
  goToReview,
  openReview,
  receipt,
  review,
  startCheckout,
  toWalletStep,
} from '../support/checkout'

// Grupo 7 do enunciado: falha de pagamento, clique repetido e timeout com recuperação do mesmo pedido.

test.describe('falhas no pagamento', () => {
  test('pagamento recusado mostra o motivo e mantém o carrinho', async ({ page }, testInfo) => {
    await startCheckout(page, [['emerald-ape-042', 2]], 'pagamento-recusado')
    await goToReview(page, testInfo)
    await confirmOrder(page)
    const card = receipt(page)
    await expect(card.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({
      timeout: 10_000,
    })
    await expect(
      card.getByText('O pagamento foi recusado pela carteira.', { exact: false }),
    ).toBeVisible()
    await expect(card.getByText('Seus itens continuam no carrinho.')).toBeVisible()
    await card.getByRole('link', { name: 'Voltar ao pagamento' }).click()
    await expect(page).toHaveURL(/\/pagamento$/)
    await page.goto('/carrinho')
    const item = page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')
    await expect(item.filter({ hasText: 'Emerald Ape #042' })).toHaveCount(1)
  })

  test('clique repetido em "Confirmar compra" cria um pedido só', async ({ page }, testInfo) => {
    await startCheckout(page)
    await goToReview(page, testInfo)
    await review(page).getByRole('button', { name: 'Confirmar compra' }).dblclick()
    await expect(page).toHaveURL(/\/pedidos\/ord-\d+$/)
    expect((await mockState(page)).orders).toHaveLength(1)
  })

  test('timeout ao enviar: tentar de novo recupera o mesmo pedido', async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await startCheckout(page, [['emerald-ape-042', 1]], 'timeout-pedido')
    await goToReview(page, testInfo)
    await review(page).getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(review(page).getByText('Não conseguimos confirmar o envio')).toBeVisible({
      timeout: 15_000,
    })
    // O pedido já existe no servidor; a nova tentativa usa a mesma chave.
    expect((await mockState(page)).orders).toHaveLength(1)
    await review(page).getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page).toHaveURL(/\/pedidos\/ord-\d+$/)
    expect((await mockState(page)).orders).toHaveLength(1)
  })

  test('carteira recusa a conexão', async ({ page }, testInfo) => {
    await startCheckout(page, [['emerald-ape-042', 1]], 'carteira-recusada')
    await toWalletStep(page, testInfo)
    await connectors(page)
      .getByRole('radio', { name: /^MetaMask/ })
      .check()
    await expect(page.getByText('A conexão foi recusada na carteira.')).toBeVisible()
    await expect(page.getByText(/Carteira conectada com/)).toHaveCount(0)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByText('Conecte a carteira para continuar.')).toBeVisible()
    await expect(review(page)).toHaveCount(0)
  })

  test('desconectar antes de confirmar volta ao passo de conexão', async ({ page }, testInfo) => {
    await startCheckout(page)
    await toWalletStep(page, testInfo)
    await connect(page)
    await page.getByRole('button', { name: 'Desconectar' }).click()
    await expect(page.getByText(/Carteira conectada com/)).toHaveCount(0)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByText('Conecte a carteira para continuar.')).toBeVisible()

    // A carteira cai durante a revisão: o servidor recusa e a tela volta à conexão.
    await connect(page)
    await openReview(page)
    await mockControl(page, 'wallet/disconnect')
    await review(page).getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(review(page)).toHaveCount(0)
    await expect(page.getByText('A carteira foi desconectada. Conecte novamente.')).toBeVisible()
    expect((await mockState(page)).orders).toEqual([])
  })

  test('cotação expirada após refresh exige nova cotação e nova confirmação', async ({
    page,
  }, testInfo) => {
    await page.clock.install()
    await startCheckout(page)
    await goToReview(page, testInfo)
    const firstTotal = await review(page).locator('dd[data-label="Total"]').textContent()
    // Passam mais de 5 minutos e a pessoa recarrega a página na revisão.
    await page.clock.fastForward('05:30')
    await page.reload()
    await expect(review(page)).toBeVisible()
    await expect(review(page).getByText('Esta cotação expirou.')).toBeVisible()
    const confirm = review(page).getByRole('button', { name: 'Confirmar compra' })
    await expect(confirm).toBeDisabled()
    await review(page).getByRole('button', { name: 'Atualizar cotação' }).click()
    await expect(review(page).getByText('Esta cotação expirou.')).toHaveCount(0)
    await expect(review(page).locator('dd[data-label="Total"]')).toHaveText(firstTotal!)
    expect((await mockState(page)).orders).toEqual([])
    await confirmOrder(page)
    expect((await mockState(page)).orders).toHaveLength(1)
  })

  test('outra carteira troca a rede do pedido; sem itens da rede ela fica indisponível', async ({
    page,
  }, testInfo) => {
    test.skip(isMobile(testInfo), 'No mobile a troca é pelos cartões da carteira (teste abaixo).')
    await startCheckout(page)
    // Só itens da Ethereum: a Reserva (Polygon) não tem o que pagar.
    await expect(page.getByLabel('Usar outra carteira?')).toBeDisabled()
    await expect(page.getByText(/Sua carteira Reserva é da rede Polygon/)).toBeVisible()

    const polygonId = await nftOfNetwork(page, 'polygon')
    await buy(page, polygonId, 1)
    await page.goto('/pagamento')
    await page.getByLabel('Usar outra carteira?').check()
    await expect(page.getByLabel('Rede', { exact: true })).toHaveValue('polygon')
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue(
      '0x5E7d9A1b3C5d7E9f1A3b5C7d9E1f3A5b7C9d0B12',
    )
    await expect(page.getByText(/2 itens da rede Ethereum ficam no carrinho/)).toBeVisible()
    await connect(page, 'WalletConnect')
    await openReview(page)
    await expect(review(page).locator('dd[data-label="Taxa de rede"]')).toHaveText('0.002 ETH')
    await expect(review(page).getByText('Emerald Ape #042')).toHaveCount(0)
  })

  test('mobile: cartões Principal e Reserva escolhem a carteira', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), 'Cartões do frame mobile.')
    await startCheckout(page)
    const polygonId = await nftOfNetwork(page, 'polygon')
    await buy(page, polygonId, 1)
    await page.goto('/pagamento')
    await toWalletStep(page, testInfo)
    const wallets = page.getByRole('radiogroup', { name: 'Carteira conectada' })
    await expect(wallets.getByRole('radio', { name: /Principal/ })).toBeChecked()
    await wallets.getByRole('radio', { name: /Reserva/ }).check()
    await connect(page, 'WalletConnect')
    await openReview(page)
    await expect(review(page).locator('dd[data-label="Taxa de rede"]')).toHaveText('0.002 ETH')
  })
})
