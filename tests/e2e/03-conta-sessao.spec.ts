import { expect, test } from '@playwright/test'
import { isMobile, login, mockControl, mockState, open } from '../support/app'

// Grupo 3 do enunciado: cadastro, login, sessão persistente, expiração e troca de usuário.

const registerButtonName = (mobile: boolean) => (mobile ? 'Criar perfil' : 'Criar conta')

test.describe('conta e sessão', () => {
  test('cadastro com e-mail já usado mostra o erro no campo', async ({ page }, testInfo) => {
    await open(page, '/cadastro')
    await page.getByLabel('Nome de usuário').fill('novo_colecionador')
    await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.dev')
    await page.getByLabel('Senha', { exact: true }).fill('Kurio@123')
    await page.getByLabel('Confirmar senha').fill('Kurio@123')
    await page
      .getByRole('button', { name: registerButtonName(isMobile(testInfo)), exact: true })
      .click()
    const email = page.getByLabel('E-mail', { exact: true })
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription('Este e-mail já está cadastrado.')
    await expect(email).toBeFocused()
  })

  test('senhas diferentes não enviam o cadastro', async ({ page }, testInfo) => {
    await open(page, '/cadastro')
    await page.getByLabel('Nome de usuário').fill('outro_user')
    await page.getByLabel('E-mail', { exact: true }).fill('outro@kurio.dev')
    await page.getByLabel('Senha', { exact: true }).fill('Kurio@123')
    await page.getByLabel('Confirmar senha').fill('Kurio@124')
    await page
      .getByRole('button', { name: registerButtonName(isMobile(testInfo)), exact: true })
      .click()
    await expect(page.getByLabel('Confirmar senha')).toHaveAccessibleDescription(
      'As senhas não coincidem.',
    )
    expect((await mockState(page)).sessions).toBe(0)
  })

  test('cadastro válido entra na conta', async ({ page }, testInfo) => {
    await open(page, '/cadastro?redirect=/perfil')
    await page.getByLabel('Nome de usuário').fill('nova_conta')
    await page.getByLabel('E-mail', { exact: true }).fill('nova@kurio.dev')
    await page.getByLabel('Senha', { exact: true }).fill('Senha1234')
    await page.getByLabel('Confirmar senha').fill('Senha1234')
    await page
      .getByRole('button', { name: registerButtonName(isMobile(testInfo)), exact: true })
      .click()
    await expect(page).toHaveURL(/\/perfil$/)
  })

  test('login inválido mostra mensagem e não abre sessão', async ({ page }) => {
    await open(page, '/entrar')
    await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.dev')
    await page.getByLabel('Senha', { exact: true }).fill('senha-errada1')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
    expect((await mockState(page)).sessions).toBe(0)
  })

  test('rota privada leva ao login e volta para ela', async ({ page }) => {
    await open(page, '/perfil/carteiras')
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil%2Fcarteiras/)
    await login(page, 'ana')
    // O redirect preserva a query original (inclusive ?cenario= do teste).
    await expect(page).toHaveURL(/\/perfil\/carteiras(\?|$)/)
  })

  test('mostrar senha alterna o tipo do campo', async ({ page }) => {
    await open(page, '/entrar')
    const password = page.getByLabel('Senha', { exact: true })
    await expect(password).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Mostrar senha' }).click()
    await expect(password).toHaveAttribute('type', 'text')
    await expect(page.getByRole('button', { name: 'Ocultar senha' })).toBeVisible()
  })

  test('sessão continua após recarregar a página', async ({ page }) => {
    await open(page, '/entrar?redirect=/perfil')
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/perfil$/)
    await page.reload()
    await expect(page).toHaveURL(/\/perfil$/)
  })

  test('sessão expirada leva ao login com aviso e depois retorna', async ({ page }) => {
    await page.clock.install()
    await open(page, '/entrar?redirect=/perfil', 'sessao-expirada')
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/perfil$/)
    // A sessão do cenário dura 60 s.
    await page.clock.fastForward(61_000)
    await page.goto('/perfil/carteiras')
    await expect(page).toHaveURL(/\/entrar\?.*motivo=expirada/)
    await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toBeVisible()
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/perfil\/carteiras$/)
  })

  test('sessão expirada no servidor também leva ao login', async ({ page }) => {
    await open(page, '/entrar?redirect=/perfil')
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/perfil$/)
    await mockControl(page, 'session/expire')
    await page.reload()
    await expect(page).toHaveURL(/\/entrar/)
  })

  test('sair encerra a sessão e outro usuário entra limpo', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'No mobile o "Sair" fica no perfil (Tarefa 14).')
    await open(page, '/entrar')
    await login(page, 'ana')
    await page.getByRole('button', { name: /Menu da conta de/ }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    expect((await mockState(page)).sessions).toBe(0)
    await page.goto('/entrar')
    await login(page, 'bruno')
    await expect(page.getByRole('button', { name: /Menu da conta de Bruno/ })).toBeVisible()
  })

  test('fechar o modal volta para a Início', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'No mobile o login é uma página.')
    await open(page, '/entrar')
    const dialog = page.getByRole('dialog', { name: 'Entrar' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('link', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/cadastro/)
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/(\?.*)?$/)
  })

  test.fixme('sessão expira durante salvar o perfil', async () => {
    // Review Focus 5: depende do formulário de perfil (Tarefa 14).
  })
})
