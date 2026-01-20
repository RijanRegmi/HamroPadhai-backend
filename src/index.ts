import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";

import { connectDatabase } from "./database/mongodb";
import { PORT } from "./config";
import authRoutes from "./routes/auth.route";

const app: Application = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/auth", authRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to HamroPadhai API",
  });
});


const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start");
    console.error(error);
    process.exit(1);
  }
};

startServer();
