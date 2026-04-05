import { nanoid } from "nanoid";
import type { PublicRoom, Room } from "../types";

type CreateRoomInput = {
  name: string;
  hostId: string;
  isPublic: boolean;
  passwordHash?: string;
};

class RoomStore {
  private readonly rooms = new Map<string, Room>();

  constructor() {
    const seeds: Room[] = [
      {
        id: "night-vibes",
        name: "Đêm Chậm Rãi",
        hostId: "seed-host-1",
        isPublic: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "focus-room",
        name: "WFH Focus Room",
        hostId: "seed-host-2",
        isPublic: true,
        createdAt: new Date().toISOString()
      }
    ];
    seeds.forEach((room) => this.rooms.set(room.id, room));
  }

  list(): PublicRoom[] {
    return Array.from(this.rooms.values()).map(({ passwordHash: _passwordHash, ...room }) => room);
  }

  get(id: string): PublicRoom | null {
    const room = this.rooms.get(id);
    if (!room) return null;
    const { passwordHash: _passwordHash, ...publicRoom } = room;
    return publicRoom;
  }

  create(input: CreateRoomInput): PublicRoom {
    const id = nanoid(10);
    const room: Room = {
      id,
      name: input.name,
      hostId: input.hostId,
      isPublic: input.isPublic,
      passwordHash: input.passwordHash,
      createdAt: new Date().toISOString()
    };
    this.rooms.set(room.id, room);
    const { passwordHash: _passwordHash, ...publicRoom } = room;
    return publicRoom;
  }

  remove(id: string): boolean {
    return this.rooms.delete(id);
  }
}

export const roomStore = new RoomStore();

