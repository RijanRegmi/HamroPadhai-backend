import { z } from "zod";

// ==================== CREATE ASSIGNMENT DTO ====================
export const createAssignmentDTO = z.object({
  title:        z.string().min(1, "Title is required").max(100, "Title too long"),
  description:  z.string().min(1, "Description is required").max(1000, "Description too long"),
  subject:      z.string().min(1, "Subject is required"),
  classId:      z.string().min(1, "Class is required"),
  sectionId:    z.string().min(1, "Section is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  totalMarks:   z.number().min(1, "Total marks must be at least 1").max(1000, "Total marks cannot exceed 1000"),
  dueDate:      z.string().min(1, "Due date is required"),
  // ✅ CHANGED: array, at least one required
  assignedTeacherIds: z.array(z.string().min(1)).min(1, "At least one teacher must be assigned"),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl:  z.string(),
    fileType: z.string(),
    fileSize: z.number().optional(),
  })).optional(),
});

export type CreateAssignmentDTO = z.infer<typeof createAssignmentDTO>;

// ==================== UPDATE ASSIGNMENT DTO ====================
export const updateAssignmentDTO = z.object({
  title:        z.string().min(1).max(100).optional(),
  description:  z.string().min(1).max(1000).optional(),
  subject:      z.string().min(1).optional(),
  totalMarks:   z.number().min(1).max(1000).optional(),
  dueDate:      z.string().optional(),
  isActive:     z.boolean().optional(),
  // ✅ CHANGED: array, optional for updates
  assignedTeacherIds: z.array(z.string().min(1)).optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl:  z.string(),
    fileType: z.string(),
    fileSize: z.number().optional(),
  })).optional(),
});

export type UpdateAssignmentDTO = z.infer<typeof updateAssignmentDTO>;

// ==================== SUBMIT ASSIGNMENT DTO ====================
export const submitAssignmentDTO = z.object({
  files: z.array(z.object({
    fileName: z.string(),
    fileUrl:  z.string(),
    fileType: z.string(),
    fileSize: z.number().optional(),
  })).optional(),
  textContent: z.string().optional(),
});

export type SubmitAssignmentDTO = z.infer<typeof submitAssignmentDTO>;

// ==================== GRADE SUBMISSION DTO ====================
export const gradeSubmissionDTO = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  marks:     z.number().min(0, "Marks cannot be negative"),
  feedback:  z.string().optional(),
});

export type GradeSubmissionDTO = z.infer<typeof gradeSubmissionDTO>;