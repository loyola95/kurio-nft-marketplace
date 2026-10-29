import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { isMobile, login, mockControl, mockState, open } from '../support/app'
import { buy, confirmOrder, goToReview, receipt, startCheckout } from '../support/checkout'

// Grupo 10 do enunciado: duplicatas, eventos antigos, reconexão, refresh durante pedido
// pendente, estados terminais e isolamento entre sessões.

const EMERALD = { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50' }
const CONFIRMED = 'Seus NFTs agora estão na sua carteira'
const PENDING = 'Estamos confirmando seu pedido'

const heading = (page: Page, name: string) => receipt(page).getByRole('heading', { name })

/** Pedido criado e segurado em "pendente" até o teste soltar. */
async function pendingOrder(page: Page, testInfo: TestInfo) {
  await startCheckout(page, [['emerald-ape-042', 1]])
  await mockControl(page, 'orders/hold', { hold: true })
  await goToReview(page, testInfo)
  await confirmOrder(page)
  await expect(heading(page, PENDING)).toBeVisible()
}

async function logout(page: Page, testInfo: TestInfo) {
  if (isMobile(testInfo)) {
    await page.goto('/perfil')
    await page.getByRole('button', { name: 'Sair' }).filter({ visible: true }).click()
  } else {
    await page.getByRole('button', { name: /Ana Souza/ }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
  }
  await expect(page).toHaveURL(/\/(\?.*)?$/)
}

test.describe('eventos e reconexão', () => {
  test('evento duplicado não repete o aviso', async ({ page }) => {
    await open(page)
    await buy(page, 'emerald-ape-042')
    await mockControl(page, 'events/nft-updated', { ...EMERALD, priceEth: '2.5' })
    const toast = page.locator('[data-sonner-toast]').filter({ hasText: 'mudou para 2.50 ETH' })
    await expect(toast).toHaveCount(1)
    await mockControl(page, 'events/duplicate-last')
    await page.waitForTimeout(800)
    await expect(toast).toHaveCount(1)
    await expect(
      page.getByRole('status').filter({ hasText: 'mudou de 1.19 para 2.5 ETH' }),
    ).toHaveCount(1)
  })

  test('evento antigo não regride o preço exibido', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await mockControl(page, 'events/nft-updated', { ...EMERALD, priceEth: '2.5' })
    await expect(page.getByText('2.50 ETH').filter({ visible: true }).first()).toBeVisible()
    await mockControl(page, 'events/stale', { type: 'nft.updated' })
    await page.waitForTimeout(800)
    await expect(page.getByText('2.50 ETH').filter({ visible: true }).first()).toBeVisible()
    await expect(page.getByText('0.01 ETH')).toHaveCount(0)
  })

  test('queda de conexão com pedido pendente: reconecta e mostra a confirmação sem novo pedido', async ({
    page,
  }, testInfo) => {
    await pendingOrder(page, testInfo)
    await mockControl(page, 'realtime/drop')
    // O pedido resolve enquanto o socket está fora: o evento se perde e a reconciliação busca na API.
    await mockControl(page, 'orders/hold', { hold: false })
    await expect(heading(page, CONFIRMED)).toBeVisible({ timeout: 15_000 })
    expect((await mockState(page)).orders).toHaveLength(1)
  })

  test('recarregar durante o pendente retoma o mesmo pedido', async ({ page }, testInfo) => {
    await pendingOrder(page, testInfo)
    const url = page.url()
    await page.reload()
    await expect(page).toHaveURL(url)
    await expect(heading(page, PENDING)).toBeVisible()
    await mockControl(page, 'orders/hold', { hold: false })
    await expect(heading(page, CONFIRMED)).toBeVisible({ timeout: 10_000 })
    expect((await mockState(page)).orders).toHaveLength(1)
  })

  test('o pagamento avisa do pedido em andamento depois de um refresh', async ({
    page,
  }, testInfo) => {
    await pendingOrder(page, testInfo)
    const orderUrl = page.url()
    await buy(page, 'golden-beat-207')
    await page.goto('/pagamento')
    const notice = page.getByRole('status').filter({ hasText: 'Você tem um pedido em andamento.' })
    await expect(notice).toBeVisible()
    await notice.getByRole('link', { name: 'Acompanhar pedido' }).click()
    await expect(page).toHaveURL(orderUrl)
  })

  test('pedido confirmado é terminal: evento antigo não muda o estado', async ({
    page,
  }, testInfo) => {
    await startCheckout(page, [['emerald-ape-042', 1]])
    await goToReview(page, testInfo)
    await confirmOrder(page)
    await expect(heading(page, CONFIRMED)).toBeVisible({ timeout: 10_000 })
    const { event } = await mockControl(page, 'events/stale', { type: 'order.updated' })
    expect(event).toMatchObject({ type: 'order.updated', data: { status: 'pending' } })
    await page.waitForTimeout(800)
    await expect(heading(page, CONFIRMED)).toBeVisible()
    await expect(heading(page, PENDING)).toHaveCount(0)
  })

  test('eventos da sessão anterior não chegam a outro usuário', async ({ page }, testInfo) => {
    await pendingOrder(page, testInfo)
    await logout(page, testInfo)
    await page.goto('/entrar')
    await login(page, 'bruno')
    await expect(page).not.toHaveURL(/\/entrar/)
    // O socket da Ana foi encerrado; só o do Bruno está aberto.
    await expect.poll(async () => (await mockState(page)).realtimeUsers).toEqual(['u-bruno'])

    await mockControl(page, 'orders/hold', { hold: false })
    await expect
      .poll(async () => (await mockState(page)).orders.map((o: { status: string }) => o.status))
      .toEqual(['confirmed'])
    await page.waitForTimeout(800)
    await expect(page.locator('[data-sonner-toast]').filter({ hasText: /pedido/i })).toHaveCount(0)
    // Nada do pedido da Ana aparece para o Bruno.
    await buy(page, 'golden-beat-207')
    await page.goto('/pagamento')
    await expect(page.getByText('Você tem um pedido em andamento.')).toHaveCount(0)
  })
})
