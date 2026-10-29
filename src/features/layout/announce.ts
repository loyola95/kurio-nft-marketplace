type Listener = (message: string) => void
export const announceListeners = new Set<Listener>()

/**
 * Anuncia mensagens para leitores de tela (mutations, eventos em tempo real).
 * Complementa os toasts visuais; não substitui texto visível na tela.
 */
export function announce(message: string) {
  announceListeners.forEach((fn) => fn(message))
}
