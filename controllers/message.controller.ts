// controllers/message.controller.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =====================================
// SEND MESSAGE
// =====================================
export const sendMessage = async (
  req: Request,
  res: Response
) => {
  try {
    const senderId = BigInt(String(req.user.id));

    const {
      roomId,
      content,
      file,
    }: {
      roomId: string;
      content: string;
      file?: string;
    } = req.body;

    // check room membership
    const member =
      await prisma.chatRoomMember.findFirst({
        where: {
          roomId: BigInt(roomId),
          userId: senderId,
        },
      });

    if (!member) {
      return res.status(403).json({
        message: "Not a room member",
      });
    }

    const message = await prisma.message.create({
      data: {
        content,
        file,
        timestamp: new Date(),
        updatedAt: new Date(),
        isEdited: false,

        roomId: BigInt(roomId),
        senderId,
      },

      include: {
        sender: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================
// ROOM MESSAGES
// =====================================
export const getRoomMessages = async (
  req: Request,
  res: Response
) => {
  try {
    const roomId = BigInt(String(req.params.roomId));

    const userId = BigInt(String(req.user.id));

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    // check membership
    const member =
      await prisma.chatRoomMember.findFirst({
        where: {
          roomId,
          userId,
        },
      });

    if (!member) {
      return res.status(403).json({
        message: "Not allowed",
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        roomId,
      },

      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },

        readStatuses: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },

      orderBy: {
        timestamp: "desc",
      },

      skip,
      take: limit,
    });

    return res.status(200).json({
      page,
      limit,
      results: messages,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================
// MESSAGE DETAIL
// =====================================
export const getMessageDetail = async (
  req: Request,
  res: Response
) => {
  try {
    const messageId = BigInt(
      String(req.params.messageId)
    );

    const userId = BigInt(String(req.user.id));

    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
      },

      include: {
        room: true,

        sender: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },

        readStatuses: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // verify room membership
    const member =
      await prisma.chatRoomMember.findFirst({
        where: {
          roomId: message.roomId,
          userId,
        },
      });

    if (!member) {
      return res.status(403).json({
        message: "Not allowed",
      });
    }

    return res.status(200).json(message);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================
// UPDATE MESSAGE
// =====================================
export const updateMessage = async (
  req: Request,
  res: Response
) => {
  try {
    const messageId = BigInt(
      String(req.params.messageId)
    );

    const userId = BigInt(String(req.user.id));

    const { content } = req.body;

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
      },
    });

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    const updatedMessage =
      await prisma.message.update({
        where: {
          id: messageId,
        },

        data: {
          content,
          isEdited: true,
          updatedAt: new Date(),
        },
      });

    return res.status(200).json({
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================
// DELETE MESSAGE
// =====================================
export const deleteMessage = async (
  req: Request,
  res: Response
) => {
  try {
    const messageId = BigInt(
      String(req.params.messageId)
    );

    const userId = BigInt(String(req.user.id));

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
      },
    });

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    await prisma.message.delete({
      where: {
        id: messageId,
      },
    });

    return res.status(200).json({
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================
// MARK MESSAGE AS READ
// =====================================
export const markMessageAsRead = async (
  req: Request,
  res: Response
) => {
  try {
    const messageId = BigInt(
      String(req.params.messageId)
    );

    const userId = BigInt(String(req.user.id));

    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // check existing status
    const existing =
      await prisma.messageReadStatus.findFirst({
        where: {
          messageId,
          userId,
        },
      });

    if (existing) {
      return res.status(200).json({
        message: "Already marked as read",
      });
    }

    await prisma.messageReadStatus.create({
      data: {
        messageId,
        userId,
        readAt: new Date(),
      },
    });

    return res.status(201).json({
      message: "Message marked as read",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};