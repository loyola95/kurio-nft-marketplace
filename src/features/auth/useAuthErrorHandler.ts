import { useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { setAuthErrorHandler } from '@/api/http'
import { useClearSession } from './useLogout'

/**
 * Quando a API responde que a sessão expirou (ou deixou de valer), limpa os dados
 * privados sem chamar o logout e leva ao login com aviso e volta para a página atual.
 */
export function useAuthErrorHandler() {
  const clear = useClearSession()
  const navigate = useNavigate()
  const { href, pathname } = useLocation()
  const current = useRef({ href, pathname })
  useEffect(() => {
    current.current = { href, pathname }
  }, [href, pathname])
  const handling = useRef(false)

  useEffect(() => {
    setAuthErrorHandler(() => {
      // Várias requisições podem falhar juntas; trata uma vez só.
      if (handling.current) return
      handling.current = true
      const { href: from, pathname: path } = current.current
      void clear({ keepDrafts: true }).then(async () => {
        if (path !== '/entrar' && path !== '/cadastro') {
          await navigate({ to: '/entrar', search: { redirect: from, motivo: 'expirada' } })
        }
        handling.current = false
      })
    })
    return () => setAuthErrorHandler(null)
  }, [clear, navigate])
}
