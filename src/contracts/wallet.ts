import { z } from 'zod'
import { IsoDate, Network } from './common'

export const WalletType = z.enum(['metamask', 'walletconnect', 'coinbase'])
export type WalletType = z.infer<typeof WalletType>

export const WALLET_TYPE_LABEL: Record<WalletType, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

/** Conectores aceitos por rede (regra da demonstração). */
export const WALLET_NETWORKS: Record<WalletType, Network[]> = {
  metamask: ['ethereum', 'polygon'],
  coinbase: ['ethereum', 'polygon'],
  walletconnect: ['ethereum', 'polygon', 'solana'],
}

export const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
export const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export function isValidAddress(network: Network, address: string): boolean {
  return network === 'solana' ? SOLANA_ADDRESS.test(address) : EVM_ADDRESS.test(address)
}

export const WalletSlot = z.enum(['primary', 'secondary'])
export type WalletSlot = z.infer<typeof WalletSlot>

export const WalletInput = z
  .object({
    displayName: z.string().trim().min(1, 'Informe o nome de exibição'),
    nickname: z.string().trim().max(40, 'Use no máximo 40 caracteres'),
    network: Network,
    profileName: z.string().trim().max(40, 'Use no máximo 40 caracteres'),
    address: z.string().trim(),
    ensOrSecondary: z.string().trim(),
    walletType: WalletType,
    referralCode: z.string().trim().max(20, 'Use no máximo 20 caracteres'),
    email: z.union([z.email('Informe um e-mail válido'), z.literal('')]),
    ensName: z.union([
      z.string().regex(/^[a-z0-9-]+\.eth$/i, 'O nome ENS termina em .eth'),
      z.literal(''),
    ]),
  })
  .superRefine((value, ctx) => {
    if (!isValidAddress(value.network, value.address)) {
      ctx.addIssue({
        code: 'custom',
        path: ['address'],
        message:
          value.network === 'solana'
            ? 'Endereço Solana inválido'
            : 'Use um endereço 0x com 40 caracteres hexadecimais',
      })
    }
    if (!WALLET_NETWORKS[value.walletType].includes(value.network)) {
      ctx.addIssue({
        code: 'custom',
        path: ['walletType'],
        message: `${WALLET_TYPE_LABEL[value.walletType]} não é compatível com essa rede`,
      })
    }
  })
export type WalletInput = z.infer<typeof WalletInput>

export const Wallet = z.object({
  id: z.string(),
  slot: WalletSlot,
  updatedAt: IsoDate,
  displayName: z.string(),
  nickname: z.string(),
  network: Network,
  profileName: z.string(),
  address: z.string(),
  ensOrSecondary: z.string(),
  walletType: WalletType,
  referralCode: z.string(),
  email: z.string(),
  ensName: z.string(),
})
export type Wallet = z.infer<typeof Wallet>

export const Wallets = z.object({ primary: Wallet.nullable(), secondary: Wallet.nullable() })
export type Wallets = z.infer<typeof Wallets>

export const WalletConnection = z.object({
  id: z.string(),
  status: z.literal('connected'),
  walletId: z.string(),
  connector: WalletType,
  network: Network,
})
export type WalletConnection = z.infer<typeof WalletConnection>

export const ConnectWalletInput = z.object({
  walletId: z.string(),
  connector: WalletType,
  network: Network,
})
export type ConnectWalletInput = z.infer<typeof ConnectWalletInput>
