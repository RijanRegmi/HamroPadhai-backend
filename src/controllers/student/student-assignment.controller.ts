import { Request, Response } from "express";
import { StudentAssignmentService } from "../../services/student/student-assignment.service";
import { submitAssignmentDTO } from "../../dtos/assignment.dto";
import { getFileType } from "../../middlewares/assignment-upload.middleware";

const studentAssignmentService = new StudentAssignmentService();

export class StudentAssignmentController {
  async getMyAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;
      if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const assignments = await studentAssignmentService.getMyAssignments(studentId);
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch assignments" });
    }
  }

  async getAssignmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = (req as any).user?.id;
      if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const assignment = await studentAssignmentService.getAssignmentById(id, studentId);
      return res.status(200).json({ success: true, data: assignment });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch assignment" });
    }
  }

  async submitAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = (req as any).user?.id;
      if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });

      console.log("📤 Student submission received");
      console.log("📎 Files:", (req as any).files);
      console.log("📝 Body:", req.body);

      const uploadedFiles = (req as any).files || [];
      const files = uploadedFiles.map((file: any) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/assignments/${file.filename}`,
        // ✅ Pass originalname so type is detected by extension, not mimetype
        fileType: getFileType(file.mimetype, file.originalname),
        fileSize: file.size,
      }));

      const submissionData = {
        files: files.length > 0 ? files : undefined,
        textContent: req.body.textContent || undefined,
      };

      console.log("📋 Processed submission data:", submissionData);

      const parsed = submitAssignmentDTO.safeParse(submissionData);
      if (!parsed.success) {
        console.error("❌ Validation failed:", parsed.error.issues);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({ path: err.path.join("."), message: err.message })),
        });
      }

      const assignment = await studentAssignmentService.submitAssignment(id, parsed.data, studentId);
      return res.status(200).json({ success: true, message: "Assignment submitted successfully", data: assignment });
    } catch (error: any) {
      console.error("❌ Submission error:", error);
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to submit assignment" });
    }
  }

  async getMySubmission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = (req as any).user?.id;
      if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const submission = await studentAssignmentService.getMySubmission(id, studentId);
      return res.status(200).json({ success: true, data: submission });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch submission" });
    }
  }

  async getPendingAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;
      if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const assignments = await studentAssignmentService.getPendingAssignments(studentId);
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch pending assignments" });
    }
  }

  async getSubmittedAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;
      if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const assignments = await studentAssignmentService.getSubmittedAssignments(studentId);
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch submitted assignments" });
    }
  }

  async getGradedAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;
      if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const assignments = await studentAssignmentService.getGradedAssignments(studentId);
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch graded assignments" });
    }
  }

  async getOverdueAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;
      if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const assignments = await studentAssignmentService.getOverdueAssignments(studentId);
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch overdue assignments" });
    }
  }

  async getHistoryAssignments(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.id;
      if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const assignments = await studentAssignmentService.getHistoryAssignments(studentId);
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch history assignments" });
    }
  }
}