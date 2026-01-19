import { User } from "../../models/user.model";

export const findByEmail = (email: string) => {
  return User.findOne({ email });
};

export const createUser = (data: any) => {
  return User.create(data);
};
