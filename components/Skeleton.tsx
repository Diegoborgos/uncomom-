export function CardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] animate-pulse">
      <div className="aspect-[16/10] bg-[var(--surface-elevated)]" />
      <div className="p-4 space-y-3">
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-[var(--surface-elevated)]" />
          <div className="h-5 w-16 rounded-full bg-[var(--surface-elevated)]" />
          <div className="h-5 w-16 rounded-full bg-[var(--surface-elevated)]" />
        </div>
        <div className="h-4 w-40 rounded bg-[var(--surface-elevated)]" />
        <div className="h-4 w-32 rounded bg-[var(--surface-elevated)]" />
      </div>
    </div>
  )
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
