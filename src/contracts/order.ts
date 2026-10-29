import { z } from 'zod'
import { IsoDate, Network } from './common'
import { AppliedCoupon, Summary } from './cart'
import { QuoteLine } from './quote'
import { WalletType } from './wallet'

export const CollectorForm = z.object({
  displayName: z.string().trim().min(1, 'Informe o nome de exibição'),
  network: Network,
  walletAddress: z.string().trim().min(1, 'Informe o endereço da carteira'),
  walletType: WalletType,
  email: z.email('Informe um e-mail válido'),
  username: z.string().trim().min(1, 'Informe o nome de usuário'),
  profileName: z.string().trim(),
  ensOrSecondary: z.string().trim(),
  referralCode: z.string().trim(),
  ensName: z.string().trim(),
  useOtherWallet: z.boolean(),
  note: z.string().trim().max(280, 'Use no máximo 280 caracteres'),
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
