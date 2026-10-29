import { expect, test, type Locator, type Page } from '@playwright/test'
import { catalogCards, catalogSettled, isMobile, mockControl, open } from '../support/app'
import { buy } from '../support/checkout'

// Grupo 12 do enunciado: skeletons com as dimensões do conteúdo final, erro com
// "Tentar novamente", recuperação e retry automático de falha transitória.

/** Diferença máxima aceita entre o esqueleto e o conteúdo final (px). */
const TOLERANCE = 6

async function box(locator: Locator) {
  const b = await locator.boundingBox()
  if (!b) throw new Error('elemento sem caixa')
  return b
}

/**
 * Mede o esqueleto de forma atômica: só devolve a caixa do primeiro elemento visível
 * que casa com o seletor enquanto ele ainda é esqueleto (sem corrida com a troca).
 */
async function skeletonBox(page: Page, selector: string, stillSkeleton: string) {
  const handle = await page.waitForFunction(
    ([sel, marker]) => {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect()
        const isSkeleton = el.matches(marker) || el.querySelector(marker)
        if (r.width && r.height && isSkeleton) return { width: r.width, height: r.height }
      }
      return null
    },
    [selector, stillSkeleton] as const,
  )
  return (await handle.jsonValue()) as { width: number; height: number }
}

function expectSameSize(
  skeleton: { width: number; height: number },
  final: { width: number; height: number },
) {
  expect(Math.abs(skeleton.width - final.width)).toBeLessThanOrEqual(TOLERANCE)
  expect(Math.abs(skeleton.height - final.height)).toBeLessThanOrEqual(TOLERANCE)
}

/** Abre já no cenário lento (respostas em 2,5 s). */
async function openSlow(page: Page, path: string) {
  // Sem esperar o "load": a janela do esqueleto (2,5 s) começa logo depois do boot.
  await page.goto(`${path}${path.includes('?') ? '&' : '?'}cenario=lento`, { waitUntil: 'commit' })
}

test.describe('skeletons', () => {
  test('catálogo: esqueleto com o tamanho do card final', async ({ page }) => {
    await openSlow(page, '/')
    // A grade é a lista dentro da área com aria-busy (no mobile as abas também são lista).
    const skeleton = await skeletonBox(
      page,
      '#catalogo [aria-busy] > ul > li',
      '[data-slot="skeleton"]',
    )
    await catalogSettled(page)
    await expect(catalogCards(page).first()).toBeVisible()
    expectSameSize(skeleton, await box(page.locator('#catalogo [aria-busy] > ul > li').first()))
  })

  test('detalhe: esqueleto da arte com o tamanho da arte final', async ({ page }) => {
    await openSlow(page, '/nft/emerald-ape-042')
    const skeleton = await skeletonBox(page, '[data-art-skeleton]', '[data-art-skeleton]')
    await expect(page.getByLabel('Carregando NFT')).toHaveCount(0)
    const art = page.locator('[data-art]').filter({ visible: true }).first()
    expectSameSize(skeleton, await box(art))
  })

  test('carrinho: esqueleto do resumo com o tamanho do resumo final', async ({ page }) => {
    await open(page)
    await buy(page, 'emerald-ape-042')
    await mockControl(page, 'scenario', { name: 'lento' })
    await page.reload()
    const skeleton = await skeletonBox(
      page,
      '[aria-label="Carregando resumo"]',
      '[aria-label="Carregando resumo"]',
    )
    await expect(page.getByLabel('Carregando resumo')).toHaveCount(0)
    const summary = page.getByRole('region', { name: 'Resumo da carteira' })
    expectSameSize(skeleton, await box(summary))
  })

  test('movimento reduzido desliga o brilho do esqueleto', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openSlow(page, '/')
    const skeleton = page
      .locator('#catalogo [data-slot="skeleton"]')
      .filter({ visible: true })
      .first()
    await expect(skeleton).toBeVisible()
    const animation = await skeleton.evaluate((el) => getComputedStyle(el, '::after').animationName)
    expect(animation).toBe('none')
  })
})

test.describe('falhas e recuperação', () => {
  test('erro no servidor mostra a mensagem e "Tentar novamente" recupera', async ({ page }) => {
    await open(page, '/', 'erro-servidor')
    const alert = page.locator('#catalogo').getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert.getByRole('heading')).toHaveText('Não foi possível carregar os NFTs')
    await mockControl(page, 'scenario', { name: 'padrao' })
    await alert.getByRole('button', { name: 'Tentar novamente' }).click()
    await catalogSettled(page)
    await expect(catalogCards(page)).toHaveCount(9)
  })

  test('falha transitória se recupera sozinha (retry só para 5xx)', async ({ page }) => {
    await open(page, '/', 'falha-transitoria')
    await catalogSettled(page)
    await expect(catalogCards(page)).toHaveCount(9)
    await expect(page.locator('#catalogo').getByRole('alert')).toHaveCount(0)
  })

  test('detalhe sem conexão mostra erro com "Tentar novamente" e recupera', async ({
    page,
  }, testInfo) => {
    test.skip(isMobile(testInfo), 'Mesmo componente de erro; um viewport basta.')
    await open(page, '/')
    await mockControl(page, 'scenario', { name: 'offline' })
    await page.goto('/nft/emerald-ape-042')
    const alert = page.getByRole('alert').filter({ hasText: 'Tentar novamente' })
    await expect(alert).toBeVisible({ timeout: 15_000 })
    await mockControl(page, 'scenario', { name: 'padrao' })
    await alert.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' }).first()).toBeVisible()
  })
})
