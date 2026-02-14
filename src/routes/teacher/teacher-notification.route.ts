import { Router } from "express";
import { NotificationController } from "../../controllers/notification.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { teacherMiddleware } from "../../middlewares/teacher/teacher.middleware";

const router = Router();
const controller = new NotificationController();

router.get("/notifications",                    authMiddleware, teacherMiddleware, controller.getMyNotifications.bind(controller));
router.get("/notifications/unread-count",       authMiddleware, teacherMiddleware, controller.getUnreadCount.bind(controller));
router.post("/notifications/mark-all-read",     authMiddleware, teacherMiddleware, controller.markAllAsRead.bind(controller));
router.post("/notifications/:id/mark-read",     authMiddleware, teacherMiddleware, controller.markAsRead.bind(controller));

export default router;