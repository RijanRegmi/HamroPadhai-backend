import { Request, Response } from "express";
import { AdminAssignmentService } from "../../services/admin/admin-assignment.service";
import { createAssignmentDTO, updateAssignmentDTO } from "../../dtos/assignment.dto";
import { getFileType, deleteAssignmentFiles } from "../../middlewares/assignment-upload.middleware";

const adminAssignmentService = new AdminAssignmentService();

export class AdminAssignmentController {
  async createAssignment(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const uploadedFiles = (req as any).files || [];
      const attachments = uploadedFiles.map((file: any) => ({
        fileName: file.originalname,
        fileUrl:  `/uploads/assignments/${file.filename}`,
        fileType: getFileType(file.mimetype),
        fileSize: file.size,
      }));

      let assignedTeacherIds: string[] = [];
      try {
        if (req.body.assignedTeacherIds) {
          const parsed = JSON.parse(req.body.assignedTeacherIds);
          assignedTeacherIds = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch {
        assignedTeacherIds = [];
      }

      const requestData = {
        ...req.body,
        totalMarks:         Number(req.body.totalMarks),
        assignedTeacherIds, 
        attachments:        attachments.length > 0 ? attachments : undefined,
      };

      const parsed = createAssignmentDTO.safeParse(requestData);
      if (!parsed.success) {
        if (attachments.length > 0) deleteAssignmentFiles(attachments);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({
            path:     err.path.join("."),
            message:  err.message,
            received: err.code === "invalid_type" ? (err as any).received : undefined,
            expected: err.code === "invalid_type" ? (err as any).expected : undefined,
          })),
        });
      }

      const assignment = await adminAssignmentService.createAssignment(parsed.data, userId);
      return res.status(201).json({ success: true, message: "Assignment created successfully", data: assignment });
    } catch (error: any) {
      const uploadedFiles = (req as any).files || [];
      if (uploadedFiles.length > 0) deleteAssignmentFiles(uploadedFiles.map((f: any) => ({ fileUrl: `/uploads/assignments/${f.filename}` })));
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to create assignment" });
    }
  }

  async getAllAssignments(req: Request, res: Response) {
    try {
      const assignments = await adminAssignmentService.getAllAssignments();
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch assignments" });
    }
  }

  async getAssignmentById(req: Request, res: Response) {
    try {
      const assignment = await adminAssignmentService.getAssignmentById(req.params.id);
      return res.status(200).json({ success: true, data: assignment });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch assignment" });
    }
  }

  async getAssignmentsByClassAndSection(req: Request, res: Response) {
    try {
      const { classId, sectionId } = req.params;
      const assignments = await adminAssignmentService.getAssignmentsByClassAndSection(classId, sectionId);
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch assignments" });
    }
  }

  async getAssignmentsBySubject(req: Request, res: Response) {
    try {
      const assignments = await adminAssignmentService.getAssignmentsBySubject(req.params.subject);
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || "Failed to fetch assignments" });
    }
  }

  async updateAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const existingAssignment = await adminAssignmentService.getAssignmentById(id);

      const uploadedFiles = (req as any).files || [];
      const newAttachments = uploadedFiles.map((file: any) => ({
        fileName: file.originalname,
        fileUrl:  `/uploads/assignments/${file.filename}`,
        fileType: getFileType(file.mimetype),
        fileSize: file.size,
      }));

      let existingAttachments: any[] = [];
      try {
        if (req.body.existingAttachments) existingAttachments = JSON.parse(req.body.existingAttachments);
      } catch {}

      let assignedTeacherIds: string[] | undefined;
      try {
        if (req.body.assignedTeacherIds) {
          const parsed = JSON.parse(req.body.assignedTeacherIds);
          assignedTeacherIds = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch {}

      const combinedAttachments = [...existingAttachments, ...newAttachments];

      const requestData: any = {
        ...req.body,
        totalMarks:  req.body.totalMarks ? Number(req.body.totalMarks) : undefined,
        attachments: combinedAttachments.length > 0 ? combinedAttachments : undefined,
      };
      if (assignedTeacherIds !== undefined) requestData.assignedTeacherIds = assignedTeacherIds;
      delete requestData.existingAttachments;

      const parsed = updateAssignmentDTO.safeParse(requestData);
      if (!parsed.success) {
        if (newAttachments.length > 0) deleteAssignmentFiles(newAttachments);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({ path: err.path.join("."), message: err.message })),
        });
      }

      const assignment = await adminAssignmentService.updateAssignment(id, parsed.data);

      const removedFiles = (existingAssignment.attachments || []).filter(
        (old: any) => !existingAttachments.some((kept: any) => kept.fileUrl === old.fileUrl)
      );
      if (removedFiles.length > 0) deleteAssignmentFiles(removedFiles);

      return res.status(200).json({ success: true, message: "Assignment updated successfully", data: assignment });
    } catch (error: any) {
      const uploadedFiles = (req as any).files || [];
      if (uploadedFiles.length > 0) deleteAssignmentFiles(uploadedFiles.map((f: any) => ({ fileUrl: `/uploads/assignments/${f.filename}` })));
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to update assignment" });
    }
  }

  async deleteAssignment(req: Request, res: Response) {
    try {
      const assignment = await adminAssignmentService.getAssignmentById(req.params.id);
      if (assignment.attachments?.length) deleteAssignmentFiles(assignment.attachments);
      await adminAssignmentService.deleteAssignment(req.params.id);
      return res.status(200).json({ success: true, message: "Assignment deleted successfully" });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to delete assignment" });
    }
  }

  async activateAssignment(req: Request, res: Response) {
    try {
      const assignment = await adminAssignmentService.activateAssignment(req.params.id);
      return res.status(200).json({ success: true, message: "Assignment activated", data: assignment });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }

  async deactivateAssignment(req: Request, res: Response) {
    try {
      const assignment = await adminAssignmentService.deactivateAssignment(req.params.id);
      return res.status(200).json({ success: true, message: "Assignment deactivated", data: assignment });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }

  async getSubmissions(req: Request, res: Response) {
    try {
      const submissions = await adminAssignmentService.getSubmissions(req.params.id);
      return res.status(200).json({ success: true, data: submissions });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }

  async getSubmissionStats(req: Request, res: Response) {
    try {
      const stats = await adminAssignmentService.getSubmissionStats(req.params.id);
      return res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }

  async getOverdueAssignments(req: Request, res: Response) {
    try {
      const assignments = await adminAssignmentService.getOverdueAssignments();
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUpcomingAssignments(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const assignments = await adminAssignmentService.getUpcomingAssignments(days);
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getHistoryAssignments(req: Request, res: Response) {
    try {
      const assignments = await adminAssignmentService.getHistoryAssignments();
      return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}