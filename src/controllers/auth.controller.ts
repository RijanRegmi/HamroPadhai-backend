import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { registerDTO, loginDTO } from "../dtos/user.dto";
import z from "zod";

const userService = new UserService();

export class AuthController {
  async register(req: Request, res: Response) {
    const parsed = registerDTO.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: z.prettifyError(parsed.error),
      });
    }

    const user = await userService.register(parsed.data);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  }

  async login(req: Request, res: Response) {
    const parsed = loginDTO.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: z.prettifyError(parsed.error),
      });
    }

    const result = await userService.login(parsed.data);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      ...result,
    });
  }
}
