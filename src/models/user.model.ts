import mongoose, { Document, Schema } from "mongoose";
import { UserTypeWithObjectId } from "../types/user.type";

const UserSchema: Schema = new Schema<UserTypeWithObjectId>(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profileImage: { type: String, default: null },
    about: { type: String, default: "" },
    address: { type: String, default: "" },
    parentContact: { type: String, default: "" },
    classId: { type: String, default: null }, 
    sectionId: { type: String, default: null }, 
  },
  { timestamps: true }
);

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  gender: "male" | "female";
  role: "user" | "admin";
  profileImage: string | null;
  about: string;
  address: string;
  parentContact: string;
  classId: string | null;
  sectionId: string | null; 
  createdAt: Date;
  updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>("User", UserSchema);