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

  // NEW: Admin methods
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
}