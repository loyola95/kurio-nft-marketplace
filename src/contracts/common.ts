import { z } from 'zod'

/** Valor em ETH como string decimal (até 18 casas). Nunca number. */
export const EthAmount = z.string().regex(/^\d+(\.\d{1,18})?$/, 'Valor em ETH inválido')
export type EthAmount = z.infer<typeof EthAmount>

export const IsoDate = z.iso.datetime({ offset: true })

export const Network = z.enum(['ethereum', 'polygon', 'solana'])
export type Network = z.infer<typeof Network>

export const NETWORK_LABEL: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const Image = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().int(),
  height: z.number().int(),
})
export type Image = z.infer<typeof Image>

export const Quantity = z.number().int().min(1)
