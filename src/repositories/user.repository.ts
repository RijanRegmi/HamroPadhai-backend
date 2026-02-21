import { UserModel, IUser } from "../models/user.model";

export class UserRepository {
  async createUser(data: Partial<IUser>): Promise<IUser> {
    const user = new UserModel(data);
    return user.save();
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email });
  }

  async getUserByUsername(username: string): Promise<IUser | null> {
    return UserModel.findOne({ username });
  }

  async getUserByPhone(phone: string): Promise<IUser | null> {
    return UserModel.findOne({ phone });
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return UserModel.findById(userId);
  }

  async updateProfileImage(userId: string, imageUrl: string): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    );
  }

  async updateUserProfile(userId: string, data: Partial<IUser>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async isEmailTakenByOther(email: string, userId: string): Promise<boolean> {
    const user = await UserModel.findOne({ email, _id: { $ne: userId } });
    return !!user;
  }

  async isPhoneTakenByOther(phone: string, userId: string): Promise<boolean> {
    const user = await UserModel.findOne({ phone, _id: { $ne: userId } });
    return !!user;
  }

  // Admin methods
  async getAllUsers(): Promise<IUser[]> {
    return UserModel.find().select("-password");
  }

  async deleteUser(userId: string): Promise<IUser | null> {
    return UserModel.findByIdAndDelete(userId);
  }

  async isUsernameTakenByOther(username: string, userId: string): Promise<boolean> {
    const user = await UserModel.findOne({ username, _id: { $ne: userId } });
    return !!user;
  }

  // Password Reset Methods
  async setResetPasswordCode(userId: string, code: string, expiresAt: Date): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      { 
        resetPasswordCode: code,
        resetPasswordExpires: expiresAt
      },
      { new: true }
    );
  }

  async getUserByResetCode(email: string, code: string): Promise<IUser | null> {
    return UserModel.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: new Date() }
    });
  }

  async clearResetPasswordCode(userId: string): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      { 
        resetPasswordCode: null,
        resetPasswordExpires: null
      },
      { new: true }
    );
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );
  }

  // ✅ NEW: Sets passwordChangedAt to invalidate all existing tokens on other devices
  async updatePasswordChangedAt(userId: string, date: Date): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      { passwordChangedAt: date },
      { new: true }
    );
  }

  // Teacher-specific query methods
  async getUsersByRole(role: "user" | "admin" | "teacher"): Promise<IUser[]> {
    return UserModel.find({ role }).select("-password");
  }

  async searchUsers(searchTerm: string): Promise<IUser[]> {
    return UserModel.find({
      $or: [
        { fullName: { $regex: searchTerm, $options: "i" } },
        { username: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
      ],
    }).select("-password");
  }

  async getUsersByClass(classId: string): Promise<IUser[]> {
    return UserModel.find({ classId }).select("-password");
  }

  async getUsersBySection(sectionId: string): Promise<IUser[]> {
    return UserModel.find({ sectionId }).select("-password");
  }

  async getUsersByClassAndSection(classId: string, sectionId: string) {
    return UserModel.find({
      classId: classId,
      sectionId: sectionId,
    }).select("-password");
  }
}