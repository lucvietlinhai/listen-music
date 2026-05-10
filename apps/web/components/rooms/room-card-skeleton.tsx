export function RoomCardSkeleton() {
  return (
    <article className="glass-subtle overflow-hidden rounded-[20px] p-3 animate-pulse">
      <div className="aspect-square w-full rounded-2xl bg-surface" />
      <div className="mt-4 px-1 pb-2 space-y-3">
        <div className="h-5 w-3/4 rounded-md bg-surface" />
        <div className="h-4 w-full rounded-md bg-surface" />
        <div className="h-3 w-1/2 rounded-md bg-surface" />
      </div>
    </article>
  );
}

