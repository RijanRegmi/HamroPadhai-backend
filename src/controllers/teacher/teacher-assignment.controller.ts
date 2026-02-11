import { Request, Response } from "express";
import { TeacherAssignmentService } from "../../services/teacher/teacher-assignment.service";
import { gradeSubmissionDTO } from "../../dtos/assignment.dto";

const teacherAssignmentService = new TeacherAssignmentService();

export class TeacherAssignmentController {
  // GET /api/teacher/assignments/my - Get my assignments
  async getMyAssignments(req: Request, res: Response) {
    try {
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignments = await teacherAssignmentService.getMyAssignments(teacherId);

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

  // GET /api/teacher/assignments/:id - Get assignment by ID
  async getAssignmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignment = await teacherAssignmentService.getAssignmentById(id, teacherId);

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

  // GET /api/teacher/assignments/class/:classId/section/:sectionId - Get by class and section
  async getAssignmentsByClassAndSection(req: Request, res: Response) {
    try {
      const { classId, sectionId } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignments = await teacherAssignmentService.getAssignmentsByClassAndSection(
        classId,
        sectionId,
        teacherId
      );

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

  // POST /api/teacher/assignments/:id/grade - Grade a submission
  async gradeSubmission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const parsed = gradeSubmissionDTO.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }

      const assignment = await teacherAssignmentService.gradeSubmission(
        id,
        parsed.data,
        teacherId
      );

      return res.status(200).json({
        success: true,
        message: "Submission graded successfully",
        data: assignment,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to grade submission",
      });
    }
  }

  // GET /api/teacher/assignments/:id/submissions - Get all submissions
  async getSubmissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const submissions = await teacherAssignmentService.getSubmissions(id, teacherId);

      return res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch submissions",
      });
    }
  }

  // GET /api/teacher/assignments/:id/submissions/pending - Get pending submissions
  async getPendingSubmissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const submissions = await teacherAssignmentService.getPendingSubmissions(
        id,
        teacherId
      );

      return res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch pending submissions",
      });
    }
  }

  // GET /api/teacher/assignments/:id/submissions/graded - Get graded submissions
  async getGradedSubmissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const submissions = await teacherAssignmentService.getGradedSubmissions(
        id,
        teacherId
      );

      return res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch graded submissions",
      });
    }
  }

  // GET /api/teacher/assignments/:id/stats - Get submission statistics
  async getSubmissionStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const stats = await teacherAssignmentService.getSubmissionStats(id, teacherId);

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

  async getHistoryAssignments(req: Request, res: Response) {
    try {
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const assignments = await teacherAssignmentService.getHistoryAssignments(teacherId);

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