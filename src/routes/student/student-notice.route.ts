import { Router } from "express";
import { StudentNoticeController } from "./../../controllers/student/student-notice.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { studentMiddleware } from "../../middlewares/student/student.middleware";

const router = Router();
const controller = new StudentNoticeController();

// All routes require auth + student role

// GET /api/notices/my - Get my notices (student's class and section)
router.get(
  "/my",
  authMiddleware,
  studentMiddleware,
  controller.getMyNotices.bind(controller)
);

// GET /api/notices/unread-count - Get unread notice count
router.get(
  "/unread-count",
  authMiddleware,
  studentMiddleware,
  controller.getUnreadCount.bind(controller)
);

// GET /api/notices/pinned - Get pinned notices for student
router.get(
  "/pinned",
  authMiddleware,
  studentMiddleware,
  controller.getPinnedNotices.bind(controller)
);

// GET /api/notices/priority/:priority - Get notices by priority
router.get(
  "/priority/:priority",
  authMiddleware,
  studentMiddleware,
  controller.getNoticesByPriority.bind(controller)
);

// GET /api/notices/:id - Get notice by ID
router.get(
  "/:id",
  authMiddleware,
  studentMiddleware,
  controller.getNoticeById.bind(controller)
);

// POST /api/notices/:id/mark-read - Mark notice as read
router.post(
  "/:id/mark-read",
  authMiddleware,
  studentMiddleware,
  controller.markAsRead.bind(controller)
);

export default router;