export const orderKeys = {
  all: (userId: string) => ['user', userId, 'orders'] as const,
  detail: (userId: string, id: string) => ['user', userId, 'orders', id] as const,
  pending: (userId: string) => ['user', userId, 'orders', 'pending'] as const,
}
