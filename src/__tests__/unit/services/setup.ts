import mongoose from "mongoose";

const MONGO_TEST_URI =
  process.env.MONGO_TEST_URI || "mongodb://localhost:27017/hamropadhai_test";

export const connectDatabaseTest = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_TEST_URI);
    console.log("✅ Test DB connected");
  }
};