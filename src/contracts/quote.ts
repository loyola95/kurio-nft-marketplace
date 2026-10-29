import { z } from 'zod'
import { EthAmount, Image, IsoDate, Network, Quantity } from './common'
import { AppliedCoupon, Summary } from './cart'
import { EditionLabel } from './nft'

export const QuoteLine = z.object({
  itemId: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  editionLabel: EditionLabel,
  tokenId: z.string(),
  image: Image,
  unitPriceEth: EthAmount,
  quantity: Quantity,
  lineTotalEth: EthAmount,
})
export type QuoteLine = z.infer<typeof QuoteLine>

export const Quote = z.object({
  id: z.string(),
  version: z.number().int(),
  cartVersion: z.number().int(),
  expiresAt: IsoDate,
  network: Network,
  lines: z.array(QuoteLine),
  coupon: AppliedCoupon.nullable(),
  summary: Summary,
})
export type Quote = z.infer<typeof Quote>

export const CreateQuoteInput = z.object({ network: Network })
export type CreateQuoteInput = z.infer<typeof CreateQuoteInput>
