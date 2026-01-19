import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is missing in .env");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in .env");
}

export const PORT: number = Number(process.env.PORT) || 3000;

export const MONGO_URI: string = process.env.MONGO_URI;

export const JWT_SECRET: string = process.env.JWT_SECRET;
