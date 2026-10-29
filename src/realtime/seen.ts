/** Conjunto limitado de ids já processados (descarta duplicatas sem crescer para sempre). */
export class SeenSet {
  private readonly ids = new Set<string>()
  private readonly limit: number

  constructor(limit = 500) {
    this.limit = limit
  }

  has(id: string): boolean {
    return this.ids.has(id)
  }

  add(id: string): void {
    this.ids.add(id)
    if (this.ids.size > this.limit) {
      const oldest = this.ids.values().next().value
      if (oldest !== undefined) this.ids.delete(oldest)
    }
  }
}
