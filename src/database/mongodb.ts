import mongoose from "mongoose";
import { MONGO_URI } from "../config";

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGO_URI);

    console.log(
      `MongoDB connected successfully: ${conn.connection.name}`
    );
  } catch (error) {
    console.error(" MongoDB connection failed");
    console.error(error);
    process.exit(1);
  }
};
