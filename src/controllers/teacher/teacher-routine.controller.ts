import { Request, Response } from "express";
import { TeacherRoutineService } from "../../services/teacher/teacher-routine.service";

const teacherRoutineService = new TeacherRoutineService();

export class TeacherRoutineController {
  // GET /api/teacher/routines/my - Get all routines where teacher is assigned
  async getMyRoutines(req: Request, res: Response) {
    try {
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const routines = await teacherRoutineService.getMyRoutines(teacherId);

      return res.status(200).json({
        success: true,
        data: routines,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch routines",
      });
    }
  }

  // GET /api/teacher/routines/:id - Get routine by ID (only if teacher is assigned)
  async getRoutineById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const routine = await teacherRoutineService.getRoutineById(id, teacherId);

      return res.status(200).json({
        success: true,
        data: routine,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch routine",
      });
    }
  }

  // GET /api/teacher/routines/class/:classId/section/:sectionId - Get routines by class and section (only if assigned)
  async getRoutinesByClassAndSection(req: Request, res: Response) {
    try {
      const { classId, sectionId } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const routines = await teacherRoutineService.getRoutinesByClassAndSection(classId, sectionId, teacherId);

      return res.status(200).json({
        success: true,
        data: routines,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch routines",
      });
    }
  }

  // GET /api/teacher/routines/class/:classId/section/:sectionId/active - Get active routine for class and section
  async getActiveRoutine(req: Request, res: Response) {
    try {
      const { classId, sectionId } = req.params;
      const teacherId = (req as any).user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const routine = await teacherRoutineService.getActiveRoutine(classId, sectionId, teacherId);

      return res.status(200).json({
        success: true,
        data: routine,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch routine",
      });
    }
  }
}
