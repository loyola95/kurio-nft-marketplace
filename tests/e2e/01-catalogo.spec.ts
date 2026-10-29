import { expect, test } from '@playwright/test'
import { catalogCards, catalogSettled, open, searchCatalog, withFilters } from '../support/app'

// Grupo 1 do enunciado: busca, filtros combinados, ordenação, paginação e restauração pelo histórico.

test.describe('catálogo', () => {
  test('busca escreve na URL e filtra a grade', async ({ page }, testInfo) => {
    await open(page)
    await searchCatalog(page, testInfo, 'nomad society')
    await expect(page).toHaveURL(/q=nomad(\+|%20)society/)
    await expect(catalogCards(page).first()).toContainText(/Nomad|Bloom|Drifter/)
    for (const name of await catalogCards(page).getByRole('heading').allTextContents()) {
      expect(name).toMatch(/Nomad|Bloom|Drifter/)
    }
  })

  test('filtros combinados reiniciam a paginação', async ({ page }, testInfo) => {
    await open(page, '/?pagina=3')
    await withFilters(page, testInfo, async () => {
      await page.getByRole('button', { name: /Música/ }).click()
      await page.getByRole('button', { name: /Fotografia/ }).click()
      await page.getByRole('button', { name: /Polygon/ }).click()
    })
    await expect(page).toHaveURL(/categorias=musica,fotografia/)
    await expect(page).toHaveURL(/redes=polygon/)
    await expect(page).not.toHaveURL(/pagina=/)
    await withFilters(page, testInfo, async () => {
      await expect(page.getByRole('button', { name: /Música/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await expect(page.getByRole('button', { name: /Polygon/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await expect(page.getByRole('button', { name: /Solana/ })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })
  })

  test('ordenação por menor e maior preço', async ({ page }, testInfo) => {
    await open(page)
    await withFilters(page, testInfo, async () => {
      await page.getByLabel('Ordenar por:').filter({ visible: true }).selectOption('menor-preco')
    })
    await expect(page).toHaveURL(/ordem=menor-preco/)
    await catalogSettled(page)
    await expect(catalogCards(page).first()).toContainText('0.02 ETH')
    await withFilters(page, testInfo, async () => {
      await page.getByLabel('Ordenar por:').filter({ visible: true }).selectOption('maior-preco')
    })
    await catalogSettled(page)
    await expect(catalogCards(page).first()).toContainText('12.30 ETH')
  })

  test('paginação e restauração pelo histórico e pelo refresh', async ({ page }) => {
    await open(page)
    await expect(catalogCards(page).first()).toContainText('Emerald Ape #042')
    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/pagina=2/)
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await catalogSettled(page)
    const firstOnPage2 = await catalogCards(page).first().getByRole('heading').textContent()
    expect(firstOnPage2).not.toContain('Emerald Ape')

    await page.goBack()
    await expect(page).not.toHaveURL(/pagina=/)
    await expect(catalogCards(page).first()).toContainText('Emerald Ape #042')

    await page.goForward()
    await expect(page).toHaveURL(/pagina=2/)
    await expect(catalogCards(page).first()).toContainText(firstOnPage2!)

    await page.reload()
    await expect(catalogCards(page).first()).toContainText(firstOnPage2!)
  })

  test('filtros sobrevivem a refresh e voltam pelo histórico', async ({ page }, testInfo) => {
    await open(page, '/?categorias=jogos&aba=em-alta')
    await expect(page.getByRole('button', { name: 'Em alta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await withFilters(page, testInfo, async () => {
      await page.getByRole('button', { name: /Utilidade/ }).click()
    })
    await expect(page).toHaveURL(/categorias=jogos,utilidade/)
    await page.reload()
    await withFilters(page, testInfo, async () => {
      await expect(page.getByRole('button', { name: /Utilidade/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
    await page.goBack()
    await expect(page).toHaveURL(/categorias=jogos&|categorias=jogos$/)
  })

  test('respostas fora de ordem não sobrescrevem a busca atual', async ({ page }, testInfo) => {
    // No cenário, a requisição anterior do catálogo demora mais do que a seguinte.
    await open(page, '/', 'fora-de-ordem')
    await withFilters(page, testInfo, async () => {
      await page.getByRole('button', { name: /Música/ }).click()
      await page.getByRole('button', { name: /Fotografia/ }).click()
    })
    await expect(page).toHaveURL(/categorias=musica,fotografia/)
    // Música (65) + Fotografia (12): o total final é o da URL, não o da resposta atrasada.
    await expect(page.getByText('77 NFTs encontrados')).toBeAttached({ timeout: 10_000 })
    await page.waitForTimeout(2_500)
    await expect(page.getByText('77 NFTs encontrados')).toBeAttached()
  })

  test('catálogo vazio mostra estado vazio', async ({ page }) => {
    await open(page, '/', 'catalogo-vazio')
    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
  })

  test('filtro sem resultado oferece limpar filtros', async ({ page }) => {
    await open(page, '/?q=inexistente-xyz')
    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).last().click()
    await expect(catalogCards(page).first()).toContainText('Emerald Ape #042')
  })
})
