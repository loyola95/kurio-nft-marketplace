/**
 * Substituto do pacote `tldts` no bundle dos mocks (alias em vite.config.ts).
 *
 * O MSW usa o tough-cookie no cookie store dele, e o tough-cookie usa só
 * `getDomain` do tldts para achar o domínio registrável ao casar cookies. O
 * tldts traz a lista pública de sufixos inteira (~110 KB comprimidos, metade do
 * chunk do MSW), carregada antes do app. O Kurio não usa cookies (sessão por
 * token no header), então o cookie store fica sempre vazio e essa precisão não
 * muda nenhuma resposta. A regra simples abaixo erra sufixos compostos
 * (`exemplo.com.br` vira `com.br`), o que só importaria se houvesse cookies.
 */
export function getDomain(hostname: string): string | null {
  const labels = hostname.split('.').filter(Boolean)
  return labels.length >= 2 ? labels.slice(-2).join('.') : null
}
