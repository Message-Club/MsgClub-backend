import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET as string;

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization;

    if (!token) {
      return next(
        new Error("Authentication token missing")
      );
    }

    // remove Bearer if exists
    const formattedToken = token.startsWith(
      "Bearer "
    )
      ? token.split(" ")[1]
      : token;

    const decoded = jwt.verify(
      formattedToken,
      ACCESS_SECRET
    ) as jwt.JwtPayload;

    socket.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    next(new Error("Unauthorized"));
  }
};
