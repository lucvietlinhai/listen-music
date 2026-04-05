export function RoomCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-card animate-pulse">
      <div className="h-36 w-full bg-surface" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-surface" />
        <div className="h-3 w-full rounded bg-surface" />
        <div className="h-3 w-2/3 rounded bg-surface" />
        <div className="h-9 w-24 rounded-lg bg-surface" />
      </div>
    </article>
  );
}

