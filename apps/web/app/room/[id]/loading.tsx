export default function RoomLoading() {
  return (
    <main className="min-h-screen bg-bg px-4 py-6">
      <div className="mx-auto w-full max-w-7xl animate-pulse space-y-4">
        <div className="h-14 rounded-xl bg-surface" />
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="hidden h-[70vh] rounded-2xl bg-card lg:col-span-3 lg:block" />
          <div className="h-[70vh] rounded-2xl bg-card lg:col-span-6" />
          <div className="h-[70vh] rounded-2xl bg-card lg:col-span-3" />
        </div>
      </div>
    </main>
  );
}

