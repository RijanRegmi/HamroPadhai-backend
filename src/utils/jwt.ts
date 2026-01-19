import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export const signToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
};
