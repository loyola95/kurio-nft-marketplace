import { createFileRoute } from '@tanstack/react-router'
import { FavoritesPage } from '@/features/favorites/components/FavoritesPage'

export const Route = createFileRoute('/_autenticado/perfil/favoritos')({
  component: FavoritesPage,
})
