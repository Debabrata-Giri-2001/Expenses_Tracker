// src/middleware/socketAuth.ts
import { Socket } from "socket.io";
import JWT from "jsonwebtoken";
import user from "../model/UserSchema";
import ErrorHandler from "../utils/errorHnadeler";

interface DecodedData {
  id: string;
}

export const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = JWT.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedData;
    const User = await user.findById(decoded.id);

    if (!User) {
      return next(new Error("Authentication error: User not found"));
    }

    // Attach user to socket for later use
    socket.data.user = User;
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
};
