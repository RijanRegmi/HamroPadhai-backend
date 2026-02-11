import { Router, Request, Response, NextFunction } from "express";
import { StudentAssignmentController } from "../../controllers/student/student-assignment.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { studentMiddleware } from "../../middlewares/student/student.middleware";
import { uploadAssignmentFiles } from "../../middlewares/assignment-upload.middleware";
import multer from "multer";

const router = Router();
const controller = new StudentAssignmentController();

// Multer error handler for student submissions
const handleStudentSubmissionUpload = (req: Request, res: Response, next: NextFunction) => {
  const upload = uploadAssignmentFiles.array("files", 10);
  
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

// All routes require authentication AND student role

// GET /api/assignments/my - Get my assignments
router.get(
  "/my",
  authMiddleware,
  studentMiddleware,
  controller.getMyAssignments.bind(controller)
);

// GET /api/assignments/pending - Get pending assignments (not submitted)
router.get(
  "/pending",
  authMiddleware,
  studentMiddleware,
  controller.getPendingAssignments.bind(controller)
);

// GET /api/assignments/submitted - Get submitted assignments
router.get(
  "/submitted",
  authMiddleware,
  studentMiddleware,
  controller.getSubmittedAssignments.bind(controller)
);

// GET /api/assignments/graded - Get graded assignments
router.get(
  "/graded",
  authMiddleware,
  studentMiddleware,
  controller.getGradedAssignments.bind(controller)
);

// GET /api/assignments/overdue - Get overdue assignments
router.get(
  "/overdue",
  authMiddleware,
  studentMiddleware,
  controller.getOverdueAssignments.bind(controller)
);

// GET /api/assignments/history - Get past assignments (after deadline)
router.get(
  "/history",
  authMiddleware,
  studentMiddleware,
  controller.getHistoryAssignments.bind(controller)
);

// GET /api/assignments/:id - Get assignment by ID
router.get(
  "/:id",
  authMiddleware,
  studentMiddleware,
  controller.getAssignmentById.bind(controller)
);

// POST /api/assignments/:id/submit - Submit assignment WITH FILE UPLOAD
router.post(
  "/:id/submit",
  authMiddleware,
  studentMiddleware,
  handleStudentSubmissionUpload,
  controller.submitAssignment.bind(controller)
);

// GET /api/assignments/:id/my-submission - Get my submission for an assignment
router.get(
  "/:id/my-submission",
  authMiddleware,
  studentMiddleware,
  controller.getMySubmission.bind(controller)
);

export default router;