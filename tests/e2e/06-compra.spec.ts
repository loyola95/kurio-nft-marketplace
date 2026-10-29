import { expect, test } from '@playwright/test'
import { isMobile, login, mockControl, mockState, open } from '../support/app'
import {
  buy,
  checkoutAs,
  collector,
  confirmOrder,
  connect,
  goToReview,
  nftOfNetwork,
  openReview,
  receipt,
  review,
  startCheckout,
  toWalletStep,
} from '../support/checkout'

// Grupo 6 do enunciado: compra completa, do catálogo ao recibo confirmado.

test.describe('compra', () => {
  test('do catálogo ao recibo confirmado; carrinho fica só com o que não foi comprado', async ({
    page,
  }, testInfo) => {
    await open(page)
    await page
      .locator('#catalogo')
      .getByRole('link', { name: /Emerald Ape #042/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)
    await buy(page, 'emerald-ape-042', 2)
    await buy(page, 'golden-beat-207', 1)
    // Item de outra rede: fica para outro pedido.
    const polygonId = await nftOfNetwork(page, 'polygon')
    await buy(page, polygonId, 1)
    await checkoutAs(page)

    // Formulário vem preenchido com o perfil e a carteira principal.
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Souza')
    await expect(collector(page).getByLabel('E-mail')).toHaveValue('ana@kurio.dev')
    if (!isMobile(testInfo)) {
      await expect(page.getByLabel('Rede', { exact: true })).toHaveValue('ethereum')
      await expect(page.getByLabel('Endereço da carteira')).toHaveValue(
        '0xA91F3c5B7d2e4F6a8B0c1D2e3F4a5B6c7D8eE82C',
      )
    }
    await expect(page.getByText(/1 item da rede Polygon fica no carrinho/)).toBeVisible()

    await goToReview(page, testInfo)
    const dialog = review(page)
    await expect(dialog.getByText('Emerald Ape #042')).toBeVisible()
    await expect(dialog.getByText('Golden Beat #207')).toBeVisible()
    await expect(dialog.getByText('Ethereum', { exact: true })).toBeVisible()
    await expect(dialog.locator('dd[data-label="Taxa de rede"]')).toHaveText('0.016 ETH')
    // 2 × 1.19 + 0.99 + 0.016
    await expect(dialog.locator('dd[data-label="Total"]')).toHaveText('3.386 ETH')

    await confirmOrder(page)
    const card = receipt(page)
    await expect(
      card.getByRole('heading', { name: 'Estamos confirmando seu pedido' }),
    ).toBeVisible()
    await expect(
      card.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible({ timeout: 10_000 })
    await expect(card.getByText(/^0x[0-9a-f]{4}…[0-9a-f]{4}/)).toBeVisible()
    await expect(card.getByText('Emerald Ape #042')).toBeVisible()
    await expect(card.getByText('(x 2)')).toBeVisible()
    await expect(card.locator('dd[data-label="Taxa de rede"]')).toHaveText('0.016 ETH')
    await expect(card.locator('dd[data-label="Total"]')).toHaveText('3.386 ETH')
    await expect(card.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute(
      'href',
      /^https:\/\/etherscan\.io\/tx\/0x[0-9a-f]{64}$/,
    )

    // Evento posterior não altera o recibo (snapshot da compra).
    await mockControl(page, 'events/nft-updated', {
      nftId: 'emerald-ape-042',
      priceEth: '9.99',
    })
    await page.waitForTimeout(500)
    await expect(card.getByText('2.38 ETH')).toBeVisible()
    await page.reload()
    await expect(
      receipt(page).getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible()
    await expect(receipt(page).getByText('2.38 ETH')).toBeVisible()

    // Só o item da Polygon continua no carrinho.
    await page.goto('/carrinho')
    const items = page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')
    await expect(items).toHaveCount(1)
    await expect(items.filter({ hasText: 'Emerald Ape #042' })).toHaveCount(0)
  })

  test('sessão expira no checkout: volta ao pagamento com tudo restaurado e sem pedido', async ({
    page,
  }, testInfo) => {
    await startCheckout(page)
    await page.getByLabel('Observação do colecionador (opcional)').fill('Entregar na carteira fria')
    await toWalletStep(page, testInfo)
    await connect(page)
    await mockControl(page, 'session/expire')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page).toHaveURL(/\/entrar\?.*motivo=expirada/)
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/pagamento$/)
    await expect(page.getByText('Restauramos os dados do pagamento.')).toBeVisible()
    if (isMobile(testInfo)) {
      await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
        'Entregar na carteira fria',
      )
      await toWalletStep(page, testInfo)
    } else {
      await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
        'Entregar na carteira fria',
      )
    }
    await expect(page.getByText('Carteira conectada com MetaMask')).toBeVisible()
    expect((await mockState(page)).orders).toEqual([])
    await openReview(page)
    await confirmOrder(page)
    expect((await mockState(page)).orders).toHaveLength(1)
  })

  test('pedido de outra conta mostra acesso negado sem dados', async ({ page }, testInfo) => {
    await startCheckout(page)
    await goToReview(page, testInfo)
    await confirmOrder(page)
    const url = page.url()
    await expect(receipt(page).getByText('Emerald Ape #042')).toBeVisible()

    await mockControl(page, 'session/expire')
    await page.goto('/entrar')
    await login(page, 'bruno')
    await expect(page).not.toHaveURL(/\/entrar/)
    await page.goto(url)
    await expect(
      page.getByRole('heading', { name: 'Você não tem acesso a este pedido' }),
    ).toBeVisible()
    await expect(page.getByText('Emerald Ape #042')).toHaveCount(0)
    await expect(page.getByText('ID da transação')).toHaveCount(0)
  })

  test('cenário sem-permissao mostra o mesmo tratamento', async ({ page }) => {
    await open(page, '/entrar?redirect=/pedidos/ord-1')
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/pedidos\/ord-1$/)
    await mockControl(page, 'scenario', { name: 'sem-permissao' })
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Você não tem acesso a este pedido' }),
    ).toBeVisible()
  })

  test('pedido inexistente mostra não encontrado', async ({ page }) => {
    await open(page, '/entrar?redirect=/pedidos/ord-999')
    await login(page, 'ana')
    await expect(page.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
  })

  test('sem itens o pagamento leva de volta ao catálogo', async ({ page }) => {
    await open(page, '/entrar?redirect=/pagamento')
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/pagamento$/)
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('formulário inválido não abre a revisão e foca o erro', async ({ page }, testInfo) => {
    await startCheckout(page)
    await page.getByLabel('Nome de exibição').fill('')
    if (isMobile(testInfo)) {
      await page.getByRole('button', { name: 'Continuar' }).click()
    } else {
      await connect(page)
      await page.getByRole('button', { name: 'Confirmar compra' }).click()
    }
    await expect(page.getByLabel('Nome de exibição')).toBeFocused()
    await expect(page.getByLabel('Nome de exibição')).toHaveAccessibleDescription(
      'Informe o nome de exibição',
    )
    await expect(review(page)).toHaveCount(0)
  })
})
