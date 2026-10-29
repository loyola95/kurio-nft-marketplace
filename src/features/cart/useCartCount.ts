import { useCart } from './queries'

/** Quantidade total de edições no carrinho (badge do cabeçalho). */
export function useCartCount(): number {
  const { data } = useCart()
  return data?.items.reduce((n, item) => n + item.quantity, 0) ?? 0
}
