import { z } from "zod";

// For creating user by admin (no password confirmation needed)
export const createUserByAdminDTO = z.object({
  fullName: z.string().min(3),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  gender: z.enum(["male", "female"]),
  role: z.enum(["user", "admin"]).optional().default("user"),
  about: z.string().optional(),
  address: z.string().optional(),
  parentContact: z.string().optional(),
  classId: z.string().optional(), // NEW: Added classId
  sectionId: z.string().optional(), // NEW: Added sectionId
});

// For updating user by admin (all fields optional)
export const updateUserByAdminDTO = z.object({
  fullName: z.string().min(3).optional(),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(6).optional(),
  gender: z.enum(["male", "female"]).optional(),
  role: z.enum(["user", "admin"]).optional(),
  about: z.string().optional(),
  address: z.string().optional(),
  parentContact: z.string().optional(),
  classId: z.string().optional(), // NEW: Added classId
  sectionId: z.string().optional(), // NEW: Added sectionId
});

export type CreateUserByAdminDTO = z.infer<typeof createUserByAdminDTO>;
export type UpdateUserByAdminDTO = z.infer<typeof updateUserByAdminDTO>;