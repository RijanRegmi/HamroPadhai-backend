import { Request, Response } from "express";
import { StudentRoutineService } from "../services/student-routine.service";

const studentRoutineService = new StudentRoutineService();

export class StudentRoutineController {
  // GET /api/routines/my - Get my active routine (student's own class and section)
  async getMyRoutine(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const routine = await studentRoutineService.getMyRoutine(userId);

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

  // GET /api/routines/my/all - Get all routines for my class and section
  async getAllMyRoutines(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const routines = await studentRoutineService.getAllMyRoutines(userId);

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

  // GET /api/routines/:id - Get routine by ID (only if it belongs to student's class and section)
  async getRoutineById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const routine = await studentRoutineService.getRoutineById(id, userId);

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
