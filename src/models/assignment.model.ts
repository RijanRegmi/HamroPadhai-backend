import mongoose, { Document, Schema } from "mongoose";

// Submission interface
export interface ISubmission {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  submittedAt: Date;
  files: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string; // 'image', 'pdf', 'document', etc.
    fileSize: number; // in bytes
  }>;
  textContent?: string; // Optional text submission
  marks?: number; // Marks given by teacher
  feedback?: string; // Teacher's feedback
  gradedBy?: mongoose.Types.ObjectId; // Teacher who graded
  gradedAt?: Date;
}

// Assignment interface
export interface IAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  classId: string; // "11" or "12"
  sectionId: string; // "A", "B", "C", "D", "E"
  academicYear: string; // "2024-2025"
  
  // Assignment details
  totalMarks: number;
  dueDate: Date;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  }>;
  
  // Assigned Teacher (NEW)
  assignedTeacherId?: mongoose.Types.ObjectId; // Teacher responsible for this assignment
  
  // Submissions
  submissions: ISubmission[];
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdBy: mongoose.Types.ObjectId; // Admin who created
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema({
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  studentName: { 
    type: String, 
    required: true 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  files: [{
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
  }],
  textContent: { 
    type: String, 
    default: "" 
  },
  marks: { 
    type: Number, 
    default: null 
  },
  feedback: { 
    type: String, 
    default: "" 
  },
  gradedBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  },
  gradedAt: { 
    type: Date, 
    default: null 
  },
});

const AssignmentSchema: Schema<IAssignment> = new Schema(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    subject: { 
      type: String, 
      required: true 
    },
    classId: { 
      type: String, 
      required: true 
    },
    sectionId: { 
      type: String, 
      required: true 
    },
    academicYear: { 
      type: String, 
      required: true 
    },
    totalMarks: { 
      type: Number, 
      required: true,
      min: 0
    },
    dueDate: { 
      type: Date, 
      required: true 
    },
    attachments: [{
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
    }],
    // NEW: Assigned Teacher field
    assignedTeacherId: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      default: null 
    },
    submissions: [SubmissionSchema],
    isActive: { 
      type: Boolean, 
      default: true 
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
AssignmentSchema.index({ classId: 1, sectionId: 1, academicYear: 1 });
AssignmentSchema.index({ subject: 1 });
AssignmentSchema.index({ dueDate: 1 });
AssignmentSchema.index({ "submissions.studentId": 1 });
AssignmentSchema.index({ assignedTeacherId: 1 }); // NEW index

export const AssignmentModel = mongoose.model<IAssignment>("Assignment", AssignmentSchema);