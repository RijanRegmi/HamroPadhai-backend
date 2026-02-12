import { Request, Response } from "express";
import { TeacherNoticeService } from "../../services/teacher/teacher-notice.service";

const teacherNoticeService = new TeacherNoticeService();

export class TeacherNoticeController {
  // GET /api/teacher/notices/my - Get my notices
  async getMyNotices(req: Request, res: Response) {
    try {
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const notices = await teacherNoticeService.getMyNotices(teacherId);

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

  // GET /api/teacher/notices/:id - Get notice by ID
  async getNoticeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const notice = await teacherNoticeService.getNoticeById(id, teacherId);

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

  // POST /api/teacher/notices/:id/mark-read - Mark notice as read
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const notice = await teacherNoticeService.markAsRead(id, teacherId);

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

  // GET /api/teacher/notices/unread-count - Get unread count
  async getUnreadCount(req: Request, res: Response) {
    try {
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const result = await teacherNoticeService.getUnreadCount(teacherId);

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

  // GET /api/teacher/notices/pinned - Get pinned notices
  async getPinnedNotices(req: Request, res: Response) {
    try {
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const notices = await teacherNoticeService.getPinnedNotices(teacherId);

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

  // GET /api/teacher/notices/priority/:priority - Get notices by priority
  async getNoticesByPriority(req: Request, res: Response) {
    try {
      const { priority } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const notices = await teacherNoticeService.getNoticesByPriority(priority, teacherId);

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