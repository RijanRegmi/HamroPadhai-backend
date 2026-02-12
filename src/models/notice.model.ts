import mongoose, { Document, Schema } from "mongoose";

// Notice interface
export interface INotice extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  priority: "low" | "medium" | "high" | "urgent";
  
  // Updated structure: array of objects with classId and sections
  targetClasses: Array<{
    classId: string;
    sections: string[];
  }>;
  
  // Optional attachments
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
  }>;
  
  // Status
  isActive: boolean;
  isPinned: boolean; // For important notices
  
  // Schedule
  publishDate: Date; // When to publish the notice
  expiryDate?: Date; // Optional: when notice expires
  
  // Metadata
  createdBy: mongoose.Types.ObjectId; // Admin who created
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }>; // Track who has read the notice
  
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema: Schema<INotice> = new Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 200
    },
    content: { 
      type: String, 
      required: true,
      maxlength: 5000
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    targetClasses: [{
      classId: {
        type: String,
        required: true
      },
      sections: [{
        type: String,
        required: true
      }]
    }],
    attachments: [{
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
      fileSize: { type: Number },
    }],
    isActive: { 
      type: Boolean, 
      default: true 
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    publishDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      default: null
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    readBy: [{
      userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User" 
      },
      readAt: { 
        type: Date, 
        default: Date.now 
      }
    }]
  },
  { timestamps: true }
);

// Indexes for better query performance
NoticeSchema.index({ "targetClasses.classId": 1, "targetClasses.sections": 1 });
NoticeSchema.index({ publishDate: 1, expiryDate: 1 });
NoticeSchema.index({ isActive: 1, isPinned: 1 });
NoticeSchema.index({ createdBy: 1 });
NoticeSchema.index({ "readBy.userId": 1 });

export const NoticeModel = mongoose.model<INotice>("Notice", NoticeSchema);