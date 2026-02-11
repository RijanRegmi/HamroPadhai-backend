import { Request, Response } from "express";
import { AdminAssignmentService } from "../../services/admin/admin-assignment.service";
import {
  createAssignmentDTO,
  updateAssignmentDTO,
} from "../../dtos/assignment.dto";
import { getFileType, deleteAssignmentFiles } from "../../middlewares/assignment-upload.middleware";

const adminAssignmentService = new AdminAssignmentService();

export class AdminAssignmentController {
  // POST /api/admin/assignments - Create assignment (with file uploads)
  async createAssignment(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      console.log("📥 Received request body:", JSON.stringify(req.body, null, 2));
      console.log("📎 Uploaded files:", (req as any).files);

      // Process uploaded files
      const uploadedFiles = (req as any).files || [];
      const attachments = uploadedFiles.map((file: any) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/assignments/${file.filename}`,
        fileType: getFileType(file.mimetype),
        fileSize: file.size,
      }));

      // Add attachments to request body
      const requestData = {
        ...req.body,
        totalMarks: Number(req.body.totalMarks), // Ensure number type
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      console.log("📋 Processed request data:", JSON.stringify(requestData, null, 2));

      const parsed = createAssignmentDTO.safeParse(requestData);
      
      if (!parsed.success) {
        console.error("❌ Validation failed:");
        console.error("Issues:", JSON.stringify(parsed.error.issues, null, 2));
        
        // Delete uploaded files if validation fails
        if (attachments.length > 0) {
          deleteAssignmentFiles(attachments);
        }
        
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
            received: err.code === 'invalid_type' ? (err as any).received : undefined,
            expected: err.code === 'invalid_type' ? (err as any).expected : undefined,
          })),
          details: parsed.error.issues,
        });
      }

      console.log("✅ Validation passed, creating assignment...");
      console.log("Parsed data:", JSON.stringify(parsed.data, null, 2));

      const assignment = await adminAssignmentService.createAssignment(
        parsed.data,
        userId
      );

      return res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        data: assignment,
      });
    } catch (error: any) {
      console.error("❌ Assignment creation error:", error);
      
      // Delete uploaded files if error occurs
      const uploadedFiles = (req as any).files || [];
      if (uploadedFiles.length > 0) {
        const attachments = uploadedFiles.map((file: any) => ({
          fileUrl: `/uploads/assignments/${file.filename}`,
        }));
        deleteAssignmentFiles(attachments);
      }
      
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to create assignment",
      });
    }
  }

  // GET /api/admin/assignments - Get all assignments
  async getAllAssignments(req: Request, res: Response) {
    try {
      const assignments = await adminAssignmentService.getAllAssignments();

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch assignments",
      });
    }
  }

  // GET /api/admin/assignments/:id - Get assignment by ID
  async getAssignmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const assignment = await adminAssignmentService.getAssignmentById(id);

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

  // GET /api/admin/assignments/class/:classId/section/:sectionId - Get by class and section
  async getAssignmentsByClassAndSection(req: Request, res: Response) {
    try {
      const { classId, sectionId } = req.params;

      const assignments =
        await adminAssignmentService.getAssignmentsByClassAndSection(
          classId,
          sectionId
        );

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch assignments",
      });
    }
  }

  // GET /api/admin/assignments/subject/:subject - Get by subject
  async getAssignmentsBySubject(req: Request, res: Response) {
    try {
      const { subject } = req.params;

      const assignments =
        await adminAssignmentService.getAssignmentsBySubject(subject);

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch assignments",
      });
    }
  }

  // PUT /api/admin/assignments/:id - Update assignment (with file uploads)
  async updateAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      console.log("📝 Updating assignment:", id);
      console.log("📎 New files uploaded:", (req as any).files);
      console.log("📥 Request body:", req.body);

      // Get existing assignment
      const existingAssignment = await adminAssignmentService.getAssignmentById(id);
      
      // Process newly uploaded files
      const uploadedFiles = (req as any).files || [];
      const newAttachments = uploadedFiles.map((file: any) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/assignments/${file.filename}`,
        fileType: getFileType(file.mimetype),
        fileSize: file.size,
      }));

      console.log("📎 New attachments:", newAttachments);

      // Parse existing attachments from request (sent as JSON string)
      let existingAttachments = [];
      try {
        if (req.body.existingAttachments) {
          existingAttachments = JSON.parse(req.body.existingAttachments);
          console.log("📎 Existing attachments:", existingAttachments);
        }
      } catch (error) {
        console.error("Error parsing existingAttachments:", error);
      }

      // Combine existing attachments with new ones
      const combinedAttachments = [
        ...existingAttachments,
        ...newAttachments,
      ];

      console.log("📎 Combined attachments:", combinedAttachments);

      const requestData = {
        ...req.body,
        totalMarks: req.body.totalMarks ? Number(req.body.totalMarks) : undefined,
        attachments: combinedAttachments.length > 0 ? combinedAttachments : undefined,
      };

      // Remove existingAttachments from requestData as it's not part of the schema
      delete requestData.existingAttachments;

      const parsed = updateAssignmentDTO.safeParse(requestData);
      
      if (!parsed.success) {
        console.error("❌ Validation failed:", parsed.error.issues);
        
        // Delete newly uploaded files if validation fails
        if (newAttachments.length > 0) {
          deleteAssignmentFiles(newAttachments);
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

      console.log("✅ Validation passed, updating assignment...");

      const assignment = await adminAssignmentService.updateAssignment(
        id,
        parsed.data
      );

      // Delete removed files (files that were in original but not in combined)
      const removedFiles = (existingAssignment.attachments || []).filter(
        (oldFile: any) => !existingAttachments.some((newFile: any) => newFile.fileUrl === oldFile.fileUrl)
      );
      
      if (removedFiles.length > 0) {
        console.log("🗑️ Deleting removed files:", removedFiles);
        deleteAssignmentFiles(removedFiles);
      }

      return res.status(200).json({
        success: true,
        message: "Assignment updated successfully",
        data: assignment,
      });
    } catch (error: any) {
      console.error("❌ Update error:", error);
      
      // Delete newly uploaded files if error occurs
      const uploadedFiles = (req as any).files || [];
      if (uploadedFiles.length > 0) {
        const newAttachments = uploadedFiles.map((file: any) => ({
          fileUrl: `/uploads/assignments/${file.filename}`,
        }));
        deleteAssignmentFiles(newAttachments);
      }
      
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update assignment",
      });
    }
  }

  // DELETE /api/admin/assignments/:id - Delete assignment
  async deleteAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Get assignment to delete its files
      const assignment = await adminAssignmentService.getAssignmentById(id);
      
      // Delete assignment files
      if (assignment.attachments && assignment.attachments.length > 0) {
        deleteAssignmentFiles(assignment.attachments);
      }

      await adminAssignmentService.deleteAssignment(id);

      return res.status(200).json({
        success: true,
        message: "Assignment deleted successfully",
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to delete assignment",
      });
    }
  }

  // PATCH /api/admin/assignments/:id/activate - Activate assignment
  async activateAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const assignment = await adminAssignmentService.activateAssignment(id);

      return res.status(200).json({
        success: true,
        message: "Assignment activated successfully",
        data: assignment,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to activate assignment",
      });
    }
  }

  // PATCH /api/admin/assignments/:id/deactivate - Deactivate assignment
  async deactivateAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const assignment = await adminAssignmentService.deactivateAssignment(id);

      return res.status(200).json({
        success: true,
        message: "Assignment deactivated successfully",
        data: assignment,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to deactivate assignment",
      });
    }
  }

  // GET /api/admin/assignments/:id/submissions - Get all submissions
  async getSubmissions(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const submissions = await adminAssignmentService.getSubmissions(id);

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

  // GET /api/admin/assignments/:id/stats - Get submission statistics
  async getSubmissionStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const stats = await adminAssignmentService.getSubmissionStats(id);

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

  // GET /api/admin/assignments/overdue - Get overdue assignments
  async getOverdueAssignments(req: Request, res: Response) {
    try {
      const assignments = await adminAssignmentService.getOverdueAssignments();

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch overdue assignments",
      });
    }
  }

  // GET /api/admin/assignments/upcoming - Get upcoming assignments
  async getUpcomingAssignments(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 7;

      const assignments = await adminAssignmentService.getUpcomingAssignments(days);

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch upcoming assignments",
      });
    }
  }

  // GET /api/admin/assignments/history - Get history assignments (past deadline)
  async getHistoryAssignments(req: Request, res: Response) {
    try {
      const assignments = await adminAssignmentService.getHistoryAssignments();

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch history assignments",
      });
    }
  }
}