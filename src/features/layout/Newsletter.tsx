import { useId, useState } from 'react'
import { z } from 'zod'

const Email = z.email()

/**
 * Newsletter do rodapé. A inscrição não faz parte da demonstração: validamos o
 * e-mail e informamos isso, sem simular sucesso.
 */
export function Newsletter() {
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)
  const inputId = useId()
  const feedbackId = useId()

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg leading-[22px] font-bold">Antecipe-se ao próximo lançamento</h2>
      <form
        noValidate
        // Foco do campo aparece no contêiner (o campo não tem contorno próprio).
        className="flex h-10 overflow-hidden rounded-md bg-surface-3 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring"
        onSubmit={(e) => {
          e.preventDefault()
          setFeedback(
            Email.safeParse(email.trim()).success
              ? {
                  kind: 'info',
                  text: 'A inscrição na newsletter não está disponível nesta demonstração.',
                }
              : {
                  kind: 'error',
                  text: email.trim() ? 'Informe um e-mail válido.' : 'Informe seu e-mail.',
                },
          )
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          E-mail para receber novidades
        </label>
        <input
          id={inputId}
          maxLength={254}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="digite seu e-mail..."
          aria-invalid={feedback?.kind === 'error' || undefined}
          aria-describedby={feedback ? feedbackId : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-text-3"
        />
        <button
          type="submit"
          className="bg-primary px-4 text-lg leading-4 font-bold text-primary-foreground hover:bg-highlight"
        >
          Enviar
        </button>
      </form>
      <p
        id={feedbackId}
        role={feedback?.kind === 'error' ? 'alert' : 'status'}
        className={feedback?.kind === 'error' ? 'text-xs text-danger' : 'text-xs text-text-2'}
      >
        {feedback?.text}
      </p>
      <p className="text-[13px] leading-[22px] text-text-2">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </div>
  )
}
