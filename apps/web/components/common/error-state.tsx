type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-rose-300/30 bg-rose-950/10 p-6 text-center">
      <p className="text-3xl" aria-hidden>
        ⚠️
      </p>
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold"
        >
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

