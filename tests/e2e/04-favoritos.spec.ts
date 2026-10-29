import { expect, test, type Page } from '@playwright/test'
import { login, open, setScenario } from '../support/app'

// Grupo 4 do enunciado: favoritar com atualização otimista, rollback e isolamento por usuário.

/** Botão de favoritar visível no detalhe (texto no desktop, coração no mobile). */
const favoriteButton = (page: Page) =>
  page
    .getByRole('button', {
      name: /^(Favoritar|Favoritado|Adicionar .+ à lista de interesse|Remover .+ da lista de interesse)$/,
    })
    .filter({ visible: true })
    .first()

/** Clica e espera o servidor confirmar (o reload cancelaria a requisição em andamento). */
async function clickAndPersist(
  page: Page,
  button: ReturnType<Page['locator']>,
  method: 'PUT' | 'DELETE',
) {
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/me/favorites/') && r.request().method() === method,
    ),
    button.click(),
  ])
}

async function loginAt(page: Page, path: string, who: 'ana' | 'bruno' = 'ana') {
  await open(page, `/entrar?redirect=${encodeURIComponent(path)}`)
  await login(page, who)
  await expect(page).toHaveURL(new RegExp(path.replace(/[/$]/g, '\\$&')))
}

test.describe('favoritos', () => {
  test('favoritar persiste após recarregar', async ({ page }) => {
    await loginAt(page, '/nft/sage-nomad-009')
    const button = favoriteButton(page)
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await clickAndPersist(page, button, 'PUT')
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await page.reload()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
  })

  test('falha da API desfaz o favorito e avisa', async ({ page }) => {
    await loginAt(page, '/nft/sage-nomad-009')
    await setScenario(page, 'favorito-falha')
    const button = favoriteButton(page)
    await button.click()
    await expect(page.getByText('Não foi possível atualizar seus favoritos')).toBeVisible()
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await setScenario(page, 'padrao')
    await clickAndPersist(page, button, 'PUT')
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await page.reload()
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
  })

  test('lista de interesse mostra e remove favoritos', async ({ page }) => {
    await loginAt(page, '/perfil/favoritos')
    const list = page.getByRole('list', { name: 'NFTs na lista de interesse' })
    await expect(list.getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()
    await expect(list.getByRole('link', { name: 'Golden Beat #207' })).toBeVisible()
    await clickAndPersist(
      page,
      page.getByRole('button', { name: 'Remover Emerald Ape #042 da lista de interesse' }),
      'DELETE',
    )
    await expect(list.getByRole('link', { name: 'Emerald Ape #042' })).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('link', { name: 'Golden Beat #207' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' })).toHaveCount(0)
  })

  test('favoritos de um usuário não aparecem para outro', async ({ page }) => {
    await loginAt(page, '/perfil/favoritos')
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()
    await page.getByRole('button', { name: 'Sair' }).filter({ visible: true }).click()
    await expect(page).toHaveURL(/\/(\?.*)?$/)
    await page.goto('/entrar?redirect=%2Fperfil%2Ffavoritos')
    await login(page, 'bruno')
    await expect(page.getByRole('link', { name: 'Ivory Baron #088' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' })).toHaveCount(0)
  })

  test('visitante que favorita vai ao login e volta ao NFT', async ({ page }) => {
    await open(page, '/nft/sage-nomad-009')
    await favoriteButton(page).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=/)
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/nft\/sage-nomad-009/)
  })

  test('lista vazia oferece explorar o catálogo', async ({ page }) => {
    await loginAt(page, '/perfil/favoritos', 'bruno')
    await page
      .getByRole('button', { name: 'Remover Ivory Baron #088 da lista de interesse' })
      .click()
    await expect(page.getByText('Sua lista de interesse está vazia')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorar o catálogo' })).toBeVisible()
  })
})
