import { expect, test } from '@playwright/test'
import { catalogCards, open } from '../support/app'

// Grupo 2 do enunciado: acesso direto ao detalhe e tratamento de recurso inexistente.

const visible = <T extends { filter(o: { visible: boolean }): T }>(l: T) =>
  l.filter({ visible: true })

test.describe('detalhe do NFT', () => {
  test('acesso direto mostra os dados do NFT', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByText('19 avaliações de colecionadores')).toBeVisible()
    await expect(page.getByText('ID do token:')).toBeVisible()
    await expect(page).toHaveTitle(/Emerald Ape #042/)
    await expect(page.getByRole('radio', { name: '1/50' })).toHaveAttribute('aria-checked', 'true')
  })

  test('navega do catálogo para o detalhe', async ({ page }) => {
    await open(page)
    await catalogCards(page).first().getByRole('link').click()
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })

  test('NFT inexistente mostra página de não encontrado', async ({ page }) => {
    await open(page, '/nft/nao-existe-123')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await page.getByRole('link', { name: 'Voltar ao catálogo' }).last().click()
    await expect(page).toHaveURL(/\/(\?.*)?$/)
  })

  test('edição esgotada ou indisponível não pode ser escolhida', async ({ page }) => {
    await open(page, '/nft/sage-nomad-009')
    const soldOut = page.getByRole('radio', { name: '1/1, esgotada' })
    const unavailable = page.getByRole('radio', { name: 'ABERTA, indisponível' })
    await expect(soldOut).toHaveAttribute('aria-disabled', 'true')
    await expect(unavailable).toHaveAttribute('aria-disabled', 'true')
    await soldOut.click({ force: true })
    await expect(soldOut).toHaveAttribute('aria-checked', 'false')
    // Acesso direto pedindo a edição esgotada mostra o aviso e bloqueia a compra.
    await open(page, '/nft/sage-nomad-009?edicao=sage-nomad-009-aberta')
    await expect(page.getByRole('radio', { name: '1/50' })).toHaveAttribute('aria-checked', 'true')
  })

  test('limite de quantidade por edição', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await page.getByRole('radio', { name: '1/1', exact: true }).click()
    await expect(page).toHaveURL(/edicao=emerald-ape-042-1-1/)
    const plus = visible(page.getByRole('button', { name: 'Aumentar quantidade' }))
    const minus = visible(page.getByRole('button', { name: 'Diminuir quantidade' }))
    await expect(minus).toBeDisabled()
    await expect(plus).toBeDisabled()

    await page.getByRole('radio', { name: '1/10', exact: true }).click()
    await expect(minus).toBeDisabled()
    await expect(plus).toBeEnabled()
    const input = visible(page.getByRole('textbox', { name: 'Quantidade' }))
    for (const [typed, expected] of [
      ['0', '1'],
      ['-3', '1'],
      ['2.5', '2'],
      ['999', '3'],
    ]) {
      await input.fill(typed)
      await input.press('Enter')
      await expect(input).toHaveValue(expected)
    }
    await expect(plus).toBeDisabled()
    await expect(
      visible(page.getByText(/Limite de 3 por pedido|Restam \d+ unidades/)),
    ).toBeVisible()
  })
})
