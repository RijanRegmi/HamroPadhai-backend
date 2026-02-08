import { Router } from "express";
import { StudentRoutineController } from "../controllers/student-routine.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const controller = new StudentRoutineController();

// All routes require authentication (student role)

// GET /api/routines/my - Get my active routine (student's own class and section)
router.get("/my", authMiddleware, controller.getMyRoutine.bind(controller));

// GET /api/routines/my/all - Get all routines for my class and section
router.get("/my/all", authMiddleware, controller.getAllMyRoutines.bind(controller));

// GET /api/routines/:id - Get routine by ID (only if it belongs to student's class and section)
router.get("/:id", authMiddleware, controller.getRoutineById.bind(controller));

export default router;
