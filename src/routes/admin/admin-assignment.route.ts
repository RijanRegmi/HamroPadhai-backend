import { Router, Request, Response, NextFunction } from "express";
import { AdminAssignmentController } from "../../controllers/admin/admin-assignment.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { adminMiddleware } from "../../middlewares/admin/admin.middleware";
import { uploadAssignmentFiles } from "../../middlewares/assignment-upload.middleware";
import multer from "multer";

const router = Router();
const controller = new AdminAssignmentController();

// Multer error handler for assignment files
const handleAssignmentUpload = (req: Request, res: Response, next: NextFunction) => {
  const upload = uploadAssignmentFiles.array("attachments", 10);
  
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
    
    // Log uploaded files for debugging
    console.log("✅ Files processed by multer:", (req as any).files);
    next();
  });
};

// All routes require auth + admin

// POST /api/admin/assignments - Create assignment (with file upload)
router.post(
  "/assignments",
  authMiddleware,
  adminMiddleware,
  handleAssignmentUpload,
  controller.createAssignment.bind(controller)
);

// GET /api/admin/assignments - Get all assignments
router.get(
  "/assignments",
  authMiddleware,
  adminMiddleware,
  controller.getAllAssignments.bind(controller)
);

// GET /api/admin/assignments/overdue - Get overdue assignments
router.get(
  "/assignments/overdue",
  authMiddleware,
  adminMiddleware,
  controller.getOverdueAssignments.bind(controller)
);

// GET /api/admin/assignments/upcoming - Get upcoming assignments
router.get(
  "/assignments/upcoming",
  authMiddleware,
  adminMiddleware,
  controller.getUpcomingAssignments.bind(controller)
);

// GET /api/admin/assignments/history - Get past assignments
router.get(
  "/assignments/history",
  authMiddleware,
  adminMiddleware,
  controller.getHistoryAssignments.bind(controller)
);

// GET /api/admin/assignments/class/:classId/section/:sectionId - Get by class and section
router.get(
  "/assignments/class/:classId/section/:sectionId",
  authMiddleware,
  adminMiddleware,
  controller.getAssignmentsByClassAndSection.bind(controller)
);

// GET /api/admin/assignments/subject/:subject - Get by subject
router.get(
  "/assignments/subject/:subject",
  authMiddleware,
  adminMiddleware,
  controller.getAssignmentsBySubject.bind(controller)
);

// GET /api/admin/assignments/:id - Get assignment by ID
router.get(
  "/assignments/:id",
  authMiddleware,
  adminMiddleware,
  controller.getAssignmentById.bind(controller)
);

// PUT /api/admin/assignments/:id - Update assignment (with file upload)
router.put(
  "/assignments/:id",
  authMiddleware,
  adminMiddleware,
  handleAssignmentUpload,
  controller.updateAssignment.bind(controller)
);

// DELETE /api/admin/assignments/:id - Delete assignment
router.delete(
  "/assignments/:id",
  authMiddleware,
  adminMiddleware,
  controller.deleteAssignment.bind(controller)
);

// PATCH /api/admin/assignments/:id/activate - Activate assignment
router.patch(
  "/assignments/:id/activate",
  authMiddleware,
  adminMiddleware,
  controller.activateAssignment.bind(controller)
);

// PATCH /api/admin/assignments/:id/deactivate - Deactivate assignment
router.patch(
  "/assignments/:id/deactivate",
  authMiddleware,
  adminMiddleware,
  controller.deactivateAssignment.bind(controller)
);

// GET /api/admin/assignments/:id/submissions - Get all submissions
router.get(
  "/assignments/:id/submissions",
  authMiddleware,
  adminMiddleware,
  controller.getSubmissions.bind(controller)
);

// GET /api/admin/assignments/:id/stats - Get submission statistics
router.get(
  "/assignments/:id/stats",
  authMiddleware,
  adminMiddleware,
  controller.getSubmissionStats.bind(controller)
);

export default router;