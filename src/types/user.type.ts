import z from "zod";

export const UserSchema = z.object({
  fullName: z.string().min(3),
  username: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  gender: z.enum(["male", "female"]),
  role: z.enum(["user", "admin", "teacher"]).default("user"), 
  profileImage: z.string().optional().nullable(),
  about: z.string().optional(),
  address: z.string().optional(),
  parentContact: z.string().optional(),
  classId: z.string().optional().nullable(), 
  sectionId: z.string().optional().nullable(),
  resetPasswordCode: z.string().optional().nullable(),
  resetPasswordExpires: z.date().optional().nullable(),
});

export type UserType = z.infer<typeof UserSchema>;

export type UserTypeWithObjectId = UserType;