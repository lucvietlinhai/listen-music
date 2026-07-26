export function ClayBlobs({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 -z-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="clay-blob w-72 h-72 bg-[var(--clay-pink)] -top-20 -left-20 animate-[float_8s_ease-in-out_infinite]" />
      <div className="clay-blob w-56 h-56 bg-[var(--clay-mint)] top-40 -right-16 animate-[float_10s_ease-in-out_infinite_1s]" />
      <div className="clay-blob w-40 h-40 bg-[var(--clay-peach)] bottom-10 left-1/3 animate-[float_12s_ease-in-out_infinite_2s]" />
    </div>
  );
}

export function BlobDecoration({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <div className="clay-blob w-72 h-72 bg-[var(--clay-pink)] -top-20 -left-20 animate-[float_8s_ease-in-out_infinite]" />
      <div className="clay-blob w-56 h-56 bg-[var(--clay-mint)] top-40 -right-16 animate-[float_10s_ease-in-out_infinite_1s]" />
      <div className="clay-blob w-40 h-40 bg-[var(--clay-peach)] bottom-10 left-1/3 animate-[float_12s_ease-in-out_infinite_2s]" />
    </div>
  );
}

export function SmallBlob({ color = "var(--clay-pink)", size = 120, className = "" }: { color?: string; size?: number; className?: string }) {
  return (
    <div
      className={`clay-blob animate-[float_8s_ease-in-out_infinite] ${className}`}
      style={{ width: size, height: size, background: color }}
      aria-hidden="true"
    />
  );
}
