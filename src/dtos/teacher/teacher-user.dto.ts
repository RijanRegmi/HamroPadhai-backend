import { z } from "zod";


export const getUserDTO = z.object({
  id: z.string(),
});

export const getAllUsersQueryDTO = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: z.enum(["user", "admin", "teacher"]).optional(),
  search: z.string().optional(),
});

export type GetUserDTO = z.infer<typeof getUserDTO>;
export type GetAllUsersQueryDTO = z.infer<typeof getAllUsersQueryDTO>;