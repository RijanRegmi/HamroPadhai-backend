import { Request, Response } from "express";
import { AdminNoticeService } from "../../services/admin/admin-notice.service";
import { createNoticeDTO, updateNoticeDTO } from "../../dtos/notice.dto";
import { getNoticeFileType, deleteNoticeFiles } from "../../middlewares/notice-upload.middleware";

const adminNoticeService = new AdminNoticeService();

export class AdminNoticeController {
  // POST /api/admin/notices - Create notice (with file uploads)
  async createNotice(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      console.log("📢 Received notice request body:", JSON.stringify(req.body, null, 2));
      console.log("📎 Uploaded files:", (req as any).files);

      // Process uploaded files
      const uploadedFiles = (req as any).files || [];
      const attachments = uploadedFiles.map((file: any) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/notices/${file.filename}`,
        fileType: getNoticeFileType(file.mimetype),
        fileSize: file.size,
      }));

      // Parse targetClasses from JSON string
      let targetClasses = [];

      try {
        if (req.body.targetClasses) {
          targetClasses = typeof req.body.targetClasses === 'string' 
            ? JSON.parse(req.body.targetClasses) 
            : req.body.targetClasses;
        }
      } catch (error) {
        console.error("Error parsing targetClasses:", error);
      }

      // Add attachments to request body
      const requestData = {
        ...req.body,
        targetClasses,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      console.log("📋 Processed request data:", JSON.stringify(requestData, null, 2));

      const parsed = createNoticeDTO.safeParse(requestData);
      
      if (!parsed.success) {
        console.error("❌ Validation failed:");
        console.error("Issues:", JSON.stringify(parsed.error.issues, null, 2));
        
        if (attachments.length > 0) {
          deleteNoticeFiles(attachments);
        }
        
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }

      console.log("✅ Validation passed, creating notice...");

      const notice = await adminNoticeService.createNotice(parsed.data, userId);

      return res.status(201).json({
        success: true,
        message: "Notice created successfully",
        data: notice,
      });
    } catch (error: any) {
      console.error("❌ Notice creation error:", error);
      
      const uploadedFiles = (req as any).files || [];
      if (uploadedFiles.length > 0) {
        const attachments = uploadedFiles.map((file: any) => ({
          fileUrl: `/uploads/notices/${file.filename}`,
        }));
        deleteNoticeFiles(attachments);
      }
      
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to create notice",
      });
    }
  }

  // GET /api/admin/notices - Get all notices
  async getAllNotices(req: Request, res: Response) {
    try {
      const notices = await adminNoticeService.getAllNotices();

      return res.status(200).json({
        success: true,
        data: notices,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch notices",
      });
    }
  }

  // GET /api/admin/notices/:id - Get notice by ID
  async getNoticeById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const notice = await adminNoticeService.getNoticeById(id);

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

  // PUT /api/admin/notices/:id - Update notice (with file uploads)
  async updateNotice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      console.log("📝 Updating notice:", id);
      console.log("📎 New files uploaded:", (req as any).files);
      console.log("📥 Request body:", req.body);

      const existingNotice = await adminNoticeService.getNoticeById(id);
      
      const uploadedFiles = (req as any).files || [];
      const newAttachments = uploadedFiles.map((file: any) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/notices/${file.filename}`,
        fileType: getNoticeFileType(file.mimetype),
        fileSize: file.size,
      }));

      let existingAttachments = [];
      try {
        if (req.body.existingAttachments) {
          existingAttachments = JSON.parse(req.body.existingAttachments);
        }
      } catch (error) {
        console.error("Error parsing existingAttachments:", error);
      }

      let targetClasses = undefined;

      try {
        if (req.body.targetClasses) {
          targetClasses = typeof req.body.targetClasses === 'string' 
            ? JSON.parse(req.body.targetClasses) 
            : req.body.targetClasses;
        }
      } catch (error) {
        console.error("Error parsing targetClasses:", error);
      }

      const combinedAttachments = [
        ...existingAttachments,
        ...newAttachments,
      ];

      const requestData = {
        ...req.body,
        targetClasses,
        attachments: combinedAttachments.length > 0 ? combinedAttachments : undefined,
      };

      delete requestData.existingAttachments;

      const parsed = updateNoticeDTO.safeParse(requestData);
      
      if (!parsed.success) {
        console.error("❌ Validation failed:", parsed.error.issues);
        
        if (newAttachments.length > 0) {
          deleteNoticeFiles(newAttachments);
        }
        
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }

      const notice = await adminNoticeService.updateNotice(id, parsed.data);

      const removedFiles = (existingNotice.attachments || []).filter(
        (oldFile: any) => !existingAttachments.some((newFile: any) => newFile.fileUrl === oldFile.fileUrl)
      );
      
      if (removedFiles.length > 0) {
        console.log("🗑️ Deleting removed files:", removedFiles);
        deleteNoticeFiles(removedFiles);
      }

      return res.status(200).json({
        success: true,
        message: "Notice updated successfully",
        data: notice,
      });
    } catch (error: any) {
      console.error("❌ Update error:", error);
      
      const uploadedFiles = (req as any).files || [];
      if (uploadedFiles.length > 0) {
        const newAttachments = uploadedFiles.map((file: any) => ({
          fileUrl: `/uploads/notices/${file.filename}`,
        }));
        deleteNoticeFiles(newAttachments);
      }
      
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update notice",
      });
    }
  }

  // DELETE /api/admin/notices/:id - Delete notice
  async deleteNotice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const notice = await adminNoticeService.getNoticeById(id);
      
      if (notice.attachments && notice.attachments.length > 0) {
        deleteNoticeFiles(notice.attachments);
      }

      await adminNoticeService.deleteNotice(id);

      return res.status(200).json({
        success: true,
        message: "Notice deleted successfully",
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to delete notice",
      });
    }
  }

  // PATCH /api/admin/notices/:id/activate - Activate notice
  async activateNotice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const notice = await adminNoticeService.activateNotice(id);

      return res.status(200).json({
        success: true,
        message: "Notice activated successfully",
        data: notice,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to activate notice",
      });
    }
  }

  // PATCH /api/admin/notices/:id/deactivate - Deactivate notice
  async deactivateNotice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const notice = await adminNoticeService.deactivateNotice(id);

      return res.status(200).json({
        success: true,
        message: "Notice deactivated successfully",
        data: notice,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to deactivate notice",
      });
    }
  }

  // GET /api/admin/notices/pinned - Get pinned notices
  async getPinnedNotices(req: Request, res: Response) {
    try {
      const notices = await adminNoticeService.getPinnedNotices();

      return res.status(200).json({
        success: true,
        data: notices,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch pinned notices",
      });
    }
  }

  // GET /api/admin/notices/priority/:priority - Get notices by priority
  async getNoticesByPriority(req: Request, res: Response) {
    try {
      const { priority } = req.params;

      const notices = await adminNoticeService.getNoticesByPriority(priority);

      return res.status(200).json({
        success: true,
        data: notices,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch notices",
      });
    }
  }

  // GET /api/admin/notices/expired - Get expired notices
  async getExpiredNotices(req: Request, res: Response) {
    try {
      const notices = await adminNoticeService.getExpiredNotices();

      return res.status(200).json({
        success: true,
        data: notices,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch expired notices",
      });
    }
  }

  // GET /api/admin/notices/scheduled - Get scheduled notices
  async getScheduledNotices(req: Request, res: Response) {
    try {
      const notices = await adminNoticeService.getScheduledNotices();

      return res.status(200).json({
        success: true,
        data: notices,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch scheduled notices",
      });
    }
  }

  // GET /api/admin/notices/search?q=query - Search notices
  async searchNotices(req: Request, res: Response) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const notices = await adminNoticeService.searchNotices(q);

      return res.status(200).json({
        success: true,
        data: notices,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to search notices",
      });
    }
  }

  // GET /api/admin/notices/:id/stats - Get notice statistics
  async getNoticeStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const stats = await adminNoticeService.getNoticeStats(id);

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch statistics",
      });
    }
  }
}