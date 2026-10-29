import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageShell } from '@/features/layout/PageShell'

export const Route = createFileRoute('/nft/$nftId')({
  validateSearch: z.object({ edicao: z.string().optional().catch(undefined) }),
  component: () => <PageShell title="Detalhes do NFT" />,
})
