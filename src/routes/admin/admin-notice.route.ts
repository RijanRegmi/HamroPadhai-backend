import { Router, Request, Response, NextFunction } from "express";
import { AdminNoticeController } from "../../controllers/admin/admin-notice.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { adminMiddleware } from "../../middlewares/admin/admin.middleware";
import { uploadNoticeFiles } from "../../middlewares/notice-upload.middleware";
import multer from "multer";

const router = Router();
const controller = new AdminNoticeController();

// Multer error handler for notice files
const handleNoticeUpload = (req: Request, res: Response, next: NextFunction) => {
  const upload = uploadNoticeFiles.array("attachments", 10);
  
  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      console.error("❌ Multer error:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 10MB per file",
        });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Too many files. Maximum 10 files allowed",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    } else if (err) {
      console.error("❌ Upload error:", err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    
    console.log("✅ Files processed by multer:", (req as any).files);
    next();
  });
};

// All routes require auth + admin

// POST /api/admin/notices - Create notice (with file upload)
router.post(
  "/notices",
  authMiddleware,
  adminMiddleware,
  handleNoticeUpload,
  controller.createNotice.bind(controller)
);

// GET /api/admin/notices - Get all notices
router.get(
  "/notices",
  authMiddleware,
  adminMiddleware,
  controller.getAllNotices.bind(controller)
);

// GET /api/admin/notices/pinned - Get pinned notices
router.get(
  "/notices/pinned",
  authMiddleware,
  adminMiddleware,
  controller.getPinnedNotices.bind(controller)
);

// GET /api/admin/notices/priority/:priority - Get notices by priority
router.get(
  "/notices/priority/:priority",
  authMiddleware,
  adminMiddleware,
  controller.getNoticesByPriority.bind(controller)
);

// GET /api/admin/notices/expired - Get expired notices
router.get(
  "/notices/expired",
  authMiddleware,
  adminMiddleware,
  controller.getExpiredNotices.bind(controller)
);

// GET /api/admin/notices/scheduled - Get scheduled notices
router.get(
  "/notices/scheduled",
  authMiddleware,
  adminMiddleware,
  controller.getScheduledNotices.bind(controller)
);

// GET /api/admin/notices/search?q=query - Search notices
router.get(
  "/notices/search",
  authMiddleware,
  adminMiddleware,
  controller.searchNotices.bind(controller)
);

// GET /api/admin/notices/:id - Get notice by ID
router.get(
  "/notices/:id",
  authMiddleware,
  adminMiddleware,
  controller.getNoticeById.bind(controller)
);

// GET /api/admin/notices/:id/stats - Get notice statistics
router.get(
  "/notices/:id/stats",
  authMiddleware,
  adminMiddleware,
  controller.getNoticeStats.bind(controller)
);

// PUT /api/admin/notices/:id - Update notice (with file upload)
router.put(
  "/notices/:id",
  authMiddleware,
  adminMiddleware,
  handleNoticeUpload,
  controller.updateNotice.bind(controller)
);

// DELETE /api/admin/notices/:id - Delete notice
router.delete(
  "/notices/:id",
  authMiddleware,
  adminMiddleware,
  controller.deleteNotice.bind(controller)
);

// PATCH /api/admin/notices/:id/activate - Activate notice
router.patch(
  "/notices/:id/activate",
  authMiddleware,
  adminMiddleware,
  controller.activateNotice.bind(controller)
);

// PATCH /api/admin/notices/:id/deactivate - Deactivate notice
router.patch(
  "/notices/:id/deactivate",
  authMiddleware,
  adminMiddleware,
  controller.deactivateNotice.bind(controller)
);

export default router;