import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_TEST_URI =
  process.env.MONGO_TEST_URI ||
  "mongodb+srv://rijanregmi8_db_user:dbY2ZhoAm741ticA@qr.r1aggs9.mongodb.net/hamropadhai_test?retryWrites=true&w=majority&appName=Qr";

export const connectDatabaseTest = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_TEST_URI);
    console.log("✅ Test DB connected");
  }
};