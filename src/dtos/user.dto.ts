import { z } from "zod";

export const registerDTO = z.object({
  fullName: z.string().min(3),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  gender: z.enum(["male", "female"]),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
});

export const loginDTO = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  rememberMe: z.boolean().optional(), 
});

export const updateProfileDTO = z.object({
  fullName: z.string().min(3).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  gender: z.enum(["male", "female"]).optional(),
  about: z.string().optional(),
  address: z.string().optional(),
  parentContact: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
});

// NEW: Password Reset DTOs
export const forgotPasswordDTO = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordDTO = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Verification code must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterDTO = z.infer<typeof registerDTO>;
export type LoginDTO = z.infer<typeof loginDTO>;
export type UpdateProfileDTO = z.infer<typeof updateProfileDTO>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordDTO>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordDTO>;