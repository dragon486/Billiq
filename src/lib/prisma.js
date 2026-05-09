import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  (process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : (globalForPrisma.prisma || new PrismaClient()));

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
