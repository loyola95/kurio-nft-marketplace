import * as React from 'react'
import { cn } from '@/lib/utils'

// Campos do Figma: 40 px de altura, borda #3f2319, raio 5 px, placeholder #b39463.
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-[5px] border border-input bg-transparent px-4 text-sm text-foreground transition-colors outline-none placeholder:text-text-3 focus-visible:border-highlight disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
