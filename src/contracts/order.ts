import { z } from 'zod'
import { IsoDate, Network } from './common'
import { AppliedCoupon, Summary } from './cart'
import { QuoteLine } from './quote'
import { USERNAME_RULE } from './auth'
import { ENS_NAME, WalletType, isValidAddress } from './wallet'

// Campos do "Perfil do colecionador" no pagamento. Os asteriscos do Figma viram
// obrigatórios (mesma regra do cadastro de carteiras); rede, endereço e tipo vêm
// da carteira cadastrada escolhida.
export const CollectorForm = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, 'Informe o nome de exibição')
      .max(40, 'Use no máximo 40 caracteres'),
    network: Network,
    walletAddress: z.string().trim().min(1, 'Informe o endereço da carteira'),
    walletType: WalletType,
    email: z.email('Informe um e-mail válido'),
    username: z
      .string()
      .trim()
      .min(3, 'Use pelo menos 3 caracteres')
      .max(24, 'Use no máximo 24 caracteres')
      .regex(USERNAME_RULE, 'Use letras, números, ponto ou sublinhado'),
    profileName: z
      .string()
      .trim()
      .min(1, 'Informe o nome do perfil')
      .max(40, 'Use no máximo 40 caracteres'),
    ensOrSecondary: z.string().trim(),
    referralCode: z
      .string()
      .trim()
      .min(1, 'Informe o código de indicação')
      .max(20, 'Use no máximo 20 caracteres'),
    ensName: z
      .string()
      .trim()
      .min(1, 'Informe o nome ENS')
      .regex(ENS_NAME, 'O nome ENS termina em .eth'),
    useOtherWallet: z.boolean(),
    note: z.string().trim().max(280, 'Use no máximo 280 caracteres'),
  })
  .superRefine((value, ctx) => {
    if (!isValidAddress(value.network, value.walletAddress)) {
      ctx.addIssue({
        code: 'custom',
        path: ['walletAddress'],
        message: 'Endereço da carteira inválido para a rede',
      })
    }
  })
export type CollectorForm = z.infer<typeof CollectorForm>

export const OrderStatus = z.enum(['pending', 'confirmed', 'declined'])
export type OrderStatus = z.infer<typeof OrderStatus>

export const Receipt = z.object({
  lines: z.array(QuoteLine),
  coupon: AppliedCoupon.nullable(),
  summary: Summary,
  network: Network,
  wallet: z.object({ label: z.string(), address: z.string() }),
  transaction: z.object({ hash: z.string(), explorerUrl: z.string() }).nullable(),
  confirmedAt: IsoDate.nullable(),
})
export type Receipt = z.infer<typeof Receipt>

export const Order = z.object({
  id: z.string(),
  status: OrderStatus,
  version: z.number().int(),
  createdAt: IsoDate,
  updatedAt: IsoDate,
  declineReason: z.string().nullable(),
  receipt: Receipt,
})
export type Order = z.infer<typeof Order>

export const Orders = z.array(Order)

export const CreateOrderInput = z.object({
  quoteId: z.string(),
  quoteVersion: z.number().int(),
  walletId: z.string(),
  network: Network,
  connectionId: z.string(),
  collector: CollectorForm,
})
export type CreateOrderInput = z.infer<typeof CreateOrderInput>
