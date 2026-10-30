import { expect, test, type Page } from '@playwright/test'
import { catalogSettled, open } from '../support/app'
import { buy, startCheckout } from '../support/checkout'

// Regressão visual das quatro telas principais, em desktop e mobile.
// Baselines por plataforma (win32 local, linux no CI): o nome do arquivo leva o sufixo.

const FIXED_TIME = new Date('2026-10-28T12:00:00-03:00')

/** Fontes prontas e todas as imagens carregadas, inclusive as lazy abaixo da dobra. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    const images = [...document.images]
    for (const img of images) img.loading = 'eager'
    await Promise.all(
      images.map((img) =>
        img.complete
          ? img.decode().catch(() => {})
          : new Promise((r) => (img.onload = img.onerror = r)),
      ),
    )
  })
}

async function snapshot(page: Page, name: string) {
  await settle(page)
  // Avisos (Sonner) somem por tempo: ficam fora da captura e são cobertos nos testes funcionais.
  await page.addStyleTag({ content: '[data-sonner-toast] { display: none !important; }' })
  for (const toast of await page.locator('[data-sonner-toast]').all())
    await expect(toast).toBeHidden()
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, animations: 'disabled' })
}

test.describe('regressão visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(FIXED_TIME)
  })

  test('início', async ({ page }) => {
    await open(page, '/?painel=0')
    await catalogSettled(page)
    await snapshot(page, 'inicio')
  })

  test('detalhe', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042?painel=0')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await snapshot(page, 'detalhe')
  })

  test('carrinho com itens', async ({ page }) => {
    await open(page, '/?painel=0')
    await buy(page, 'emerald-ape-042', 2)
    await buy(page, 'golden-beat-207')
    const items = page.getByRole('list', { name: 'Itens do carrinho' })
    await expect(items).toContainText('Emerald Ape #042')
    await expect(items).toContainText('Golden Beat #207')
    await snapshot(page, 'carrinho')
  })

  test('pagamento', async ({ page }) => {
    await open(page, '/?painel=0')
    await startCheckout(page)
    await expect(page.locator('h1:visible')).toBeVisible()
    await expect(page.getByText('…')).toHaveCount(0)
    await snapshot(page, 'pagamento')
  })
})
