import type { Wallet } from '@/contracts/wallet'
import type { MockCoupon, MockUser } from '../db/schema'

// Credenciais fictícias: ana@kurio.dev e bruno@kurio.dev, senha Kurio@123.
// Guardamos só sha256(salt + senha), nunca a senha.
export const USERS: MockUser[] = [
  {
    id: 'u-ana',
    username: 'ana.souza',
    email: 'ana@kurio.dev',
    displayName: 'Ana Souza',
    salt: 's4lt-ana-91',
    passwordHash: '79d243aeba12ed7a61ac1b6742afc899152a231c47f43c96cfc5750381e9d660',
    avatarUrl: null,
    ensName: 'nova.eth',
    walletNickname: 'Nova',
    profileVersion: 1,
  },
  {
    id: 'u-bruno',
    username: 'bruno.lima',
    email: 'bruno@kurio.dev',
    displayName: 'Bruno Lima',
    salt: 's4lt-bruno-37',
    passwordHash: '9456650f019b1d5bb68dea7f6fc782388d7f59424689026846d133a9eb3bf64d',
    avatarUrl: null,
    ensName: '',
    walletNickname: 'Principal',
    profileVersion: 1,
  },
]

export const FAVORITES: Record<string, string[]> = {
  'u-ana': ['emerald-ape-042', 'golden-beat-207'],
  'u-bruno': ['ivory-baron-088'],
}

const UPDATED_AT = '2026-10-20T10:00:00.000Z'

export const WALLETS: Record<string, { primary: Wallet | null; secondary: Wallet | null }> = {
  'u-ana': {
    primary: {
      id: 'w-ana-1',
      slot: 'primary',
      updatedAt: UPDATED_AT,
      displayName: 'Ana Souza',
      nickname: 'Principal',
      network: 'ethereum',
      profileName: 'ana.souza',
      address: '0xA91F3c5B7d2e4F6a8B0c1D2e3F4a5B6c7D8eE82C',
      ensOrSecondary: '',
      walletType: 'metamask',
      referralCode: '',
      email: 'ana@kurio.dev',
      ensName: 'nova.eth',
    },
    secondary: {
      id: 'w-ana-2',
      slot: 'secondary',
      updatedAt: UPDATED_AT,
      displayName: 'Ana Souza',
      nickname: 'Reserva',
      network: 'polygon',
      profileName: 'ana.souza',
      address: '0x5E7d9A1b3C5d7E9f1A3b5C7d9E1f3A5b7C9d0B12',
      ensOrSecondary: 'nova.kurio.eth',
      walletType: 'walletconnect',
      referralCode: '',
      email: 'ana@kurio.dev',
      ensName: 'nova.kurio.eth',
    },
  },
  'u-bruno': {
    primary: {
      id: 'w-bruno-1',
      slot: 'primary',
      updatedAt: UPDATED_AT,
      displayName: 'Bruno Lima',
      nickname: 'Principal',
      network: 'ethereum',
      profileName: 'bruno.lima',
      address: '0x3B8e2A4c6D8f0A2b4C6d8E0f2A4b6C8d0E2f4A61',
      ensOrSecondary: '',
      walletType: 'coinbase',
      referralCode: '',
      email: 'bruno@kurio.dev',
      ensName: '',
    },
    secondary: null,
  },
}

export const COUPONS: MockCoupon[] = [
  {
    code: 'KURIO10',
    label: '10% de desconto',
    kind: 'percent',
    value: '10',
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'GENESIS',
    label: '0.05 ETH de desconto',
    kind: 'fixed',
    value: '0.05',
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'VERAO2025',
    label: '15% de desconto',
    kind: 'percent',
    value: '15',
    expiresAt: '2025-03-20T23:59:59.000Z',
  },
]
