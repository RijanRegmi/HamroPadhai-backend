import { Router } from "express";
import { TeacherRoutineController } from "../../controllers/teacher/teacher-routine.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { teacherMiddleware } from "../../middlewares/teacher/teacher.middleware";

const router = Router();
const controller = new TeacherRoutineController();

// All routes require auth + teacher

// GET /api/teacher/routines/my - Get all routines where teacher is assigned
router.get("/routines/my", authMiddleware, teacherMiddleware, controller.getMyRoutines.bind(controller));

// GET /api/teacher/routines/class/:classId/section/:sectionId/active - Get active routine for class and section
router.get(
  "/routines/class/:classId/section/:sectionId/active",
  authMiddleware,
  teacherMiddleware,
  controller.getActiveRoutine.bind(controller)
);

// GET /api/teacher/routines/class/:classId/section/:sectionId - Get routines by class and section
router.get(
  "/routines/class/:classId/section/:sectionId",
  authMiddleware,
  teacherMiddleware,
  controller.getRoutinesByClassAndSection.bind(controller)
);

// GET /api/teacher/routines/:id - Get routine by ID (only if teacher is assigned)
router.get("/routines/:id", authMiddleware, teacherMiddleware, controller.getRoutineById.bind(controller));

export default router;
