import { prisma } from "../../config/database.js";
import type { Role } from "@prisma/client";

export const authRepository = {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  },

  async createUser(data: { email: string; passwordHash: string; role: Role; name: string }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        isVerified: false,
        profile: {
          create: { name: data.name },
        },
      },
      include: { profile: true },
    });
  },

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  },

  async createSession(data: { userId: string; refreshToken: string; expiresAt: Date; userAgent?: string; ipAddress?: string }) {
    return prisma.session.create({ data });
  },

  async findSessionByToken(refreshToken: string) {
    return prisma.session.findUnique({
      where: { refreshToken },
      include: { user: { include: { profile: true } } },
    });
  },

  async deleteSession(id: string) {
    return prisma.session.delete({ where: { id } });
  },

  async deleteSessionByToken(refreshToken: string) {
    return prisma.session.deleteMany({ where: { refreshToken } });
  },

  async deleteAllUserSessions(userId: string) {
    return prisma.session.deleteMany({ where: { userId } });
  },
};
