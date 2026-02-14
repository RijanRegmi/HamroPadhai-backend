import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import path from "path";

import authRoutes                from "./routes/auth.route";
import adminRoutes               from "./routes/admin/admin.route";
import adminNoticeRoutes         from "./routes/admin/admin-notice.route";
import teacherRoutes             from "./routes/teacher/teacher.route";
import teacherNoticeRoutes       from "./routes/teacher/teacher-notice.route";
import teacherNotificationRoutes from "./routes/teacher/teacher-notification.route"; // ✅ NEW
import studentNoticeRoutes       from "./routes/student/student-notice.route";
import studentNotificationRoutes from "./routes/student/student-notification.route"; // ✅ NEW
import routineRoutes             from "./routes/routine.route";
import studentAssignmentRoutes   from "./routes/student/student-assignment.route";

const app: Application = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth",        authRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/admin",       adminNoticeRoutes);
app.use("/api/teacher",     teacherRoutes);
app.use("/api/teacher",     teacherNoticeRoutes);
app.use("/api/teacher",     teacherNotificationRoutes); 
app.use("/api/notices",     studentNoticeRoutes);
app.use("/api/student",     studentNotificationRoutes); 
app.use("/api/routines",    routineRoutes);
app.use("/api/assignments", studentAssignmentRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Welcome to HamroPadhai API" });
});

export default app;