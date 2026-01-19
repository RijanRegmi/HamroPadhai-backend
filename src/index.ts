import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";

const start = async () => {
  await connectDB();
  app.listen(process.env.PORT, () => {
    console.log(`Server running on ${process.env.PORT}`);
  });
};

start();