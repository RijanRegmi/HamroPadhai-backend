import { Request, Response } from "express";
import { AdminRoutineService } from "../../services/admin/admin-routine.service";
import { createRoutineDTO, updateRoutineDTO } from "../../dtos/routine.dto";

const adminRoutineService = new AdminRoutineService();

export class AdminRoutineController {
  // POST /api/admin/routines - Create routine
  async createRoutine(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      console.log("=== CREATE ROUTINE - DETAILED DEBUG ===");
      console.log("User ID:", userId);
      console.log("Request Body:", JSON.stringify(req.body, null, 2));
      console.log("Body type:", typeof req.body);
      console.log("Body entries:", req.body.entries);

      if (!userId) {
        console.error("❌ No user ID found");
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      console.log("✓ User authenticated");

      const parsed = createRoutineDTO.safeParse(req.body);
      
      if (!parsed.success) {
        console.error("❌ VALIDATION FAILED");
        console.error("Errors:", JSON.stringify(parsed.error.issues, null, 2));
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }

      console.log("✓ Validation passed");
      console.log("Validated data:", JSON.stringify(parsed.data, null, 2));

      console.log("📝 Calling service to create routine...");
      const routine = await adminRoutineService.createRoutine(parsed.data, userId);

      console.log("✅ SERVICE RETURNED SUCCESS");
      console.log("Created routine ID:", routine._id);
      console.log("Created routine:", JSON.stringify(routine, null, 2));

      return res.status(201).json({
        success: true,
        message: "Routine created successfully",
        data: routine,
      });
    } catch (error: any) {
      console.error("=== ❌ CREATE ROUTINE ERROR ===");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error statusCode:", error.statusCode);
      console.error("Error stack:", error.stack);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to create routine",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // GET /api/admin/routines - Get all routines
  async getAllRoutines(req: Request, res: Response) {
    try {
      const routines = await adminRoutineService.getAllRoutines();

      return res.status(200).json({
        success: true,
        data: routines,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch routines",
      });
    }
  }

  // GET /api/admin/routines/:id - Get routine by ID
  async getRoutineById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const routine = await adminRoutineService.getRoutineById(id);

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

  // GET /api/admin/routines/class/:classId - Get routines by class
  async getRoutinesByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;

      const routines = await adminRoutineService.getRoutinesByClass(classId);

      return res.status(200).json({
        success: true,
        data: routines,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch routines",
      });
    }
  }

  // GET /api/admin/routines/class/:classId/section/:sectionId - Get routines by class and section
  async getRoutinesByClassAndSection(req: Request, res: Response) {
    try {
      const { classId, sectionId } = req.params;

      const routines = await adminRoutineService.getRoutinesByClassAndSection(classId, sectionId);

      return res.status(200).json({
        success: true,
        data: routines,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch routines",
      });
    }
  }

  // PUT /api/admin/routines/:id - Update routine
  async updateRoutine(req: Request, res: Response) {
    try {
      const { id } = req.params;

      console.log("=== UPDATE ROUTINE REQUEST ===");
      console.log("Routine ID:", id);
      console.log("Request Body:", JSON.stringify(req.body, null, 2));

      const parsed = updateRoutineDTO.safeParse(req.body);
      
      if (!parsed.success) {
        console.error("=== VALIDATION ERROR ===");
        console.error("Errors:", JSON.stringify(parsed.error.issues, null, 2));
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }

      const routine = await adminRoutineService.updateRoutine(id, parsed.data);

      console.log("✓ Routine updated successfully");

      return res.status(200).json({
        success: true,
        message: "Routine updated successfully",
        data: routine,
      });
    } catch (error: any) {
      console.error("=== UPDATE ROUTINE ERROR ===");
      console.error("Error:", error.message);
      
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update routine",
      });
    }
  }

  // DELETE /api/admin/routines/:id - Delete routine
  async deleteRoutine(req: Request, res: Response) {
    try {
      const { id } = req.params;

      console.log("=== DELETE ROUTINE REQUEST ===");
      console.log("Routine ID:", id);

      await adminRoutineService.deleteRoutine(id);

      console.log("✓ Routine deleted successfully");

      return res.status(200).json({
        success: true,
        message: "Routine deleted successfully",
      });
    } catch (error: any) {
      console.error("=== DELETE ROUTINE ERROR ===");
      console.error("Error:", error.message);
      
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to delete routine",
      });
    }
  }

  // PATCH /api/admin/routines/:id/deactivate - Deactivate routine
  async deactivateRoutine(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const routine = await adminRoutineService.deactivateRoutine(id);

      return res.status(200).json({
        success: true,
        message: "Routine deactivated successfully",
        data: routine,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to deactivate routine",
      });
    }
  }

  // PATCH /api/admin/routines/:id/activate - Activate routine
  async activateRoutine(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const routine = await adminRoutineService.activateRoutine(id);

      return res.status(200).json({
        success: true,
        message: "Routine activated successfully",
        data: routine,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to activate routine",
      });
    }
  }
}