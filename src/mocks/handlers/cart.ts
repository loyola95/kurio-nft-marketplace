import { HttpResponse } from 'msw'
import {
  AddCartItemInput,
  ApplyCouponInput,
  MergeCartInput,
  UpdateCartItemInput,
} from '@/contracts/cart'
import type { MockCart, MockState } from '../db/schema'
import { db, nextId } from '../db/store'
import {
  CartError,
  addItem,
  mergeCarts,
  resolveCoupon,
  setQuantity,
  toCartView,
  type FindEdition,
} from '../domain/cart'
import { findNft } from '../domain/catalog'
import { optionalUser, requireUser } from '../lib/auth'
import { MockHttpError, readBody, route } from '../lib/http'

// Carrinho na API: conta pelo token, visitante pelo header X-Cart-Id.

const STATUS: Partial<Record<CartError['code'], number>> = {
  AVAILABILITY_CONFLICT: 409,
  COUPON_INVALID: 422,
  COUPON_EXPIRED: 422,
}

function rethrow(error: unknown): never {
  if (error instanceof CartError) {
    throw new MockHttpError(STATUS[error.code] ?? 400, error.code, error.message, {
      fieldErrors: error.fieldErrors,
      details: error.details,
    })
  }
  throw error
}

function owner(request: Request): { key: string; ownerType: MockCart['ownerType'] } {
  const user = optionalUser(request)
  if (user) return { key: `user:${user.id}`, ownerType: 'user' }
  const guestId = request.headers.get('X-Cart-Id')
  if (!guestId) throw new MockHttpError(400, 'VALIDATION_ERROR', 'Carrinho não identificado.')
  return { key: `guest:${guestId}`, ownerType: 'guest' }
}

export const finder =
  (state: MockState): FindEdition =>
  (nftId, editionId) => {
    const nft = findNft(state, nftId)
    const edition = nft?.editions.find((e) => e.id === editionId)
    return nft && edition ? { nft, edition } : null
  }

function emptyCart(state: MockState, ownerType: MockCart['ownerType']): MockCart {
  return {
    id: nextId(state, 'cart'),
    ownerType,
    items: [],
    couponCode: null,
    notices: [],
    version: 1,
  }
}

/** Lê o carrinho já reconciliado com preço e estoque atuais (grava se algo foi ajustado). */
function respond(key: string, ownerType: MockCart['ownerType']) {
  const state = db.get()
  const stored = state.carts[key] ?? {
    id: `cart-${key}`,
    ownerType,
    items: [],
    couponCode: null,
    notices: [],
    version: 0,
  }
  const coupon = state.coupons.find((c) => c.code === stored.couponCode) ?? null
  const { view, cart, changed } = toCartView(stored, finder(state), coupon)
  if (changed && state.carts[key]) {
    db.update((s) => {
      s.carts[key] = cart
    })
  }
  return HttpResponse.json(view)
}

function mutate(request: Request, fn: (cart: MockCart, state: MockState) => MockCart) {
  const { key, ownerType } = owner(request)
  try {
    db.update((s) => {
      s.carts[key] = fn(s.carts[key] ?? emptyCart(s, ownerType), s)
    })
  } catch (error) {
    rethrow(error)
  }
  return respond(key, ownerType)
}

function editionOrThrow(state: MockState, nftId: string, editionId: string) {
  const found = finder(state)(nftId, editionId)
  if (!found) throw new MockHttpError(404, 'NOT_FOUND', 'NFT ou edição não encontrados.')
  return found.edition
}

function itemOrThrow(cart: MockCart, itemId: string) {
  const item = cart.items.find((i) => i.id === itemId)
  if (!item) throw new MockHttpError(404, 'NOT_FOUND', 'Item não está no carrinho.')
  return item
}

export const cartHandlers = [
  route('get', '/cart', ({ request }) => {
    const { key, ownerType } = owner(request)
    return respond(key, ownerType)
  }),

  route('post', '/cart/items', async ({ request }) => {
    const input = await readBody(request, AddCartItemInput)
    return mutate(request, (cart, s) =>
      addItem(cart, input, editionOrThrow(s, input.nftId, input.editionId), () =>
        nextId(s, 'item'),
      ),
    )
  }),

  route<{ itemId: string }>('patch', '/cart/items/:itemId', async ({ request, params }) => {
    const { quantity } = await readBody(request, UpdateCartItemInput)
    return mutate(request, (cart, s) => {
      const item = itemOrThrow(cart, params.itemId)
      return setQuantity(cart, item.id, quantity, editionOrThrow(s, item.nftId, item.editionId))
    })
  }),

  route<{ itemId: string }>('delete', '/cart/items/:itemId', ({ request, params }) =>
    mutate(request, (cart) => {
      itemOrThrow(cart, params.itemId)
      return {
        ...cart,
        items: cart.items.filter((i) => i.id !== params.itemId),
        notices: cart.notices.filter((n) => n.itemId !== params.itemId),
        version: cart.version + 1,
      }
    }),
  ),

  route('put', '/cart/coupon', async ({ request }) => {
    const { code } = await readBody(request, ApplyCouponInput)
    return mutate(request, (cart, s) => ({
      ...cart,
      couponCode: resolveCoupon(s.coupons, code, Date.now()).code,
      version: cart.version + 1,
    }))
  }),

  route('delete', '/cart/coupon', ({ request }) =>
    mutate(request, (cart) => ({ ...cart, couponCode: null, version: cart.version + 1 })),
  ),

  // Fechar os avisos confirma os preços atuais (adição ao contrato da spec).
  route('post', '/cart/notices/dismiss', ({ request }) =>
    mutate(request, (cart, s) => ({
      ...cart,
      items: cart.items.map((i) => {
        const edition = finder(s)(i.nftId, i.editionId)?.edition
        return edition ? { ...i, seenUnitPriceEth: edition.priceEth } : i
      }),
      notices: [],
      version: cart.version + 1,
    })),
  ),

  route('post', '/cart/merge', async ({ request }) => {
    const user = requireUser(request)
    const { guestCartId } = await readBody(request, MergeCartInput)
    const key = `user:${user.id}`
    db.update((s) => {
      const guest = s.carts[`guest:${guestCartId}`]
      if (!guest) return
      const target = s.carts[key] ?? emptyCart(s, 'user')
      s.carts[key] = mergeCarts(guest, target, finder(s), () => nextId(s, 'item'))
      delete s.carts[`guest:${guestCartId}`]
    })
    return respond(key, 'user')
  }),
]
