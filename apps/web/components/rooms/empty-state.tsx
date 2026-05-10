type EmptyStateProps = {
  onCreateRoom: () => void;
};

export function EmptyState({ onCreateRoom }: EmptyStateProps) {
  return (
    <div className="glass-subtle flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-3xl">
        🎧
      </div>
      <h2 className="mt-5 text-xl font-bold tracking-tight text-text">No active rooms found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Create the first room and invite your colleagues to listen together.
      </p>
      <button
        onClick={onCreateRoom}
        className="btn-primary mt-6 px-6"
      >
        + Create Room
      </button>
    </div>
  );
}

