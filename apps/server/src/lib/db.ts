import { PrismaClient } from "@prisma/client";
import { config } from "../config";

let prismaClient: PrismaClient | null = null;

export const isDatabaseConfigured = () => Boolean(config.databaseUrl);

export const getPrismaClient = () => {
  if (!isDatabaseConfigured()) {
    return null;
  }
  if (prismaClient) {
    return prismaClient;
  }

  prismaClient = new PrismaClient();
  return prismaClient;
};

