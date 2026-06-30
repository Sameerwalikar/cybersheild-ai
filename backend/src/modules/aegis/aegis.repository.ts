import { prisma } from "../../config/database.js";

export const aegisRepository = {
  async getConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
    });
  },

  async getConversation(id: string, userId: string) {
    return prisma.conversation.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  },

  async createConversation(userId: string, title?: string) {
    return prisma.conversation.create({
      data: { userId, title: title || "New Chat" },
      include: { messages: true },
    });
  },

  async updateConversation(id: string, userId: string, data: { title?: string }) {
    return prisma.conversation.updateMany({ where: { id, userId }, data });
  },

  async deleteConversation(id: string, userId: string) {
    return prisma.conversation.deleteMany({ where: { id, userId } });
  },

  async addMessage(conversationId: string, role: string, content: string, metadata?: any) {
    const msg = await prisma.message.create({
      data: { conversationId, role, content, metadata },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return msg;
  },

  async getRecentContext(userId: string) {
    const [recentScans, recentNotifs, recentReports] = await Promise.all([
      prisma.threatScan.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { analysis: true },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.threatReport.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    return { recentScans, recentNotifs, recentReports };
  },
};
