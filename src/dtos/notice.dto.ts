import { z } from "zod";

// ==================== CREATE NOTICE DTO ====================
export const createNoticeDTO = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  
  targetClasses: z.array(
    z.object({
      classId: z.string().min(1, "Class ID cannot be empty"),
      sections: z.array(z.string().min(1, "Section cannot be empty")).min(1, "At least one section required")
    })
  ).min(1, "At least one class-section pair must be selected"),
  
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    fileType: z.string(),
    fileSize: z.number().optional(),
  })).optional(),
});

export type CreateNoticeDTO = z.infer<typeof createNoticeDTO>;

// ==================== UPDATE NOTICE DTO ====================
export const updateNoticeDTO = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  
  targetClasses: z.array(
    z.object({
      classId: z.string().min(1, "Class ID cannot be empty"),
      sections: z.array(z.string().min(1, "Section cannot be empty")).min(1, "At least one section required")
    })
  ).min(1).optional(),
  
  isActive: z.boolean().optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    fileType: z.string(),
    fileSize: z.number().optional(),
  })).optional(),
});

export type UpdateNoticeDTO = z.infer<typeof updateNoticeDTO>;

// ==================== MARK AS READ DTO ====================
export const markAsReadDTO = z.object({
  noticeId: z.string().min(1, "Notice ID is required"),
});

export type MarkAsReadDTO = z.infer<typeof markAsReadDTO>;

// ==================== QUERY NOTICES DTO ====================
export const queryNoticesDTO = z.object({
  priority: z.enum(["low", "medium", "high"]).optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  isActive: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
});

export type QueryNoticesDTO = z.infer<typeof queryNoticesDTO>;