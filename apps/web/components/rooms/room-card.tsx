import { Play, Lock, Unlock, Users } from "lucide-react";
import type { Room } from "./types";

type RoomCardProps = {
  room: Room;
  onJoin: (room: Room) => void;
};

export function RoomCard({ room, onJoin }: RoomCardProps) {
  return (
    <article 
      onClick={() => onJoin(room)}
      className="glass-subtle group relative overflow-hidden rounded-[20px] p-3 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04] hover:shadow-glow-teal cursor-pointer"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        <img src={room.thumbnail} alt={room.currentSong} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        
        {/* Hover Play Button */}
        <div className="absolute bottom-4 right-4 z-20 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black shadow-glow-teal hover:scale-105">
            <Play className="h-5 w-5 ml-1" fill="currentColor" />
          </button>
        </div>

        <div className="absolute top-3 right-3 z-20">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white">
            {room.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </span>
        </div>
      </div>

      <div className="mt-4 px-1 pb-2">
        <h3 className="text-base font-bold text-text line-clamp-1">{room.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm font-semibold text-accent">{room.currentSong}</p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{room.channelName}</p>
        
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
          <span className="status-dot connected" />
          <span>{room.listeners} listening</span>
        </div>
      </div>
    </article>
  );
}
