import { Cart, type AddCartItemInput } from '@/contracts/cart'
import { http } from '../http'

export async function getCart(signal?: AbortSignal) {
  const { data } = await http.get('/cart', { signal })
  return Cart.parse(data)
}

export async function addCartItem(input: AddCartItemInput) {
  const { data } = await http.post('/cart/items', input)
  return Cart.parse(data)
}

export async function updateCartItem(itemId: string, quantity: number) {
  const { data } = await http.patch(`/cart/items/${encodeURIComponent(itemId)}`, { quantity })
  return Cart.parse(data)
}

export async function removeCartItem(itemId: string) {
  const { data } = await http.delete(`/cart/items/${encodeURIComponent(itemId)}`)
  return Cart.parse(data)
}

export async function applyCoupon(code: string) {
  const { data } = await http.put('/cart/coupon', { code })
  return Cart.parse(data)
}

export async function removeCoupon() {
  const { data } = await http.delete('/cart/coupon')
  return Cart.parse(data)
}

export async function mergeCart(guestCartId: string) {
  const { data } = await http.post('/cart/merge', { guestCartId })
  return Cart.parse(data)
}
