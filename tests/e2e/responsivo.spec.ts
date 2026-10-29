import { expect, test, type Browser, type Page } from '@playwright/test'
import { login } from '../support/app'

// README §8: sem overflow horizontal em 390, 768 e 1440 e sem perda de conteúdo com zoom.
// Roda uma vez (projeto desktop) criando contextos com cada largura.

const PUBLIC = [
  '/',
  '/nft/emerald-ape-042',
  '/carrinho',
  '/entrar',
  '/cadastro',
  '/indisponivel',
  '/rota-inexistente',
]
const PRIVATE = ['/pagamento', '/perfil', '/perfil/carteiras', '/perfil/favoritos']

async function overflow(page: Page) {
  return page.evaluate(() => {
    const de = document.documentElement
    return de.scrollWidth - de.clientWidth
  })
}

async function newPage(browser: Browser, width: number, height: number, scale = 1) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    locale: 'pt-BR',
    // Contexto criado à mão não herda a URL base da configuração.
    baseURL: test.info().project.use.baseURL,
  })
  return ctx.newPage()
}

/** Entra como Ana com um item no carrinho (para pagamento e telas privadas). */
async function signedIn(page: Page) {
  await page.goto('/entrar?redirect=%2Fcarrinho&cenario=padrao')
  await login(page, 'ana')
  await expect(page).toHaveURL(/\/carrinho/)
  await page.evaluate(async () => {
    const token = JSON.parse(localStorage.getItem('kurio.session')!).token
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nftId: 'emerald-ape-042',
        editionId: 'emerald-ape-042-1-50',
        quantity: 1,
      }),
    })
  })
}

test.describe('responsividade', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'desktop-chromium', 'Contextos próprios por largura.')
  })

  for (const width of [390, 768, 1440]) {
    test(`${width}px: nenhuma rota rola na horizontal`, async ({ browser }) => {
      test.setTimeout(90_000)
      const page = await newPage(browser, width, 900)
      const results: string[] = []
      for (const path of PUBLIC) {
        await page.goto(`${path}${path.includes('?') ? '&' : '?'}cenario=padrao`)
        await expect(page.locator('#conteudo')).toBeVisible()
        await page.waitForLoadState('networkidle')
        results.push(`${path}:${await overflow(page)}`)
      }
      await signedIn(page)
      for (const path of PRIVATE) {
        await page.goto(path)
        await expect(page.locator('#conteudo')).toBeVisible()
        await page.waitForLoadState('networkidle')
        results.push(`${path}:${await overflow(page)}`)
      }
      expect(results.filter((r) => !r.endsWith(':0'))).toEqual([])
    })
  }

  test('zoom de 200%: conteúdo principal cabe sem rolagem horizontal', async ({ browser }) => {
    test.setTimeout(90_000)
    // 1280px com zoom de 200% equivale a 640px CSS com densidade 2.
    const page = await newPage(browser, 640, 400, 2)
    const checks: [string, string][] = [
      ['/', 'Todos os NFTs'],
      ['/nft/emerald-ape-042', 'Emerald Ape #042'],
      ['/carrinho', 'Carrinho de NFTs'],
    ]
    for (const [path, text] of checks) {
      await page.goto(`${path}?cenario=padrao`)
      await expect(page.locator('#conteudo')).toBeVisible()
      await page.waitForLoadState('networkidle')
      expect(await overflow(page), path).toBe(0)
      // O texto principal continua inteiro dentro da largura.
      const box = await page
        .getByText(text, { exact: true })
        .filter({ visible: true })
        .first()
        .boundingBox()
      expect(box, path).not.toBeNull()
      expect(box!.x + box!.width, path).toBeLessThanOrEqual(640)
    }
    await signedIn(page)
    await page.goto('/pagamento')
    await expect(page.getByRole('button', { name: /^(Continuar|Confirmar compra)$/ })).toBeVisible()
    expect(await overflow(page), '/pagamento').toBe(0)
  })
})
