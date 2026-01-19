import { Request, Response } from "express";
import * as service from "./auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const user = await service.register(req.body);
    res.status(201).json({ message: "User registered", user });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = await service.login(req.body);
    res.json({ message: "Login successful", ...data });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
