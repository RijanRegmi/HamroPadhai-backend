import { z } from "zod";

export const registerDTO = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  gender: z.enum(["male", "female"]),
});

export const loginDTO = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterDTO = z.infer<typeof registerDTO>;
export type LoginDTO = z.infer<typeof loginDTO>;
