import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export function createToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    env.jwtSecret,
    {
      expiresIn: "7d",
    },
  );
}

export function verifyToken(
  token: string,
): AuthUser {
  return jwt.verify(
    token,
    env.jwtSecret,
  ) as AuthUser;
}