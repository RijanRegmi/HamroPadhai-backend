import { RegisterDTO, LoginDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import { HttpError } from "../errors/http.error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

const userRepository = new UserRepository();

export class UserService {
  async register(data: RegisterDTO) {
    const emailExists = await userRepository.getUserByEmail(data.email);
    if (emailExists) {
      throw new HttpError(409, "Email already exists");
    }

    const hashedPassword = await bcryptjs.hash(data.password, 10);

    const user = await userRepository.createUser({
      ...data,
      password: hashedPassword,
    });

    return user;
  }

  async login(data: LoginDTO) {
    const user = await userRepository.getUserByEmail(data.email);
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
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return { token, user };
  }
}
