import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { NftDetailPage } from '@/features/nft/components/NftDetailPage'
import { nftDetailOptions, relatedOptions } from '@/features/nft/queries'

export const Route = createFileRoute('/nft/$nftId')({
  validateSearch: z.object({ edicao: z.string().optional().catch(undefined) }),
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftDetailOptions(params.nftId))
    void context.queryClient.prefetchQuery(relatedOptions(params.nftId))
  },
  component: NftDetailPage,
})
