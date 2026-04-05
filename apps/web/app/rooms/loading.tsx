import { RoomCardSkeleton } from "@/components/rooms/room-card-skeleton";

export default function RoomsLoading() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <RoomCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}

