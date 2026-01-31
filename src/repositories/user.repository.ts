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
}