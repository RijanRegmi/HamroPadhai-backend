import { Router } from "express";
import { StudentRoutineController } from "./../controllers/student-routine.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { studentMiddleware } from "../middlewares/student/student.middleware";

const router = Router();
const controller = new StudentRoutineController();

router.get("/my",     authMiddleware, studentMiddleware, controller.getMyRoutine.bind(controller));

router.get("/my/all", authMiddleware, studentMiddleware, controller.getAllMyRoutines.bind(controller));

router.get("/:id",    authMiddleware, studentMiddleware, controller.getRoutineById.bind(controller));

export default router;