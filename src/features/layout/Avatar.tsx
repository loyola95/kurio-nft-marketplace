import type { User } from '@/contracts/auth'

export function Avatar({
  user,
  size = 32,
}: {
  user: Pick<User, 'displayName' | 'avatarUrl'>
  size?: number
}) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  const initial = user.displayName.trim().charAt(0).toUpperCase() || 'K'
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  )
}
