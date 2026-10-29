import type { Cart } from '@/contracts/cart'
import { NETWORK_LABEL, type Network } from '@/contracts/common'
import type { CollectorForm } from '@/contracts/order'
import type { Profile } from '@/contracts/profile'
import type { Quote } from '@/contracts/quote'
import type { Wallet, Wallets } from '@/contracts/wallet'

export const NETWORKS: Network[] = ['ethereum', 'polygon', 'solana']

/** Itens que podem ser comprados (esgotado não entra em pedido). */
const buyable = (cart: Cart | undefined) => cart?.items.filter((i) => i.status !== 'sold_out') ?? []

export function walletsList(wallets: Wallets | undefined): Wallet[] {
  return [wallets?.primary, wallets?.secondary].filter((w): w is Wallet => Boolean(w))
}

/** Carteira que paga a rede: a principal tem preferência. */
export function walletForNetwork(wallets: Wallets | undefined, network: Network) {
  return walletsList(wallets).find((w) => w.network === network) ?? null
}

export interface NetworkOption {
  network: Network
  label: string
  /** Motivo de não poder escolher (sem itens ou sem carteira). */
  disabledReason: string | null
}

export function networkOptions(cart: Cart | undefined, wallets: Wallets | undefined) {
  const withItems = new Set(buyable(cart).map((i) => i.network))
  return NETWORKS.map((network): NetworkOption => {
    const reason = !withItems.has(network)
      ? 'sem itens no carrinho'
      : !walletForNetwork(wallets, network)
        ? 'sem carteira cadastrada'
        : null
    return { network, label: NETWORK_LABEL[network], disabledReason: reason }
  })
}

/** Carteira inicial: a que a pessoa já escolheu (se ainda serve), senão a primeira que tem o que pagar. */
export function initialWallet(
  cart: Cart | undefined,
  wallets: Wallets | undefined,
  preferredId: string | null,
): Wallet | null {
  const payable = new Set(
    networkOptions(cart, wallets)
      .filter((o) => !o.disabledReason)
      .map((o) => o.network),
  )
  const list = walletsList(wallets).filter((w) => payable.has(w.network))
  return list.find((w) => w.id === preferredId) ?? list[0] ?? null
}

/** Redes do carrinho sem carteira cadastrada (pede para cadastrar). */
export function networksWithoutWallet(cart: Cart | undefined, wallets: Wallets | undefined) {
  return networkOptions(cart, wallets)
    .filter((o) => o.disabledReason === 'sem carteira cadastrada')
    .map((o) => o.network)
}

/** Unidades de outras redes que ficam no carrinho para outro pedido, por rede. */
export function leftForOtherOrders(cart: Cart | undefined, network: Network) {
  const counts = new Map<Network, number>()
  for (const item of buyable(cart)) {
    if (item.network !== network) {
      counts.set(item.network, (counts.get(item.network) ?? 0) + item.quantity)
    }
  }
  return [...counts].map(([net, units]) => ({ network: net, units }))
}

/**
 * Assinatura do que a cotação considera para a rede: muda quando preço,
 * quantidade, disponibilidade ou cupom mudam no carrinho (vindo da API).
 */
export function cartSignature(cart: Cart | undefined, network: Network | null): string {
  if (!cart || !network) return ''
  const lines = cart.items
    .filter((i) => i.network === network)
    .map((i) => `${i.editionId}:${i.quantity}:${i.unitPriceEth}:${i.status}`)
  return lines.length ? `${lines.join('|')}#${cart.coupon?.code ?? ''}` : ''
}

/** Duas cotações cobram o mesmo (mesmas linhas, preços, cupom e taxa)? */
export function sameTerms(a: Quote, b: Quote): boolean {
  const terms = (q: Quote) =>
    JSON.stringify([
      q.network,
      q.lines.map((l) => [l.editionId, l.unitPriceEth, l.quantity]),
      q.coupon?.code ?? null,
      q.summary,
    ])
  return terms(a) === terms(b)
}

export const isExpired = (quote: Quote, now: number) => Date.parse(quote.expiresAt) <= now

/** Formulário preenchido a partir do perfil e da carteira escolhida. */
export function collectorDefaults(profile: Profile, wallet: Wallet | null): CollectorForm {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    note: '',
    ...walletFields(wallet),
  }
}

/** Campos que vêm da carteira cadastrada (trocam junto com a carteira). */
export function walletFields(wallet: Wallet | null) {
  return {
    network: wallet?.network ?? 'ethereum',
    walletAddress: wallet?.address ?? '',
    walletType: wallet?.walletType ?? 'metamask',
    profileName: wallet?.profileName ?? '',
    ensOrSecondary: wallet?.ensOrSecondary ?? '',
    referralCode: wallet?.referralCode ?? '',
    ensName: wallet?.ensName ?? '',
    useOtherWallet: wallet?.slot === 'secondary',
  } satisfies Partial<CollectorForm>
}

/** "0xA91F…E82C" (como no Figma). */
export function shortAddress(value: string): string {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value
}

export function unitsLabel(units: number) {
  return units === 1 ? '1 item' : `${units} itens`
}
