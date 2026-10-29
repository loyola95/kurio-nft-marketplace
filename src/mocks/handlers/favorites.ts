import { HttpResponse } from 'msw'
import type { Favorites } from '@/contracts/favorites'
import type { MockState } from '../db/schema'
import { db } from '../db/store'
import { findNft, toSummary } from '../domain/catalog'
import { requireUser } from '../lib/auth'
import { MockHttpError, route } from '../lib/http'

function favoritesOf(state: MockState, userId: string): Favorites {
  const nftIds = state.favorites[userId] ?? []
  const items = nftIds.flatMap((id) => {
    const nft = findNft(state, id)
    return nft ? [toSummary(nft)] : []
  })
  return { nftIds, items }
}

// Lista de interesse por usuário. PUT e DELETE são idempotentes.
export const favoriteHandlers = [
  route('get', '/me/favorites', ({ request }) => {
    const user = requireUser(request)
    return HttpResponse.json(favoritesOf(db.get(), user.id))
  }),

  route<{ nftId: string }>('put', '/me/favorites/:nftId', ({ request, params }) => {
    const user = requireUser(request)
    if (!findNft(db.get(), params.nftId)) {
      throw new MockHttpError(404, 'NOT_FOUND', 'NFT não encontrado.')
    }
    db.update((s) => {
      const list = s.favorites[user.id] ?? []
      if (!list.includes(params.nftId)) s.favorites[user.id] = [params.nftId, ...list]
    })
    return new HttpResponse(null, { status: 204 })
  }),

  route<{ nftId: string }>('delete', '/me/favorites/:nftId', ({ request, params }) => {
    const user = requireUser(request)
    db.update((s) => {
      s.favorites[user.id] = (s.favorites[user.id] ?? []).filter((id) => id !== params.nftId)
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
