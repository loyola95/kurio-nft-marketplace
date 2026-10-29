import { z } from 'zod'
import { NftSummary } from './nft'

export const Favorites = z.object({ nftIds: z.array(z.string()), items: z.array(NftSummary) })
export type Favorites = z.infer<typeof Favorites>
