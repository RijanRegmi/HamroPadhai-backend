import { Router } from "express";
import { TeacherAssignmentController } from "../../controllers/teacher/teacher-assignment.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { teacherMiddleware } from "../../middlewares/teacher/teacher.middleware";

const router = Router();
const controller = new TeacherAssignmentController();

// All routes require auth + teacher
// Note: These routes are already mounted at /assignments in teacher.route.ts
// So /my becomes /api/teacher/assignments/my

// IMPORTANT: Static routes MUST come BEFORE dynamic routes
// Otherwise /:id will catch routes like /my, /history, etc.

// GET /api/teacher/assignments/my - Get my assignments
router.get(
  "/my",
  authMiddleware,
  teacherMiddleware,
  controller.getMyAssignments.bind(controller)
);

// GET /api/teacher/assignments/history - Get past assignments
router.get(
  "/history",
  authMiddleware,
  teacherMiddleware,
  controller.getHistoryAssignments.bind(controller)
);

// GET /api/teacher/assignments/class/:classId/section/:sectionId - Get by class and section
router.get(
  "/class/:classId/section/:sectionId",
  authMiddleware,
  teacherMiddleware,
  controller.getAssignmentsByClassAndSection.bind(controller)
);

// Dynamic routes with :id parameter come AFTER static routes

// GET /api/teacher/assignments/:id/stats - Get submission statistics
router.get(
  "/:id/stats",
  authMiddleware,
  teacherMiddleware,
  controller.getSubmissionStats.bind(controller)
);

// GET /api/teacher/assignments/:id/submissions/pending - Get pending submissions
router.get(
  "/:id/submissions/pending",
  authMiddleware,
  teacherMiddleware,
  controller.getPendingSubmissions.bind(controller)
);

// GET /api/teacher/assignments/:id/submissions/graded - Get graded submissions
router.get(
  "/:id/submissions/graded",
  authMiddleware,
  teacherMiddleware,
  controller.getGradedSubmissions.bind(controller)
);

// GET /api/teacher/assignments/:id/submissions - Get all submissions
router.get(
  "/:id/submissions",
  authMiddleware,
  teacherMiddleware,
  controller.getSubmissions.bind(controller)
);

// POST /api/teacher/assignments/:id/grade - Grade a submission
router.post(
  "/:id/grade",
  authMiddleware,
  teacherMiddleware,
  controller.gradeSubmission.bind(controller)
);

// GET /api/teacher/assignments/:id - Get assignment by ID
// This MUST be last among GET routes to avoid catching other routes
router.get(
  "/:id",
  authMiddleware,
  teacherMiddleware,
  controller.getAssignmentById.bind(controller)
);

export default router;