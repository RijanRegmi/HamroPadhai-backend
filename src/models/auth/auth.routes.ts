import { Router } from "express";
import * as controller from "./auth.controller";
import { validate } from "../../middlewares/validate";
import { registerDTO, loginDTO } from "./auth.dto";

const router = Router();

router.post("/register", validate(registerDTO), controller.register);
router.post("/login", validate(loginDTO), controller.login);

export default router;
