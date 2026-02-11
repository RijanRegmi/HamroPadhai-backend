import { Request, Response } from "express";
import { StudentAssignmentService } from "../../services/student/student-assignment.service";
import { submitAssignmentDTO } from "../../dtos/assignment.dto";
import { getFileType } from "../../middlewares/assignment-upload.middleware";

const studentAssignmentService = new StudentAssignmentService();

export class StudentAssignmentController {
  // GET /api/assignments/my - Get my assignments
  async getMyAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignments = await studentAssignmentService.getMyAssignments(studentId);

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch assignments",
      });
    }
  }

  // GET /api/assignments/:id - Get assignment by ID
  async getAssignmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignment = await studentAssignmentService.getAssignmentById(id, studentId);

      return res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch assignment",
      });
    }
  }

  // POST /api/assignments/:id/submit - Submit assignment WITH FILES
  async submitAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      console.log("📤 Student submission received");
      console.log("📎 Files:", (req as any).files);
      console.log("📝 Body:", req.body);

      // Process uploaded files
      const uploadedFiles = (req as any).files || [];
      const files = uploadedFiles.map((file: any) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/assignments/${file.filename}`,
        fileType: getFileType(file.mimetype),
        fileSize: file.size,
      }));

      // Prepare submission data
      const submissionData = {
        files: files.length > 0 ? files : undefined,
        textContent: req.body.textContent || undefined,
      };

      console.log("📋 Processed submission data:", submissionData);

      // Validate
      const parsed = submitAssignmentDTO.safeParse(submissionData);
      if (!parsed.success) {
        console.error("❌ Validation failed:", parsed.error.issues);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }

      const assignment = await studentAssignmentService.submitAssignment(
        id,
        parsed.data,
        studentId
      );

      return res.status(200).json({
        success: true,
        message: "Assignment submitted successfully",
        data: assignment,
      });
    } catch (error: any) {
      console.error("❌ Submission error:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to submit assignment",
      });
    }
  }

  // GET /api/assignments/:id/my-submission - Get my submission for an assignment
  async getMySubmission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const submission = await studentAssignmentService.getMySubmission(id, studentId);

      return res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch submission",
      });
    }
  }

  // GET /api/assignments/pending - Get pending assignments (not submitted)
  async getPendingAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignments = await studentAssignmentService.getPendingAssignments(studentId);

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch pending assignments",
      });
    }
  }

  // GET /api/assignments/submitted - Get submitted assignments
  async getSubmittedAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignments = await studentAssignmentService.getSubmittedAssignments(studentId);

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch submitted assignments",
      });
    }
  }

  // GET /api/assignments/graded - Get graded assignments
  async getGradedAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignments = await studentAssignmentService.getGradedAssignments(studentId);

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch graded assignments",
      });
    }
  }

  // GET /api/assignments/overdue - Get overdue assignments
  async getOverdueAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignments = await studentAssignmentService.getOverdueAssignments(studentId);

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch overdue assignments",
      });
    }
  }

  // GET /api/assignments/history - Get history assignments (past deadline)
  async getHistoryAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignments = await studentAssignmentService.getHistoryAssignments(studentId);

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch history assignments",
      });
    }
  }
}