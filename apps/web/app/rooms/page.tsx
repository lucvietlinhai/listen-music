"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ErrorState } from "@/components/common/error-state";
import { CreateRoomModal } from "@/components/rooms/create-room-modal";
import { EmptyState } from "@/components/rooms/empty-state";
import { JoinPrivateModal } from "@/components/rooms/join-private-modal";
import { RoomCard } from "@/components/rooms/room-card";
import { RoomCardSkeleton } from "@/components/rooms/room-card-skeleton";
import type { ApiRoom, Room } from "@/components/rooms/types";
import { createRoom, fetchRooms } from "@/lib/api";

const defaultSongs = [
  { title: "Nơi Này Có Anh", channel: "Sơn Tùng M-TP" },
  { title: "Bước Qua Mùa Cô Đơn", channel: "Vũ" },
  { title: "Waiting For You", channel: "MONO" },
  { title: "Có Chàng Trai Viết Lên Cây", channel: "Phan Mạnh Quỳnh" }
];

const defaultThumbnails = [
  "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80"
];

const mapApiRoomToUi = (room: ApiRoom, index: number): Room => {
  const song = defaultSongs[index % defaultSongs.length];
  const thumbnail = defaultThumbnails[index % defaultThumbnails.length];

  return {
    id: room.id,
    name: room.name,
    currentSong: song.title,
    channelName: song.channel,
    listeners: (index % 9) + 2,
    isPrivate: !room.isPublic,
    thumbnail
  };
};

export default function RoomsPage() {
  const router = useRouter();
  const { user, requestLogin } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [privateRoom, setPrivateRoom] = useState<Room | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "1") {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const loadRooms = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const apiRooms = await fetchRooms();
        setRooms(apiRooms.map(mapApiRoomToUi));
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRooms();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "1") {
      if (!user) {
        requestLogin({ message: "Đăng nhập để tạo phòng mới." }, () => setCreateModalOpen(true));
      } else {
        setCreateModalOpen(true);
      }
    }
  }, [requestLogin, user]);

  const showEmpty = useMemo(() => !isLoading && rooms.length === 0, [isLoading, rooms.length]);

  const openCreateFlow = () => {
    if (!user) {
      requestLogin(
        { message: "Đăng nhập để tạo phòng và mời bạn bè tham gia." },
        () => setCreateModalOpen(true)
      );
      return;
    }
    setCreateModalOpen(true);
  };

  const handleJoin = (room: Room) => {
    if (room.isPrivate) {
      setPrivateRoom(room);
      return;
    }
    router.push(`/room/${room.id}`);
  };

  return (
    <>
      <main className="min-h-screen bg-bg">
        <header className="border-b border-line/70">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <Link href="/" className="text-lg font-extrabold">
                Listen<span className="text-accent">WithMe</span>
              </Link>
              <p className="text-sm text-muted">Khám phá phòng công khai đang hoạt động</p>
            </div>
            <button
              onClick={openCreateFlow}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-slate-950"
            >
              + Tạo phòng
            </button>
          </div>
        </header>

        <section className="mx-auto w-full max-w-6xl px-4 py-8">
          {hasError ? (
            <ErrorState
              title="Không thể tải danh sách phòng"
              message="Kết nối tạm thời không ổn định. Vui lòng thử lại."
              onRetry={() => window.location.assign("/rooms")}
            />
          ) : null}

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <RoomCardSkeleton key={index} />
              ))}
            </div>
          ) : null}

          {!hasError && showEmpty ? <EmptyState onCreateRoom={openCreateFlow} /> : null}

          {!hasError && !isLoading && !showEmpty ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} onJoin={handleJoin} />
              ))}
            </div>
          ) : null}
        </section>
      </main>

      <CreateRoomModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={async (payload) => {
          try {
            const room = await createRoom({
              name: payload.name,
              isPublic: !payload.isPrivate,
              password: payload.password
            });
            setCreateModalOpen(false);
            router.push(`/room/${room.id}`);
          } catch {
            setHasError(true);
          }
        }}
      />

      <JoinPrivateModal
        open={Boolean(privateRoom)}
        roomName={privateRoom?.name ?? ""}
        onClose={() => setPrivateRoom(null)}
        onSubmit={() => {
          const nextRoomId = privateRoom?.id ?? "mock-id";
          setPrivateRoom(null);
          router.push(`/room/${nextRoomId}`);
        }}
      />
    </>
  );
}
