import { JwtPayload } from "jsonwebtoken";

declare module "socket.io" {
  interface Socket {
    user?: JwtPayload & {
      id: string;
      email: string;
    };
  }
}