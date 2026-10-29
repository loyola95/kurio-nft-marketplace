import { Favorites } from '@/contracts/favorites'
import {
  AvatarResponse,
  Profile,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '@/contracts/profile'
import { Wallet, Wallets, type WalletInput, type WalletSlot } from '@/contracts/wallet'
import { http } from '../http'

export async function getFavorites(signal?: AbortSignal) {
  const { data } = await http.get('/me/favorites', { signal })
  return Favorites.parse(data)
}

export async function addFavorite(nftId: string) {
  await http.put(`/me/favorites/${encodeURIComponent(nftId)}`)
}

export async function removeFavorite(nftId: string) {
  await http.delete(`/me/favorites/${encodeURIComponent(nftId)}`)
}

export async function getProfile(signal?: AbortSignal) {
  const { data } = await http.get('/me/profile', { signal })
  return Profile.parse(data)
}

export async function updateProfile(input: UpdateProfileInput) {
  const { data } = await http.patch('/me/profile', input)
  return Profile.parse(data)
}

export async function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('avatar', file)
  const { data } = await http.put('/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return AvatarResponse.parse(data)
}

export async function removeAvatar() {
  await http.delete('/me/avatar')
}

export async function changePassword(input: ChangePasswordInput) {
  await http.post('/me/password', input)
}

export async function getWallets(signal?: AbortSignal) {
  const { data } = await http.get('/me/wallets', { signal })
  return Wallets.parse(data)
}

export async function createWallet(slot: WalletSlot, input: WalletInput) {
  const { data } = await http.post('/me/wallets', { slot, ...input })
  return Wallet.parse(data)
}

export async function updateWallet(id: string, input: WalletInput) {
  const { data } = await http.put(`/me/wallets/${encodeURIComponent(id)}`, input)
  return Wallet.parse(data)
}
