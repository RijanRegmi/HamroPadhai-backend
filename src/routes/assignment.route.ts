import { Router } from "express";
import { StudentAssignmentController } from "../controllers/student/student-assignment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const controller = new StudentAssignmentController();

// All routes require authentication (student role)

// GET /api/assignments/my - Get my assignments
router.get("/my", authMiddleware, controller.getMyAssignments.bind(controller));

// GET /api/assignments/pending - Get pending assignments (not submitted)
router.get("/pending", authMiddleware, controller.getPendingAssignments.bind(controller));

// GET /api/assignments/submitted - Get submitted assignments
router.get("/submitted", authMiddleware, controller.getSubmittedAssignments.bind(controller));

// GET /api/assignments/graded - Get graded assignments
router.get("/graded", authMiddleware, controller.getGradedAssignments.bind(controller));

// GET /api/assignments/overdue - Get overdue assignments
router.get("/overdue", authMiddleware, controller.getOverdueAssignments.bind(controller));

// GET /api/assignments/history - Get past assignments (after deadline)
router.get("/history", authMiddleware, controller.getHistoryAssignments.bind(controller));

// GET /api/assignments/:id - Get assignment by ID
router.get("/:id", authMiddleware, controller.getAssignmentById.bind(controller));

// POST /api/assignments/:id/submit - Submit assignment
router.post("/:id/submit", authMiddleware, controller.submitAssignment.bind(controller));

// GET /api/assignments/:id/my-submission - Get my submission for an assignment
router.get("/:id/my-submission", authMiddleware, controller.getMySubmission.bind(controller));

export default router;