import { Router } from "express";
import { AdminRoutineController } from "../../controllers/admin/admin-routine.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { adminMiddleware } from "../../middlewares/admin/admin.middleware";

const router = Router();
const controller = new AdminRoutineController();

// All routes require auth + admin

// POST /api/admin/routines - Create routine
router.post("/routines", authMiddleware, adminMiddleware, controller.createRoutine.bind(controller));

// GET /api/admin/routines - Get all routines
router.get("/routines", authMiddleware, adminMiddleware, controller.getAllRoutines.bind(controller));

// GET /api/admin/routines/class/:classId - Get routines by class
router.get(
  "/routines/class/:classId",
  authMiddleware,
  adminMiddleware,
  controller.getRoutinesByClass.bind(controller)
);

// GET /api/admin/routines/class/:classId/section/:sectionId - Get routines by class and section
router.get(
  "/routines/class/:classId/section/:sectionId",
  authMiddleware,
  adminMiddleware,
  controller.getRoutinesByClassAndSection.bind(controller)
);

// GET /api/admin/routines/:id - Get routine by ID
router.get("/routines/:id", authMiddleware, adminMiddleware, controller.getRoutineById.bind(controller));

// PUT /api/admin/routines/:id - Update routine
router.put("/routines/:id", authMiddleware, adminMiddleware, controller.updateRoutine.bind(controller));

// DELETE /api/admin/routines/:id - Delete routine
router.delete("/routines/:id", authMiddleware, adminMiddleware, controller.deleteRoutine.bind(controller));

// PATCH /api/admin/routines/:id/deactivate - Deactivate routine
router.patch(
  "/routines/:id/deactivate",
  authMiddleware,
  adminMiddleware,
  controller.deactivateRoutine.bind(controller)
);

// PATCH /api/admin/routines/:id/activate - Activate routine
router.patch(
  "/routines/:id/activate",
  authMiddleware,
  adminMiddleware,
  controller.activateRoutine.bind(controller)
);

export default router;
