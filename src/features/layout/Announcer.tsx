import { useEffect, useState } from 'react'
import { announceListeners } from './announce'

export function Announcer() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    const fn = (m: string) => {
      // Limpa antes para que a mesma mensagem repetida seja lida de novo.
      setMessage('')
      requestAnimationFrame(() => setMessage(m))
    }
    announceListeners.add(fn)
    return () => {
      announceListeners.delete(fn)
    }
  }, [])
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  )
}
