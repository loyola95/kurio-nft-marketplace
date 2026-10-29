import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changePassword,
  createWallet,
  getProfile,
  getWallets,
  removeAvatar,
  updateProfile,
  updateWallet,
  uploadAvatar,
} from '@/api/endpoints/account'
import type { User } from '@/contracts/auth'
import type { Profile, UpdateProfileInput } from '@/contracts/profile'
import type { WalletInput, WalletSlot, Wallets } from '@/contracts/wallet'
import { sessionKeys, useSession } from '@/features/auth/session'

export const profileKeys = {
  profile: (userId: string) => ['user', userId, 'profile'] as const,
  wallets: (userId: string) => ['user', userId, 'wallets'] as const,
}

export const profileOptions = (userId: string) =>
  queryOptions({
    queryKey: profileKeys.profile(userId),
    queryFn: ({ signal }) => getProfile(signal),
    staleTime: 60_000,
  })

export const walletsOptions = (userId: string) =>
  queryOptions({
    queryKey: profileKeys.wallets(userId),
    queryFn: ({ signal }) => getWallets(signal),
    staleTime: 60_000,
  })

function useUserId() {
  const { user } = useSession()
  return user?.id ?? ''
}

export function useProfile() {
  const userId = useUserId()
  return useQuery({ ...profileOptions(userId), enabled: Boolean(userId) })
}

export function useWallets() {
  const userId = useUserId()
  return useQuery({ ...walletsOptions(userId), enabled: Boolean(userId) })
}

/** Perfil salvo também atualiza a sessão (o cabeçalho mostra nome e avatar). */
function useSyncProfile() {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return (patch: Partial<Profile>) => {
    queryClient.setQueryData<Profile>(profileKeys.profile(userId), (old) =>
      old ? { ...old, ...patch } : old,
    )
    queryClient.setQueryData<User | null>(sessionKeys.current, (old) =>
      old
        ? {
            ...old,
            ...(patch.displayName !== undefined && { displayName: patch.displayName }),
            ...(patch.username !== undefined && { username: patch.username }),
            ...(patch.email !== undefined && { email: patch.email }),
            ...(patch.avatarUrl !== undefined && { avatarUrl: patch.avatarUrl }),
          }
        : old,
    )
  }
}

export function useUpdateProfile() {
  const sync = useSyncProfile()
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (profile) => sync(profile),
  })
}

export function useUploadAvatar() {
  const sync = useSyncProfile()
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: ({ avatarUrl }) => sync({ avatarUrl }),
  })
}

export function useRemoveAvatar() {
  const sync = useSyncProfile()
  return useMutation({ mutationFn: removeAvatar, onSuccess: () => sync({ avatarUrl: null }) })
}

export const useChangePassword = () => useMutation({ mutationFn: changePassword })

export function useSaveWallet(slot: WalletSlot) {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: WalletInput }) =>
      id ? updateWallet(id, input) : createWallet(slot, input),
    onSuccess: (wallet) =>
      queryClient.setQueryData<Wallets>(profileKeys.wallets(userId), (old) => ({
        primary: old?.primary ?? null,
        secondary: old?.secondary ?? null,
        [slot]: wallet,
      })),
  })
}
