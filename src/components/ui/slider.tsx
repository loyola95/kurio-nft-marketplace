import * as React from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

// Slider do filtro de preço do Figma: trilho laranja de 4 px e alças de 15 px
// com borda escura. Cada alça recebe rótulo e valor em texto para leitores de tela.
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbLabels,
  getValueText,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  thumbLabels?: string[]
  getValueText?: (value: number) => string
}) {
  const values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 grow overflow-hidden rounded-full bg-primary/40">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((v, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={thumbLabels?.[index]}
          aria-valuetext={getValueText?.(v)}
          className="block size-[15px] rounded-full border-[3px] border-background bg-primary outline-none after:absolute after:-inset-3 focus-visible:ring-2 focus-visible:ring-highlight"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
