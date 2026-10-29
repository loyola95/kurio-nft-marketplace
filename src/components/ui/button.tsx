import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

// Botões do Figma: fundo #d28a4c, texto #140d0a em negrito, raio 5 a 6 px.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent font-bold whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-highlight',
        outline:
          'border-border bg-transparent text-text-2 hover:border-primary hover:text-foreground',
        secondary: 'bg-surface-2 text-foreground hover:bg-surface-3',
        ghost: 'text-foreground hover:bg-surface-2',
        destructive: 'border-danger/60 bg-transparent text-danger hover:bg-danger/10',
        link: 'h-auto p-0 font-normal text-highlight underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-7 text-base',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-[45px] px-8 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
