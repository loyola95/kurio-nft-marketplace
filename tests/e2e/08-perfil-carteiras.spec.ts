import { expect, test, type Page } from '@playwright/test'
import { isMobile, login, mockControl, open } from '../support/app'

// Grupo 8 do enunciado: perfil (dados, avatar, senha) e carteiras, com erros da API.

async function loginAt(page: Page, path: string, who: 'ana' | 'bruno' = 'ana') {
  await open(page, `/entrar?redirect=${encodeURIComponent(path)}`)
  await login(page, who)
  await expect(page).toHaveURL(new RegExp(`${path}(\\?|$)`))
}

const field = (page: Page, label: string) => page.getByLabel(label, { exact: true })

/** PNG 1x1 válido; `pad` aumenta o arquivo sem mudar o tipo. */
function png(pad = 0) {
  const base = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  )
  return Buffer.concat([base, Buffer.alloc(pad)])
}

test.describe('perfil', () => {
  test('editar o nome de exibição persiste após recarregar', async ({ page }, testInfo) => {
    await loginAt(page, '/perfil')
    await expect(field(page, 'Nome de exibição')).toHaveValue('Ana Souza')
    await field(page, 'Nome de exibição').fill('Ana S. Colecionadora')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Perfil atualizado' })).toBeVisible()
    await page.reload()
    await expect(field(page, 'Nome de exibição')).toHaveValue('Ana S. Colecionadora')
    if (!isMobile(testInfo)) {
      await expect(
        page.getByRole('button', { name: /Menu da conta de Ana S\. Colecionadora/ }),
      ).toBeVisible()
    }
  })

  test('nome de usuário em uso mostra o erro no campo', async ({ page }) => {
    await loginAt(page, '/perfil')
    await field(page, 'Nome de usuário').fill('bruno.lima')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(field(page, 'Nome de usuário')).toHaveAccessibleDescription(
      'Este nome de usuário já está em uso.',
    )
  })

  test('avatar: envia PNG, recusa arquivo grande e remove', async ({ page }) => {
    await loginAt(page, '/perfil')
    const input = page.locator('input[type="file"]')
    await input.setInputFiles({
      name: 'grande.png',
      mimeType: 'image/png',
      buffer: png(2 * 1024 * 1024),
    })
    await expect(page.getByText('A imagem precisa ter no máximo 1 MB.')).toBeVisible()
    await input.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png() })
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
    await page.getByRole('button', { name: 'Remover avatar' }).click()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toHaveCount(0)
  })

  test('senha atual errada e senha nova fraca', async ({ page }) => {
    await loginAt(page, '/perfil')
    await field(page, 'Nova senha').fill('curta')
    await field(page, 'Confirmar nova senha').fill('curta')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(field(page, 'Nova senha')).toHaveAccessibleDescription(
      'A senha precisa de 8 caracteres, com letras e números',
    )

    await field(page, 'Senha atual').fill('errada123')
    await field(page, 'Nova senha').fill('Senha1234')
    await field(page, 'Confirmar nova senha').fill('Senha1234')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(field(page, 'Senha atual')).toHaveAccessibleDescription('Senha atual incorreta.')
  })

  test('trocar a senha vale no próximo login', async ({ page }) => {
    await loginAt(page, '/perfil', 'bruno')
    await field(page, 'Senha atual').fill('Kurio@123')
    await field(page, 'Nova senha').fill('NovaSenha1')
    await field(page, 'Confirmar nova senha').fill('NovaSenha1')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Senha alterada' })).toBeVisible()
    await page.getByRole('button', { name: 'Sair' }).filter({ visible: true }).click()
    await expect(page).toHaveURL(/\/(\?.*)?$/)
    await page.goto('/entrar')
    await field(page, 'E-mail').fill('bruno@kurio.dev')
    await field(page, 'Senha').fill('NovaSenha1')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/(\?.*)?$/)
  })

  test('sessão expira ao salvar e as alterações voltam após o login', async ({ page }) => {
    await loginAt(page, '/perfil')
    await field(page, 'Nome de exibição').fill('Ana Rascunho')
    await mockControl(page, 'session/expire')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page).toHaveURL(/\/entrar\?.*motivo=expirada/)
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/perfil(\?|$)/)
    await expect(field(page, 'Nome de exibição')).toHaveValue('Ana Rascunho')
    await expect(
      page.getByText('Restauramos as alterações que você não tinha salvado.'),
    ).toBeVisible()
  })
})

test.describe('carteiras', () => {
  test('adicionar secundária igual à principal e editar', async ({ page }) => {
    await loginAt(page, '/perfil/carteiras', 'bruno')
    const secondary = page.getByRole('region', { name: 'Carteira secundária' })
    await expect(
      secondary.getByText('Você ainda não adicionou uma carteira secundária.'),
    ).toBeVisible()
    await secondary.getByRole('checkbox', { name: 'Igual à carteira principal' }).check()
    await secondary.getByRole('button', { name: 'Adicionar' }).click()
    await expect(secondary.getByLabel('Nome de exibição', { exact: true })).toHaveValue(
      'Bruno Lima',
    )
    await expect(secondary.getByLabel('Endereço da carteira', { exact: true })).toHaveValue('')

    await secondary.getByLabel('Endereço da carteira', { exact: true }).fill('0x123')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(
      secondary.getByLabel('Endereço da carteira', { exact: true }),
    ).toHaveAccessibleDescription('Use um endereço 0x com 40 caracteres hexadecimais')
    await secondary
      .getByLabel('Endereço da carteira', { exact: true })
      .fill('0x1111111111111111111111111111111111111111')
    await secondary.getByLabel('Apelido da carteira', { exact: true }).fill('Reserva')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(
      page.getByRole('status').filter({ hasText: 'Carteira secundária salva' }),
    ).toBeVisible()

    await page.reload()
    const reloaded = page.getByRole('region', { name: 'Carteira secundária' })
    await expect(reloaded.getByLabel('Apelido da carteira', { exact: true })).toHaveValue('Reserva')

    const primary = page.getByRole('region', { name: 'Carteira principal' })
    await primary.getByLabel('Apelido da carteira', { exact: true }).fill('Do dia a dia')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(
      page.getByRole('status').filter({ hasText: 'Carteira principal salva' }),
    ).toBeVisible()
    await page.reload()
    await expect(
      page
        .getByRole('region', { name: 'Carteira principal' })
        .getByLabel('Apelido da carteira', { exact: true }),
    ).toHaveValue('Do dia a dia')
  })

  test('MetaMask não aceita a rede Solana', async ({ page }) => {
    await loginAt(page, '/perfil/carteiras')
    const primary = page.getByRole('region', { name: 'Carteira principal' })
    await primary.getByLabel('Rede', { exact: true }).selectOption('solana')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(
      primary.getByLabel('Tipo de carteira', { exact: true }),
    ).toHaveAccessibleDescription('MetaMask não é compatível com essa rede')
  })
})
