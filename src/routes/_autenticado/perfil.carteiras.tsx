import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/features/profile/components/WalletsPage'

export const Route = createFileRoute('/_autenticado/perfil/carteiras')({
  component: WalletsPage,
})
