type EmptyStateProps = {
  onCreateRoom: () => void;
};

export function EmptyState({ onCreateRoom }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card p-8 text-center">
      <p className="text-3xl">🎧</p>
      <h2 className="mt-3 text-xl font-bold">Chưa có phòng nào đang mở</h2>
      <p className="mt-2 text-sm text-muted">
        Hãy tạo phòng đầu tiên và mời bạn bè vào nghe nhạc cùng bạn.
      </p>
      <button
        onClick={onCreateRoom}
        className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-slate-950"
      >
        Tạo phòng ngay
      </button>
    </div>
  );
}

