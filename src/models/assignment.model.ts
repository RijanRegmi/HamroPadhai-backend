import mongoose, { Document, Schema } from "mongoose";

export interface ISubmission {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  submittedAt: Date;
  files: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  textContent?: string;
  marks?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
}

export interface IAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  classId: string;
  sectionId: string;
  academicYear: string;
  totalMarks: number;
  dueDate: Date;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  }>;
  // ✅ CHANGED: array of teachers
  assignedTeacherIds: mongoose.Types.ObjectId[];
  submissions: ISubmission[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema({
  studentId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  files: [{
    fileName: { type: String, required: true },
    fileUrl:  { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
  }],
  textContent: { type: String, default: "" },
  marks:       { type: Number, default: null },
  feedback:    { type: String, default: "" },
  gradedBy:    { type: Schema.Types.ObjectId, ref: "User", default: null },
  gradedAt:    { type: Date, default: null },
});

const AssignmentSchema: Schema<IAssignment> = new Schema(
  {
    title:        { type: String, required: true },
    description:  { type: String, required: true },
    subject:      { type: String, required: true },
    classId:      { type: String, required: true },
    sectionId:    { type: String, required: true },
    academicYear: { type: String, required: true },
    totalMarks:   { type: Number, required: true, min: 0 },
    dueDate:      { type: Date,   required: true },
    attachments: [{
      fileName: { type: String },
      fileUrl:  { type: String },
      fileType: { type: String },
    }],
    // ✅ CHANGED: array field
    assignedTeacherIds: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    submissions: [SubmissionSchema],
    isActive:   { type: Boolean, default: true },
    createdBy:  { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ classId: 1, sectionId: 1, academicYear: 1 });
AssignmentSchema.index({ subject: 1 });
AssignmentSchema.index({ dueDate: 1 });
AssignmentSchema.index({ "submissions.studentId": 1 });
AssignmentSchema.index({ assignedTeacherIds: 1 }); // ✅ updated index

export const AssignmentModel = mongoose.model<IAssignment>("Assignment", AssignmentSchema);