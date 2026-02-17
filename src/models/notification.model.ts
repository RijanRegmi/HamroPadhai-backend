import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
  | "assignment_created"
  | "assignment_updated"
  | "routine_created"
  | "routine_updated"
  | "notice_created"
  | "notice_updated";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  recipientRole: "user" | "teacher";
  type: NotificationType;
  title: string;
  message: string;
  refId?: mongoose.Types.ObjectId;
  refModel?: "Assignment" | "Routine" | "Notice";
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientRole: { type: String, enum: ["user", "teacher"], required: true },
    type: {
      type: String,
      enum: [
        "assignment_created", "assignment_updated",
        "routine_created",    "routine_updated",
        "notice_created",     "notice_updated",
      ],
      required: true,
    },
    title:    { type: String, required: true },
    message:  { type: String, required: true },
    refId:    { type: Schema.Types.ObjectId, default: null },
    refModel: { type: String, enum: ["Assignment", "Routine", "Notice"], default: null },
    isRead:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const NotificationModel = mongoose.model<INotification>("Notification", NotificationSchema);