import { Request, Response } from "express";
import TeacherUserService from "../../services/teacher/teacher-user.service";

const teacherUserService = new TeacherUserService();

export class TeacherUserController {
  // GET /api/teacher/users - Get all users (read-only)
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await teacherUserService.getAllUsers();

      return res.status(200).json({
        success: true,
        data: users.map((user) => ({
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          role: user.role,
          profileImage: user.profileImage,
          about: user.about,
          address: user.address,
          parentContact: user.parentContact,
          classId: user.classId,
          sectionId: user.sectionId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch users",
      });
    }
  }

  // GET /api/teacher/users/:id - Get user by ID (read-only)
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await teacherUserService.getUserById(id);

      return res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          role: user.role,
          profileImage: user.profileImage,
          about: user.about,
          address: user.address,
          parentContact: user.parentContact,
          classId: user.classId,
          sectionId: user.sectionId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch user",
      });
    }
  }

  // GET /api/teacher/users/role/:role - Get users by role
  async getUsersByRole(req: Request, res: Response) {
    try {
      const { role } = req.params;

      if (!["user", "admin", "teacher"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be 'user', 'admin', or 'teacher'",
        });
      }

      const users = await teacherUserService.getUsersByRole(role as "user" | "admin" | "teacher");

      return res.status(200).json({
        success: true,
        data: users.map((user) => ({
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          role: user.role,
          profileImage: user.profileImage,
          about: user.about,
          address: user.address,
          parentContact: user.parentContact,
          classId: user.classId,
          sectionId: user.sectionId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch users by role",
      });
    }
  }

  // GET /api/teacher/users/search?q=searchTerm - Search users
  async searchUsers(req: Request, res: Response) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const users = await teacherUserService.searchUsers(q);

      return res.status(200).json({
        success: true,
        data: users.map((user) => ({
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          role: user.role,
          profileImage: user.profileImage,
          about: user.about,
          address: user.address,
          parentContact: user.parentContact,
          classId: user.classId,
          sectionId: user.sectionId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to search users",
      });
    }
  }

  // GET /api/teacher/users/class/:classId - Get users by class
  async getUsersByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;

      const users = await teacherUserService.getUsersByClass(classId);

      return res.status(200).json({
        success: true,
        data: users.map((user) => ({
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          role: user.role,
          profileImage: user.profileImage,
          about: user.about,
          address: user.address,
          parentContact: user.parentContact,
          classId: user.classId,
          sectionId: user.sectionId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch users by class",
      });
    }
  }

  // GET /api/teacher/users/section/:sectionId - Get users by section
  async getUsersBySection(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;

      const users = await teacherUserService.getUsersBySection(sectionId);

      return res.status(200).json({
        success: true,
        data: users.map((user) => ({
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          role: user.role,
          profileImage: user.profileImage,
          about: user.about,
          address: user.address,
          parentContact: user.parentContact,
          classId: user.classId,
          sectionId: user.sectionId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch users by section",
      });
    }
  }
}