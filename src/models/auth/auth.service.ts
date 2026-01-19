import * as repo from "./auth.repository";
import { hashPassword, comparePassword } from "../../utils/hash";
import { generateToken } from "../../utils/jwt";

export const register = async (data: any) => {
  // console.log("SERVICE DATA:", data);   

  const exists = await repo.findByEmail(data.email);
  if (exists) throw new Error("Email already exists");

  const hashed = await hashPassword(data.password);

  const user = await repo.createUser({
    ...data,
    password: hashed,
  });

  // console.log("SAVED USER ID:", user._id.toString());

  return user;
};



export const login = async (data: any) => {
  const user = await repo.findByEmail(data.email);
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await comparePassword(data.password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = generateToken({
    id: user._id,
    role: user.role,
  });

  return { token };
};
