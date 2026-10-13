import { Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { io } from "../configs/socket.config.js";

const prisma = new PrismaClient();

export const registerChatHandlers = (
    socket: Socket
) => {
    // =========================
    // JOIN ROOM
    // =========================
    socket.on(
        "join_room",
        async (roomId: string) => {
            const member =
                await prisma.chatRoomMember.findFirst({
                    where: {
                        roomId: BigInt(roomId),

                        userId: BigInt(
                            String(socket.user?.id)
                        ),
                    },
                });

            if (!member) {
                socket.emit("error_message", {
                    message: "Access denied",
                });

                return;
            }

            socket.join(roomId);

            console.log(
                `Socket ${socket.id} joined room ${roomId}`
            );
        }
    );

    // =========================
    // LEAVE ROOM
    // =========================
    socket.on(
        "leave_room",
        (roomId: string) => {
            socket.leave(roomId);

            console.log(
                `Socket ${socket.id} left room ${roomId}`
            );
        }
    );

    // =========================
    // SEND MESSAGE
    // =========================
    socket.on(
        "send_message",
        async (data) => {
            try {
                const { roomId, content, file } =
                    data;

                const senderId = BigInt(
                    String(socket.user?.id)
                );

                // verify membership
                const member =
                    await prisma.chatRoomMember.findFirst({
                        where: {
                            roomId: BigInt(roomId),
                            userId: senderId,
                        },
                    });

                if (!member) {
                    socket.emit("error_message", {
                        message: "Not a room member",
                    });

                    return;
                }

                const message =
                    await prisma.message.create({
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
                                    username: true,
                                    email: true,
                                },
                            },
                        },
                    });

                // FIX BIGINT
                const formattedMessage = {
                    ...message,

                    id: message.id.toString(),

                    roomId:
                        message.roomId.toString(),

                    senderId:
                        message.senderId.toString(),

                    sender: {
                        ...message.sender,

                        id:
                            message.sender.id.toString(),
                    },
                };

                io.to(roomId).emit(
                    "receive_message",
                    formattedMessage
                );
            } catch (error) {
                console.error(error);

                socket.emit("error_message", {
                    message: "Server error",
                });
            }
        }
    );
};