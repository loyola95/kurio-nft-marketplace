import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { useCartCount } from '@/features/cart/useCartCount'

export function CartLink() {
  const count = useCartCount()
  const label = count > 0 ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho'
  return (
    <Link
      to="/carrinho"
      aria-label={label}
      className="relative grid h-8 w-[31px] place-items-center hover:text-highlight"
    >
      <Icon name="cart" size={24} />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-1 -right-0.5 grid size-4 place-items-center rounded-full border-2 border-background bg-primary text-[10px] leading-[13px] font-medium text-primary-foreground"
        >
          {count > 99 ? '99' : count}
        </span>
      )}
    </Link>
  )
}
