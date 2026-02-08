import mongoose, { Document, Schema } from "mongoose";

export interface IRoutineEntry {
  day: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  periods: Array<{
    periodNumber: number;
    startTime: string; // "09:00"
    endTime: string; // "09:45"
    subject: string;
    teacherId: string | null;
    teacherName: string;
    roomNumber?: string;
  }>;
}

export interface IRoutine extends Document {
  _id: mongoose.Types.ObjectId;
  classId: string;
  sectionId: string;
  academicYear: string; // "2024-2025"
  entries: IRoutineEntry[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema: Schema<IRoutine> = new Schema(
  {
    classId: { type: String, required: true },
    sectionId: { type: String, required: true },
    academicYear: { type: String, required: true },
    entries: [
      {
        day: {
          type: String,
          enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          required: true,
        },
        periods: [
          {
            periodNumber: { type: Number, required: true },
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
            subject: { type: String, required: true },
            teacherId: { type: String, default: null },
            teacherName: { type: String, required: true },
            roomNumber: { type: String, default: "" },
          },
        ],
      },
    ],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Compound index to ensure one active routine per class-section-year
RoutineSchema.index({ classId: 1, sectionId: 1, academicYear: 1, isActive: 1 });

export const RoutineModel = mongoose.model<IRoutine>("Routine", RoutineSchema);
