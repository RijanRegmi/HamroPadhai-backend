import mongoose, { Document, Schema } from "mongoose";

// Define interface first
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  gender: "male" | "female";
  role: "user" | "admin" | "teacher";
  profileImage: string | null;
  about: string;
  address: string;
  parentContact: string;
  classId: string | null;
  sectionId: string | null;
  resetPasswordCode: string | null;
  resetPasswordExpires: Date | null;
  passwordChangedAt: Date | null;
  fcmTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    role: {
      type: String,
      enum: ["user", "admin", "teacher"],
      default: "user",
    },
    profileImage: { type: String, default: null },
    about: { type: String, default: "" },
    address: { type: String, default: "" },
    parentContact: { type: String, default: "" },
    // Can store either: "11" (student) or '["11","12"]' (teacher)
    classId: { type: String, default: null },
    sectionId: { type: String, default: null },

    resetPasswordCode: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null }, // ✅ Used to invalidate tokens on other devices

    // ✅ FCM: array so one user can have tokens on multiple devices
    fcmTokens: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);