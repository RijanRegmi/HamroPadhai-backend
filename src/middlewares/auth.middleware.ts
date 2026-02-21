import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { UserRepository } from "../repositories/user.repository";

const userRepository = new UserRepository();

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // ✅ Fetch user to check passwordChangedAt
    const user = await userRepository.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ If password was changed after this token was issued → force re-login
    if (user.passwordChangedAt) {
      const passwordChangedTime = Math.floor(
        new Date(user.passwordChangedAt).getTime() / 1000
      );
      if (decoded.iat < passwordChangedTime) {
        return res.status(401).json({
          success: false,
          code: "PASSWORD_CHANGED",
          message: "Session expired. Your password was changed. Please log in again.",
        });
      }
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};