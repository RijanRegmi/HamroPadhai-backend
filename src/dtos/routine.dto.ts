import { z } from "zod";

const periodEntrySchema = z.object({
  periodNumber: z.number().min(1),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  subject: z.string().min(1, "Subject is required"),
  teacherId: z.string().nullable(), // Required field but can be null
  teacherName: z.string().min(1, "Teacher name is required"),
  roomNumber: z.string().optional().default(""),
});

const routineEntrySchema = z.object({
  day: z.enum(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
  periods: z.array(periodEntrySchema).min(1, "At least one period is required"),
});

export const createRoutineDTO = z.object({
  classId: z.string().min(1, "Class ID is required"),
  sectionId: z.string().min(1, "Section ID is required"),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY"),
  entries: z.array(routineEntrySchema).min(1, "At least one day entry is required"),
});

export const updateRoutineDTO = z.object({
  classId: z.string().min(1, "Class ID is required").optional(),
  sectionId: z.string().min(1, "Section ID is required").optional(),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY").optional(),
  entries: z.array(routineEntrySchema).min(1, "At least one day entry is required").optional(),
  isActive: z.boolean().optional(),
});

export const getRoutineQueryDTO = z.object({
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  academicYear: z.string().optional(),
  isActive: z.string().optional(), // "true" or "false"
});

export type CreateRoutineDTO = z.infer<typeof createRoutineDTO>;
export type UpdateRoutineDTO = z.infer<typeof updateRoutineDTO>;
export type GetRoutineQueryDTO = z.infer<typeof getRoutineQueryDTO>;