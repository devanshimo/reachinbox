import {
  Request,
  Response,
  NextFunction,
} from "express";
import { verifyToken } from "../lib/auth";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired session",
    });
  }
}