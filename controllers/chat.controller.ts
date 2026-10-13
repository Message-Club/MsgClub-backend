// controllers/chat.controller.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =====================================
// CREATE ROOM
// =====================================
export const createRoom = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = BigInt(req.user.id);

    const {
      name,
      isGroup,
      members,
    }: {
      name?: string;
      isGroup: boolean;
      members: number[];
    } = req.body;

    if (!Array.isArray(members)) {
      return res.status(400).json({
        message: "Members must be an array",
      });
    }

    const room = await prisma.chatRoom.create({
      data: {
        name,
        isGroup,

        members: {
          create: [
            // creator as admin
            {
              userId,
              role: "admin",
              joinedAt: new Date(),
            },

            // other members
            ...members
              .filter(
                (memberId) =>
                  BigInt(memberId) !== userId
              )
              .map((memberId) => ({
                userId: BigInt(memberId),
                role: "member",
                joinedAt: new Date(),
              })),
          ],
        },
      },

      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================
// ADD USERS TO ROOM
// =====================================
export const addUsersToRoom = async (
  req: Request,
  res: Response
) => {
  try {
    const roomId = BigInt(String(req.params.id));

    const currentUserId = BigInt(req.user.id);

    const { members }: { members: number[] } =
      req.body;

    if (!Array.isArray(members) || !members.length) {
      return res.status(400).json({
        message: "Members list cannot be empty",
      });
    }

    const room = await prisma.chatRoom.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    // check membership
    const existingMember =
      await prisma.chatRoomMember.findFirst({
        where: {
          roomId,
          userId: currentUserId,
        },
      });

    if (!existingMember) {
      return res.status(403).json({
        message: "Not allowed",
      });
    }

    // get existing user ids
    const existingUsers =
      await prisma.chatRoomMember.findMany({
        where: {
          roomId,
        },
        select: {
          userId: true,
        },
      });

    const existingUserIds = new Set(
      existingUsers.map((u) => u.userId.toString())
    );

    const newMembers = members
      .filter(
        (id) =>
          !existingUserIds.has(id.toString())
      )
      .map((id) => ({
        roomId,
        userId: BigInt(id),
        role: "member",
        joinedAt: new Date(),
      }));

    if (newMembers.length > 0) {
      await prisma.chatRoomMember.createMany({
        data: newMembers,
      });
    }

    return res.status(200).json({
      message: "Members added successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================
// USER ROOMS
// =====================================
export const getUserRooms = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = BigInt(req.user.id);

    const rooms = await prisma.chatRoom.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },

      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(rooms);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================
// ROOM DETAIL
// =====================================
export const getRoomDetail = async (
  req: Request,
  res: Response
) => {
  try {
    const roomId = BigInt(String(req.params.id));

    const userId = BigInt(req.user.id);

    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,

        members: {
          some: {
            userId,
          },
        },
      },

      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    return res.status(200).json(room);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================
// UPDATE ROOM
// =====================================
export const updateRoom = async (
  req: Request,
  res: Response
) => {
  try {
    const roomId = BigInt(String(req.params.id));

    const userId = BigInt(req.user.id);

    const { name, isGroup } = req.body;

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

    const room = await prisma.chatRoom.update({
      where: {
        id: roomId,
      },

      data: {
        name,
        isGroup,
      },
    });

    return res.status(200).json({
      message: "Room updated successfully",
      room,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================
// DELETE ROOM
// =====================================
export const deleteRoom = async (
  req: Request,
  res: Response
) => {
  try {
    const roomId = BigInt(String(req.params.id));

    const userId = BigInt(req.user.id);

    // only admin can delete
    const admin =
      await prisma.chatRoomMember.findFirst({
        where: {
          roomId,
          userId,
          role: "admin",
        },
      });

    if (!admin) {
      return res.status(403).json({
        message: "Only admin can delete room",
      });
    }

    await prisma.chatRoom.delete({
      where: {
        id: roomId,
      },
    });

    return res.status(200).json({
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};