import type { Room } from "./types";

type RoomCardProps = {
  room: Room;
  onJoin: (room: Room) => void;
};

export function RoomCard({ room, onJoin }: RoomCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-card transition hover:-translate-y-0.5 hover:border-accent/70">
      <div className="relative h-36 w-full">
        <img src={room.thumbnail} alt={room.currentSong} className="h-full w-full object-cover" />
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-tight">{room.name}</h3>
          <span className="rounded-full border border-line bg-surface px-2 py-1 text-xs text-muted">
            {room.listeners} người nghe
          </span>
        </div>

        <p className="truncate text-sm font-semibold text-text">{room.currentSong}</p>
        <p className="truncate text-sm text-muted">{room.channelName}</p>

        <div className="mt-4 flex items-center justify-between">
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              room.isPrivate
                ? "bg-amber-400/15 text-amber-200"
                : "bg-emerald-400/15 text-emerald-200"
            }`}
          >
            {room.isPrivate ? "Phòng riêng tư" : "Phòng công khai"}
          </span>
          <button
            onClick={() => onJoin(room)}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-bold text-slate-950 transition hover:brightness-110"
          >
            Tham gia
          </button>
        </div>
      </div>
    </article>
  );
}
