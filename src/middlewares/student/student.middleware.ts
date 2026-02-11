import { Request, Response, NextFunction } from "express";

export const studentMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Please login",
    });
  }

  if (user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "Access denied. This resource is only available to students.",
    });
  }

  next();
};