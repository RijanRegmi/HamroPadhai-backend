export interface Assignment {
  _id: string;
  title: string;
  description: string;
  subject: string;
  classId: string;
  sectionId: string;
  academicYear: string;
  totalMarks: number;
  dueDate: string | Date;
  attachments?: FileAttachment[];
  submissions: Submission[];
  isActive: boolean;
  assignedTeacherId?: string;
  assignedTeacher?: {
    _id: string;
    fullName: string;
    username: string;
  };
  createdBy: {
    _id: string;
    fullName: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
  // Student-specific fields (when fetched by student)
  hasSubmitted?: boolean;
  isGraded?: boolean;
  mySubmission?: Submission;
}

export interface FileAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

export interface Submission {
  _id?: string;
  studentId: string;
  studentName: string;
  studentUsername?: string;
  submittedAt: Date | string;
  files: FileAttachment[];
  textContent?: string;
  marks?: number;
  feedback?: string;
  gradedBy?: string;
  gradedByName?: string;
  gradedAt?: Date | string;
}

export interface CreateAssignmentDTO {
  title: string;
  description: string;
  subject: string;
  classId: string;
  sectionId: string;
  academicYear: string;
  totalMarks: number;
  dueDate: string;
  assignedTeacherId?: string;
  attachments?: FileAttachment[];
}

export interface UpdateAssignmentDTO {
  title?: string;
  description?: string;
  subject?: string;
  totalMarks?: number;
  dueDate?: string;
  isActive?: boolean;
  attachments?: FileAttachment[];
}

export interface SubmitAssignmentDTO {
  files?: FileAttachment[];
  textContent?: string;
}

export interface GradeSubmissionDTO {
  studentId: string;
  marks: number;
  feedback?: string;
}

export interface Student {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  classId: string;
  sectionId: string;
}

export interface Teacher {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  classId: string;
  sectionId: string;
}