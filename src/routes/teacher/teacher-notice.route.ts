import { Router } from "express";
import { TeacherNoticeController } from "./../../controllers/teacher/teacher-notice.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { teacherMiddleware } from "../../middlewares/teacher/teacher.middleware";
const router = Router();
const controller = new TeacherNoticeController();

// All routes require auth + teacher role

// GET /api/teacher/notices/my - Get my notices (teacher's classes and sections)
router.get(
  "/notices/my",
  authMiddleware,
  teacherMiddleware,
  controller.getMyNotices.bind(controller)
);

// GET /api/teacher/notices/unread-count - Get unread notice count
router.get(
  "/notices/unread-count",
  authMiddleware,
  teacherMiddleware,
  controller.getUnreadCount.bind(controller)
);

// GET /api/teacher/notices/pinned - Get pinned notices
router.get(
  "/notices/pinned",
  authMiddleware,
  teacherMiddleware,
  controller.getPinnedNotices.bind(controller)
);

// GET /api/teacher/notices/priority/:priority - Get notices by priority
router.get(
  "/notices/priority/:priority",
  authMiddleware,
  teacherMiddleware,
  controller.getNoticesByPriority.bind(controller)
);

// GET /api/teacher/notices/:id - Get notice by ID
router.get(
  "/notices/:id",
  authMiddleware,
  teacherMiddleware,
  controller.getNoticeById.bind(controller)
);

// POST /api/teacher/notices/:id/mark-read - Mark notice as read
router.post(
  "/notices/:id/mark-read",
  authMiddleware,
  teacherMiddleware,
  controller.markAsRead.bind(controller)
);

export default router;