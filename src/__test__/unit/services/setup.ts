import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_TEST_URI = process.env.MONGO_TEST_URI as string;

if (!MONGO_TEST_URI) {
  throw new Error("MONGO_TEST_URI not defined");
}

export const connectDatabaseTest = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_TEST_URI);
    console.log("✅ Test DB connected");
  }
};