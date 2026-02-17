import { CreateUserByAdminDTO, UpdateUserByAdminDTO } from "../../dtos/admin/admin-user.dto";
import { UserRepository } from "../../repositories/user.repository";
import bcryptjs from "bcryptjs";
import { HttpError } from "../../errors/http.error";

const userRepository = new UserRepository();

export class AdminUserService {
  async createUser(data: CreateUserByAdminDTO & { profileImage?: string }) {
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

    const userData: any = {
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      gender: data.gender,
      role: data.role || "user",
      about: data.about || "",
      address: data.address || "",
      parentContact: data.parentContact || "",
      classId: data.classId || null,
      sectionId: data.sectionId || null,
    };

    if (data.profileImage) {
      userData.profileImage = data.profileImage;
    }

    const user = await userRepository.createUser(userData);

    return user;
  }

  async getAllUsers() {
    const users = await userRepository.getAllUsers();
    return users;
  }

  async getUserById(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user;
  }

  async updateUser(userId: string, data: UpdateUserByAdminDTO & { profileImage?: string }) {
    const existingUser = await userRepository.getUserById(userId);
    if (!existingUser) {
      throw new HttpError(404, "User not found");
    }

    if (data.username && data.username !== existingUser.username) {
      const usernameTaken = await userRepository.isUsernameTakenByOther(data.username, userId);
      if (usernameTaken) {
        throw new HttpError(409, "Username already exists");
      }
    }

    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await userRepository.isEmailTakenByOther(data.email, userId);
      if (emailTaken) {
        throw new HttpError(409, "Email already exists");
      }
    }

    if (data.phone && data.phone !== existingUser.phone) {
      const phoneTaken = await userRepository.isPhoneTakenByOther(data.phone, userId);
      if (phoneTaken) {
        throw new HttpError(409, "Phone number already exists");
      }
    }

    const updateData: any = {};

    if (data.fullName) updateData.fullName = data.fullName;
    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.gender) updateData.gender = data.gender;
    if (data.role) updateData.role = data.role;
    if (data.about !== undefined) updateData.about = data.about;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.parentContact !== undefined) updateData.parentContact = data.parentContact;

    if (data.password) {
      updateData.password = await bcryptjs.hash(data.password, 10);
    }

    if (data.profileImage) {
      updateData.profileImage = data.profileImage;
    }

    if (data.classId !== undefined) {
      updateData.classId = data.classId || null;
    }

    if (data.sectionId !== undefined) {
      updateData.sectionId = data.sectionId || null;
    }

    const user = await userRepository.updateUserProfile(userId, updateData);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }

  async deleteUser(userId: string) {
    const user = await userRepository.deleteUser(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user;
  }

  async updateUserProfileImage(userId: string, imageUrl: string) {
    const user = await userRepository.updateProfileImage(userId, imageUrl);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user;
  }
}