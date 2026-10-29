import { expect, test, type Page } from '@playwright/test'
import { catalogSettled, login, mockState, open } from '../support/app'
import { buy } from '../support/checkout'

// Painel de cenários: controla o backend simulado sem decorar URLs (fora do Figma,
// só existe com mocks ativos). Cobre seleção de cenário, eventos, reset e ?painel=0.

const panel = (page: Page) => page.getByRole('dialog', { name: 'Painel de cenários' })

async function openPanel(page: Page) {
  await page.getByRole('button', { name: 'Abrir painel de cenários' }).click()
  await expect(panel(page)).toBeVisible()
}

test.describe('painel de cenários', () => {
  test('aplica um cenário e a tela reflete na hora', async ({ page }) => {
    await open(page)
    await catalogSettled(page)
    await openPanel(page)
    await panel(page).getByLabel('Cenário', { exact: true }).selectOption('catalogo-vazio')
    await panel(page).getByRole('button', { name: 'Aplicar cenário' }).click()
    await expect(panel(page).getByRole('status')).toHaveText('Cenário "catalogo-vazio" aplicado.')
    await page.keyboard.press('Escape')
    await expect(panel(page)).toHaveCount(0)
    // O foco volta para o botão que abriu o painel.
    await expect(page.getByRole('button', { name: 'Abrir painel de cenários' })).toBeFocused()
    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
    expect((await mockState(page)).scenario).toBe('catalogo-vazio')
  })

  test('envia nft.updated do NFT aberto e o preço muda sem recarregar', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await openPanel(page)
    await expect(panel(page).getByLabel('NFT (id)')).toHaveValue('emerald-ape-042')
    await panel(page).getByLabel('Novo preço (ETH)').fill('3.21')
    await panel(page).getByRole('button', { name: 'Enviar nft.updated' }).click()
    await expect(panel(page).getByRole('status')).toHaveText('Evento nft.updated enviado.')
    await page.keyboard.press('Escape')
    await expect(page.getByText('3.21 ETH').filter({ visible: true }).first()).toBeVisible()
  })

  test('segura e solta pedidos e mostra o estado da simulação', async ({ page }) => {
    await open(page)
    await openPanel(page)
    const hold = panel(page).getByRole('switch', { name: 'Segurar pedidos pendentes' })
    await expect(hold).not.toBeChecked()
    await hold.click()
    await expect(hold).toBeChecked()
    await expect(panel(page).getByText('Pedidos seguros em pendente: sim')).toBeVisible()
    await hold.click()
    await expect(hold).not.toBeChecked()
  })

  test('reset restaura os dados e encerra a sessão local', async ({ page }) => {
    await open(page, '/entrar')
    await login(page, 'ana')
    await expect(page).not.toHaveURL(/\/entrar/)
    await buy(page, 'emerald-ape-042')
    await openPanel(page)
    await panel(page).getByRole('button', { name: 'Restaurar dados iniciais' }).click()
    await expect(page).toHaveURL(/\/(\?.*)?$/)
    // A página recarrega: espera o app (e o MSW) subir antes de consultar o estado.
    await expect(page.locator('#conteudo')).toBeVisible()
    await expect(page.getByRole('button', { name: /Menu da conta/ })).toHaveCount(0)
    const state = await mockState(page)
    expect(state.carts).toBe(0)
    expect(state.sessions).toBe(0)
    expect(state.scenario).toBe('padrao')
  })

  test('?painel=0 esconde o painel durante a navegação', async ({ page }) => {
    await page.goto('/?painel=0')
    await expect(page.locator('#conteudo')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Abrir painel de cenários' })).toHaveCount(0)
    await page.goto('/carrinho')
    await expect(page.locator('#conteudo')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Abrir painel de cenários' })).toHaveCount(0)
  })
})
