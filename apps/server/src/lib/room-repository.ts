import { nanoid } from "nanoid";
import { getPrismaClient, isDatabaseConfigured } from "./db";
import type { PublicRoom, Room } from "../types";

type CreateRoomInput = {
  name: string;
  hostId: string;
  isPublic: boolean;
  passwordHash?: string;
};

type RoomRepository = {
  mode: "memory" | "prisma";
  list: () => Promise<PublicRoom[]>;
  get: (id: string) => Promise<PublicRoom | null>;
  create: (input: CreateRoomInput) => Promise<PublicRoom>;
  remove: (id: string) => Promise<boolean>;
};

class MemoryRoomRepository implements RoomRepository {
  readonly mode = "memory" as const;
  private readonly rooms = new Map<string, Room>();

  constructor() {
    const seeds: Room[] = [
      {
        id: "night-vibes",
        name: "Dem Cham Rai",
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

  async list(): Promise<PublicRoom[]> {
    return Array.from(this.rooms.values()).map(({ passwordHash: _passwordHash, ...room }) => room);
  }

  async get(id: string): Promise<PublicRoom | null> {
    const room = this.rooms.get(id);
    if (!room) return null;
    const { passwordHash: _passwordHash, ...publicRoom } = room;
    return publicRoom;
  }

  async create(input: CreateRoomInput): Promise<PublicRoom> {
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

  async remove(id: string): Promise<boolean> {
    return this.rooms.delete(id);
  }
}

class PrismaRoomRepository implements RoomRepository {
  readonly mode = "prisma" as const;

  async list(): Promise<PublicRoom[]> {
    const prisma = getPrismaClient();
    if (!prisma) {
      return [];
    }
    const rows = await prisma.room.findMany({
      orderBy: { createdAt: "desc" }
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      hostId: row.hostId,
      isPublic: row.isPublic,
      createdAt: row.createdAt.toISOString()
    }));
  }

  async get(id: string): Promise<PublicRoom | null> {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    const row = await prisma.room.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      hostId: row.hostId,
      isPublic: row.isPublic,
      createdAt: row.createdAt.toISOString()
    };
  }

  async create(input: CreateRoomInput): Promise<PublicRoom> {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("DATABASE_NOT_CONFIGURED");
    }

    const row = await prisma.room.create({
      data: {
        name: input.name,
        hostId: input.hostId,
        isPublic: input.isPublic,
        passwordHash: input.passwordHash
      }
    });

    return {
      id: row.id,
      name: row.name,
      hostId: row.hostId,
      isPublic: row.isPublic,
      createdAt: row.createdAt.toISOString()
    };
  }

  async remove(id: string): Promise<boolean> {
    const prisma = getPrismaClient();
    if (!prisma) return false;

    const deleted = await prisma.room.deleteMany({ where: { id } });
    return deleted.count > 0;
  }
}

const memoryRepo = new MemoryRoomRepository();
const prismaRepo = new PrismaRoomRepository();

export const roomRepository: RoomRepository = isDatabaseConfigured() ? prismaRepo : memoryRepo;

