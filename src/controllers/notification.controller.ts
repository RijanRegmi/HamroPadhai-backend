import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
const notificationService = new NotificationService();

export class NotificationController {
  async getMyNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const notifications = await notificationService.getMyNotifications(userId);
      return res.status(200).json({ success: true, data: notifications });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const count = await notificationService.getUnreadCount(userId);
      return res.status(200).json({ success: true, data: { unreadCount: count } });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      await notificationService.markAsRead(req.params.id, userId);
      return res.status(200).json({ success: true, message: "Marked as read" });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      await notificationService.markAllAsRead(userId);
      return res.status(200).json({ success: true, message: "All marked as read" });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}