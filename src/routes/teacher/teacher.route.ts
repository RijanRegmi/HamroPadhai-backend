import { Router } from "express";
import { TeacherUserController } from "./../../controllers/teacher/teacher-user.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { teacherMiddleware } from "../../middlewares/teacher/teacher.middleware";
import teacherRoutineRoutes from "./teacher-routine.route";
import teacherAssignmentRoutes from "./teacher-assignment.route"; // ✅ ADD THIS IMPORT

const router = Router();
const controller = new TeacherUserController();

// Mount routine routes
router.use("/", teacherRoutineRoutes);

// ✅ ADD THIS LINE - Mount assignment routes
router.use("/assignments", teacherAssignmentRoutes);

// All routes require auth + teacher role

// GET /api/teacher/users - Get all users (read-only)
router.get(
  "/users",
  authMiddleware,
  teacherMiddleware,
  controller.getAllUsers.bind(controller)
);

// GET /api/teacher/users/search?q=searchTerm - Search users
router.get(
  "/users/search",
  authMiddleware,
  teacherMiddleware,
  controller.searchUsers.bind(controller)
);

// GET /api/teacher/users/role/:role - Get users by role
router.get(
  "/users/role/:role",
  authMiddleware,
  teacherMiddleware,
  controller.getUsersByRole.bind(controller)
);

// GET /api/teacher/users/class/:classId - Get users by class
router.get(
  "/users/class/:classId",
  authMiddleware,
  teacherMiddleware,
  controller.getUsersByClass.bind(controller)
);

// GET /api/teacher/users/section/:sectionId - Get users by section
router.get(
  "/users/section/:sectionId",
  authMiddleware,
  teacherMiddleware,
  controller.getUsersBySection.bind(controller)
);

// GET /api/teacher/users/:id - Get user by ID (read-only)
router.get(
  "/users/:id",
  authMiddleware,
  teacherMiddleware,
  controller.getUserById.bind(controller)
);

export default router;