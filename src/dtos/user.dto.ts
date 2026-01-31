import { z } from "zod";

export const registerDTO = z.object({
  fullName: z.string().min(3),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  gender: z.enum(["male", "female"]),
});

export const loginDTO = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export type RegisterDTO = z.infer<typeof registerDTO>;
export type LoginDTO = z.infer<typeof loginDTO>;