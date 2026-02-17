import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http.error";

const userRepository = new UserRepository();

class TeacherUserService {
  // Get all users (read-only)
  async getAllUsers() {
    const users = await userRepository.getAllUsers();
    return users;
  }

  // Get user by ID (read-only)
  async getUserById(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user;
  }

  // Get users by role (read-only)
  async getUsersByRole(role: "user" | "admin" | "teacher") {
    const users = await userRepository.getUsersByRole(role);
    return users;
  }

  // Search users (read-only)
  async searchUsers(searchTerm: string) {
    const users = await userRepository.searchUsers(searchTerm);
    return users;
  }

  // Get users by class (read-only)
  async getUsersByClass(classId: string) {
    const users = await userRepository.getUsersByClass(classId);
    return users;
  }

  // Get users by section (read-only)
  async getUsersBySection(sectionId: string) {
    const users = await userRepository.getUsersBySection(sectionId);
    return users;
  }
}

export default TeacherUserService;