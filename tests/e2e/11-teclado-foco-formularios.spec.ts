import { expect, test, type Page } from '@playwright/test'
import { catalogSettled, isMobile, login, open, withFilters } from '../support/app'

// Grupo 11 do enunciado: teclado, foco visível, foco em diálogos e drawers,
// formulários com erros associados e itens fora do escopo da demonstração.

const focusedInside = (page: Page, selector: string) =>
  page.evaluate(
    (sel) => Boolean(document.querySelector(sel)?.contains(document.activeElement)),
    selector,
  )

test.describe('teclado e foco', () => {
  test('"Pular para o conteúdo" é o primeiro Tab e leva ao conteúdo', async ({ page }) => {
    await open(page)
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#conteudo')).toBeFocused()
  })

  test('foco por teclado é visível (contorno de 2px na cor de destaque)', async ({ page }) => {
    await open(page)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    // O contorno fica no próprio elemento ou, em campos sem contorno, no contêiner.
    const style = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      const own = getComputedStyle(el)
      const target = own.outlineStyle === 'none' && el.parentElement ? el.parentElement : el
      const cs = getComputedStyle(target)
      return {
        visible: el.matches(':focus-visible'),
        outline: cs.outlineStyle,
        width: cs.outlineWidth,
      }
    })
    expect(style).toEqual({ visible: true, outline: 'solid', width: '2px' })
  })

  test('modal de login prende o foco e Esc fecha', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'No mobile o login é uma página, não um modal.')
    await open(page, '/entrar')
    const dialog = page.getByRole('dialog', { name: 'Entrar' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('E-mail', { exact: true })).toBeFocused()
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab')
      expect(await focusedInside(page, '[role="dialog"]')).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(page).toHaveURL(/\/(\?.*)?$/)
  })

  test('gaveta de filtros prende o foco, Esc fecha e o foco volta ao botão', async ({
    page,
  }, testInfo) => {
    test.skip(!isMobile(testInfo), 'No desktop os filtros ficam na lateral, sem gaveta.')
    await open(page)
    const trigger = page.getByRole('button', { name: /^Filtros/ })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const drawer = page.getByRole('dialog', { name: 'Filtros' })
    await expect(drawer).toBeVisible()
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      expect(await focusedInside(page, '[role="dialog"]')).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('card, edição e quantidade só com teclado', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'Teclado físico: fluxo validado no desktop.')
    await open(page)
    await catalogSettled(page)
    await page
      .locator('#catalogo')
      .getByRole('link', { name: 'Emerald Ape #042', exact: true })
      .focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)

    const editions = page.getByRole('radiogroup', { name: 'Edição:' }).filter({ visible: true })
    const checked = editions.getByRole('radio', { checked: true })
    await expect(checked).toHaveAccessibleName('1/50')
    // Tab entra no grupo pela opção marcada; as setas trocam a edição.
    await checked.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(editions.getByRole('radio', { checked: true })).toHaveAccessibleName('1/10')
    await expect(editions.getByRole('radio', { name: '1/10' })).toBeFocused()
    await expect(page).toHaveURL(/edicao=emerald-ape-042-1-10/)
    await page.keyboard.press('End')
    await expect(editions.getByRole('radio', { checked: true })).toHaveAccessibleName('ABERTA')

    const plus = page.getByRole('button', { name: 'Aumentar quantidade' }).filter({ visible: true })
    await plus.focus()
    await page.keyboard.press('Space')
    await expect(
      page
        .getByLabel(/Quantidade/)
        .filter({ visible: true })
        .first(),
    ).toHaveValue('2')
  })

  test('faixa de preço: setas no slider e valor digitado com Enter', async ({ page }, testInfo) => {
    await open(page)
    await catalogSettled(page)
    await withFilters(page, testInfo, async () => {
      const minThumb = page.getByRole('slider', { name: 'Preço mínimo' })
      await minThumb.focus()
      await page.keyboard.press('ArrowRight')
      await expect(minThumb).toHaveAttribute('aria-valuetext', '0,03 ETH')
      const minField = page.getByLabel('Preço mínimo em ETH').filter({ visible: true })
      await expect(minField).toHaveValue('0,03')
      await minField.fill('1,50')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/precoMin=1\.50/)
      await expect(minThumb).toHaveAttribute('aria-valuetext', '1,50 ETH')
      // Fora da faixa é corrigido para o limite.
      const maxField = page.getByLabel('Preço máximo em ETH').filter({ visible: true })
      await maxField.fill('99')
      await maxField.blur()
      await expect(maxField).toHaveValue('12,30')
    })
  })

  test('login sem dados: erros ligados aos campos e foco no primeiro', async ({ page }) => {
    await open(page, '/entrar')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    const email = page.getByLabel('E-mail', { exact: true })
    await expect(email).toBeFocused()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription(/e-mail/i)
    await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  })
})

test.describe('fora do escopo da demonstração', () => {
  const unavailable = (page: Page) =>
    page.getByRole('heading', { name: /não faz parte desta demonstração/ })

  test('links de ajuda e do menu levam à página "indisponível"', async ({ page }, testInfo) => {
    await open(page)
    if (!isMobile(testInfo)) {
      await page
        .getByRole('navigation', { name: /principal/i })
        .getByRole('link', { name: 'Criadores' })
        .click()
      await expect(unavailable(page)).toBeVisible()
      await page.goto('/')
    }
    await page.getByRole('link', { name: 'Central de ajuda' }).first().click()
    await expect(page).toHaveURL(/\/indisponivel/)
    await expect(unavailable(page)).toBeVisible()
  })

  test('itens do perfil fora do escopo levam à página "indisponível"', async ({ page }) => {
    await open(page, '/entrar?redirect=/perfil')
    await login(page, 'ana')
    await expect(page).toHaveURL(/\/perfil$/)
    await page.getByRole('link', { name: 'Ofertas' }).filter({ visible: true }).click()
    await expect(page).toHaveURL(/\/indisponivel/)
    await expect(unavailable(page)).toBeVisible()
  })

  test('"Esqueceu a senha?" e login social avisam que não fazem parte, sem simular sucesso', async ({
    page,
  }) => {
    await open(page, '/entrar')
    await page.getByRole('button', { name: 'Esqueceu a senha?' }).click()
    await expect(
      page.getByText('A recuperação de senha não faz parte desta demonstração.'),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Continuar com Google' }).click()
    await expect(page.getByText(/Login com Google não faz parte desta demonstração/)).toBeVisible()
    await expect(page).toHaveURL(/\/entrar/)
    await expect(page.getByRole('button', { name: /Menu da conta/ })).toHaveCount(0)
  })

  test('newsletter valida o e-mail e informa que a inscrição não está disponível', async ({
    page,
  }) => {
    await open(page)
    const field = page.getByLabel('E-mail para receber novidades')
    await field.fill('nao-e-email')
    await page.getByRole('button', { name: 'Enviar' }).click()
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
    await field.fill('pessoa@exemplo.com')
    await page.getByRole('button', { name: 'Enviar' }).click()
    await expect(
      page.getByText('A inscrição na newsletter não está disponível nesta demonstração.'),
    ).toBeVisible()
  })
})
