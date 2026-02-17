import { Request, Response } from "express";
import { StudentNoticeService } from "../../services/student/student-notice.service";

const studentNoticeService = new StudentNoticeService();

export class StudentNoticeController {
  // GET /api/notices/my - Get my notices
  async getMyNotices(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const notices = await studentNoticeService.getMyNotices(studentId);

      return res.status(200).json({
        success: true,
        data: notices,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch notices",
      });
    }
  }

  // GET /api/notices/:id - Get notice by ID
  async getNoticeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const notice = await studentNoticeService.getNoticeById(id, studentId);

      return res.status(200).json({
        success: true,
        data: notice,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch notice",
      });
    }
  }

  // POST /api/notices/:id/mark-read - Mark notice as read
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const notice = await studentNoticeService.markAsRead(id, studentId);

      return res.status(200).json({
        success: true,
        message: "Notice marked as read",
        data: notice,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to mark notice as read",
      });
    }
  }

  // GET /api/notices/unread-count - Get unread count
  async getUnreadCount(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const result = await studentNoticeService.getUnreadCount(studentId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch unread count",
      });
    }
  }

  // GET /api/notices/pinned - Get pinned notices
  async getPinnedNotices(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const notices = await studentNoticeService.getPinnedNotices(studentId);

      return res.status(200).json({
        success: true,
        data: notices,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch pinned notices",
      });
    }
  }

  // GET /api/notices/priority/:priority - Get notices by priority
  async getNoticesByPriority(req: Request, res: Response) {
    try {
      const { priority } = req.params;
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const notices = await studentNoticeService.getNoticesByPriority(priority, studentId);

      return res.status(200).json({
        success: true,
        data: notices,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch notices",
      });
    }
  }
}