import { RegisterDTO, LoginDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import { HttpError } from "../errors/http.error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

const userRepository = new UserRepository();

export class UserService {
  async register(data: RegisterDTO) {
    const usernameExists = await userRepository.getUserByUsername(data.username);
    if (usernameExists) {
      throw new HttpError(409, "Username already exists");
    }

    const emailExists = await userRepository.getUserByEmail(data.email);
    if (emailExists) {
      throw new HttpError(409, "Email already exists");
    }

    const phoneExists = await userRepository.getUserByPhone(data.phone);
    if (phoneExists) {
      throw new HttpError(409, "Phone number already exists");
    }

    const hashedPassword = await bcryptjs.hash(data.password, 10);

    const user = await userRepository.createUser({
      ...data,
      password: hashedPassword,
    });

    return user;
  }

  async login(data: LoginDTO) {
    const user = await userRepository.getUserByUsername(data.username);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const valid = await bcryptjs.compare(data.password, user.password);
    if (!valid) {
      throw new HttpError(401, "Invalid credentials");
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Return user object without password
    const userWithoutPassword = {
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      role: user.role,
      profileImage: user.profileImage,
    };

    return { 
      token, 
      user: userWithoutPassword 
    };
  }

  async getUserById(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user;
  }

  async updateProfileImage(userId: string, imageUrl: string) {
    const user = await userRepository.updateProfileImage(userId, imageUrl);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user;
  }
}