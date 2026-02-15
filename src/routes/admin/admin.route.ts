
import { Router, Request, Response, NextFunction } from "express";
import { AdminUserController } from "../../controllers/admin/admin-user.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { adminMiddleware } from "../../middlewares/admin/admin.middleware";
import { upload } from "../../middlewares/upload.middleware";
import multer from "multer";
import adminRoutineRoutes from "./admin-routine.route";
import adminAssignmentRoutes from "./admin-assignment.route"; // ✅ ADD THIS LINE

const router = Router();
const controller = new AdminUserController();

// Multer error handler
const handleMulterUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single("profileImage")(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 5MB",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

// Mount routine routes
router.use("/", adminRoutineRoutes);

// ✅ ADD THIS LINE - Mount assignment routes
router.use("/", adminAssignmentRoutes);

// All routes require auth + admin
// POST /api/admin/users - Create user (with optional image upload)
router.post(
  "/users",
  authMiddleware,
  adminMiddleware,
  handleMulterUpload,
  controller.createUser.bind(controller)
);

// GET /api/admin/users - Get all users
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  controller.getAllUsers.bind(controller)
);

// GET /api/admin/users/:id - Get user by ID
router.get(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  controller.getUserById.bind(controller)
);

// PUT /api/admin/users/:id - Update user (with optional image upload)
router.put(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  handleMulterUpload,
  controller.updateUser.bind(controller)
);

// DELETE /api/admin/users/:id - Delete user
router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  controller.deleteUser.bind(controller)
);

export default router;