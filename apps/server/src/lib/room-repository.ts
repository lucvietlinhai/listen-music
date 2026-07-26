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
  getByHostId: (hostId: string) => Promise<PublicRoom | null>;
  create: (input: CreateRoomInput) => Promise<PublicRoom>;
  remove: (id: string) => Promise<boolean>;
  /**
   * Verify a room password.
   * Returns null if the room does not exist, true if the password matches
   * (or the room has no password set), false otherwise.
   */
  verifyPassword: (id: string, password: string) => Promise<boolean | null>;
};

export const hashPassword = (password: string) => `mock_hash_${password}`;

class MemoryRoomRepository implements RoomRepository {
  readonly mode = "memory" as const;
  private readonly rooms = new Map<string, Room>();

  async list(): Promise<PublicRoom[]> {
    return Array.from(this.rooms.values()).map(({ passwordHash: _passwordHash, ...room }) => room);
  }

  async get(id: string): Promise<PublicRoom | null> {
    const room = this.rooms.get(id);
    if (!room) return null;
    const { passwordHash: _passwordHash, ...publicRoom } = room;
    return publicRoom;
  }

  async getByHostId(hostId: string): Promise<PublicRoom | null> {
    const room = Array.from(this.rooms.values()).find(r => r.hostId === hostId);
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

  async verifyPassword(id: string, password: string): Promise<boolean | null> {
    const room = this.rooms.get(id);
    if (!room) return null;
    if (!room.passwordHash) return true;
    return room.passwordHash === hashPassword(password);
  }
}

class PrismaRoomRepository implements RoomRepository {
  readonly mode = "prisma" as const;

  async list(): Promise<PublicRoom[]> {
    const prisma = getPrismaClient();
    if (!prisma) {
      return memoryRepo.list();
    }
    try {
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
    } catch (error) {
      console.error("roomRepository.list fallback to memory", error);
      return memoryRepo.list();
    }
  }

  async get(id: string): Promise<PublicRoom | null> {
    const prisma = getPrismaClient();
    if (!prisma) return memoryRepo.get(id);

    try {
      const row = await prisma.room.findUnique({ where: { id } });
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        hostId: row.hostId,
        isPublic: row.isPublic,
        createdAt: row.createdAt.toISOString()
      };
    } catch (error) {
      console.error("roomRepository.get fallback to memory", error);
      return memoryRepo.get(id);
    }
  }

  async getByHostId(hostId: string): Promise<PublicRoom | null> {
    const prisma = getPrismaClient();
    if (!prisma) return memoryRepo.getByHostId(hostId);

    try {
      const row = await prisma.room.findFirst({
        where: { hostId },
        orderBy: { createdAt: 'desc' }
      });
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        hostId: row.hostId,
        isPublic: row.isPublic,
        createdAt: row.createdAt.toISOString()
      };
    } catch (error) {
      console.error("roomRepository.getByHostId fallback to memory", error);
      return memoryRepo.getByHostId(hostId);
    }
  }

  async create(input: CreateRoomInput): Promise<PublicRoom> {
    const prisma = getPrismaClient();
    if (!prisma) {
      return memoryRepo.create(input);
    }

    try {
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
    } catch (error) {
      console.error("roomRepository.create fallback to memory", error);
      return memoryRepo.create(input);
    }
  }

  async remove(id: string): Promise<boolean> {
    const prisma = getPrismaClient();
    if (!prisma) return memoryRepo.remove(id);

    try {
      const deleted = await prisma.room.deleteMany({ where: { id } });
      return deleted.count > 0;
    } catch (error) {
      console.error("roomRepository.remove fallback to memory", error);
      return memoryRepo.remove(id);
    }
  }

  async verifyPassword(id: string, password: string): Promise<boolean | null> {
    const prisma = getPrismaClient();
    if (!prisma) return memoryRepo.verifyPassword(id, password);

    try {
      const row = await prisma.room.findUnique({ where: { id } });
      if (!row) return null;
      if (!row.passwordHash) return true;
      return row.passwordHash === hashPassword(password);
    } catch (error) {
      console.error("roomRepository.verifyPassword fallback to memory", error);
      return memoryRepo.verifyPassword(id, password);
    }
  }
}

const memoryRepo = new MemoryRoomRepository();
const prismaRepo = new PrismaRoomRepository();

export const roomRepository: RoomRepository = isDatabaseConfigured() ? prismaRepo : memoryRepo;
