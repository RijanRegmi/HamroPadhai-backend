import { UserModel, IUser } from "../models/user.model";

export class UserRepository {
  async createUser(data: Partial<IUser>): Promise<IUser> {
    const user = new UserModel(data);
    return user.save();
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email });
  }
}
