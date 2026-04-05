"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ErrorState } from "@/components/common/error-state";
import { CreateRoomModal } from "@/components/rooms/create-room-modal";
import { EmptyState } from "@/components/rooms/empty-state";
import { JoinPrivateModal } from "@/components/rooms/join-private-modal";
import { mockRooms } from "@/components/rooms/mock-rooms";
import { RoomCard } from "@/components/rooms/room-card";
import { RoomCardSkeleton } from "@/components/rooms/room-card-skeleton";
import type { Room } from "@/components/rooms/types";

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

    const timer = setTimeout(() => {
      setRooms(mockRooms);
      setIsLoading(false);
    }, 850);

    return () => clearTimeout(timer);
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
        onSubmit={() => {
          setCreateModalOpen(false);
          router.push("/room/mock-id");
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
