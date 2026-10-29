import { z } from 'zod'
import { EthAmount, Image, Network, Quantity } from './common'
import { EditionLabel } from './nft'

export const Summary = z.object({
  subtotalEth: EthAmount,
  discountEth: EthAmount,
  networkFeeEth: EthAmount,
  totalEth: EthAmount,
})
export type Summary = z.infer<typeof Summary>

export const CartItemStatus = z.enum(['ok', 'price_changed', 'quantity_reduced', 'sold_out'])
export type CartItemStatus = z.infer<typeof CartItemStatus>

export const CartItem = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  editionLabel: EditionLabel,
  tokenId: z.string(),
  network: Network,
  image: Image,
  unitPriceEth: EthAmount,
  quantity: Quantity,
  lineTotalEth: EthAmount,
  available: z.number().int().min(0),
  maxQuantity: z.number().int().min(0),
  status: CartItemStatus,
  previousUnitPriceEth: EthAmount.nullable(),
})
export type CartItem = z.infer<typeof CartItem>

export const CartNotice = z.object({
  id: z.string(),
  kind: z.enum(['price_changed', 'quantity_reduced', 'sold_out', 'merge_trimmed']),
  itemId: z.string(),
  message: z.string(),
})
export type CartNotice = z.infer<typeof CartNotice>

export const AppliedCoupon = z.object({
  code: z.string(),
  label: z.string(),
  status: z.literal('applied'),
})
export type AppliedCoupon = z.infer<typeof AppliedCoupon>

export const Cart = z.object({
  id: z.string(),
  ownerType: z.enum(['guest', 'user']),
  items: z.array(CartItem),
  coupon: AppliedCoupon.nullable(),
  summary: Summary,
  notices: z.array(CartNotice),
  version: z.number().int(),
})
export type Cart = z.infer<typeof Cart>

export const AddCartItemInput = z.object({
  nftId: z.string(),
  editionId: z.string(),
  quantity: Quantity,
})
export type AddCartItemInput = z.infer<typeof AddCartItemInput>

export const UpdateCartItemInput = z.object({ quantity: Quantity })
export const ApplyCouponInput = z.object({ code: z.string().trim().min(1, 'Informe o código') })
export const MergeCartInput = z.object({ guestCartId: z.string() })
