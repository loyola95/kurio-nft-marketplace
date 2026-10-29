import type { Network } from '@/contracts/common'
import { Order, Orders, type CreateOrderInput } from '@/contracts/order'
import { Quote } from '@/contracts/quote'
import { WalletConnection, type ConnectWalletInput } from '@/contracts/wallet'
import { http } from '../http'

export async function createQuote(network: Network) {
  const { data } = await http.post('/quotes', { network })
  return Quote.parse(data)
}

export async function connectWallet(input: ConnectWalletInput) {
  const { data } = await http.post('/wallet-connections', input)
  return WalletConnection.parse(data)
}

export async function disconnectWallet(connectionId: string) {
  await http.delete(`/wallet-connections/${encodeURIComponent(connectionId)}`)
}

/** A mesma chave de idempotência recupera o mesmo pedido em reenvios. */
export async function createOrder(body: CreateOrderInput, idempotencyKey: string) {
  const { data } = await http.post('/orders', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return Order.parse(data)
}

export async function getOrder(id: string, signal?: AbortSignal) {
  const { data } = await http.get(`/orders/${encodeURIComponent(id)}`, { signal })
  return Order.parse(data)
}

export async function getPendingOrders(signal?: AbortSignal) {
  const { data } = await http.get('/orders', { params: { status: 'pending' }, signal })
  return Orders.parse(data)
}
