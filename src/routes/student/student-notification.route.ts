import { Router } from "express";
import { NotificationController } from "../../controllers/notification.controller";
import { FCMTokenController } from "../../controllers/fcm-token.controller"; 
import { authMiddleware } from "../../middlewares/auth.middleware";
import { studentMiddleware } from "../../middlewares/student/student.middleware";

const router = Router();
const controller = new NotificationController();
const fcmController = new FCMTokenController(); 

router.get(  "/notifications",               authMiddleware, studentMiddleware, controller.getMyNotifications.bind(controller));
router.get(  "/notifications/unread-count",  authMiddleware, studentMiddleware, controller.getUnreadCount.bind(controller));
router.post( "/notifications/mark-all-read", authMiddleware, studentMiddleware, controller.markAllAsRead.bind(controller));
router.post( "/notifications/:id/mark-read", authMiddleware, studentMiddleware, controller.markAsRead.bind(controller));

router.post(  "/fcm-token", authMiddleware, studentMiddleware, fcmController.saveToken.bind(fcmController));
router.delete("/fcm-token", authMiddleware, studentMiddleware, fcmController.removeToken.bind(fcmController));

export default router;