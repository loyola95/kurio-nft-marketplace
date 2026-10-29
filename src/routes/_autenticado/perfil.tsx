import { createFileRoute } from '@tanstack/react-router'
import { ProfileLayout } from '@/features/profile/components/ProfileLayout'

export const Route = createFileRoute('/_autenticado/perfil')({
  component: ProfileLayout,
})
