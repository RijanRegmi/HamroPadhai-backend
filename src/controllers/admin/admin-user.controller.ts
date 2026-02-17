import { Request, Response } from "express";
import { AdminUserService } from "../../services/admin/admin-user.service";
import { createUserByAdminDTO, updateUserByAdminDTO } from "../../dtos/admin/admin-user.dto";

const adminUserService = new AdminUserService();

export class AdminUserController {
  // POST /api/admin/users - Create user with optional image
  async createUser(req: Request, res: Response) {
    try {
      const parsed = createUserByAdminDTO.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }

      // Create user data
      const userData: any = { ...parsed.data };

      // Add profile image if uploaded
      if (req.file) {
        userData.profileImage = `/uploads/profiles/${req.file.filename}`;
      }

      const user = await adminUserService.createUser(userData);

      return res.status(201).json({
        success: true,
        message: "User created successfully",
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
        },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to create user",
      });
    }
  }

  // GET /api/admin/users - Get all users
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await adminUserService.getAllUsers();

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

  // GET /api/admin/users/:id - Get user by ID
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await adminUserService.getUserById(id);

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

  // PUT /api/admin/users/:id - Update user with optional image
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const parsed = updateUserByAdminDTO.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }

      // Update user data
      const updateData: any = { ...parsed.data };

      // Add profile image if uploaded
      if (req.file) {
        updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
      }

      const user = await adminUserService.updateUser(id, updateData);

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
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
        },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update user",
      });
    }
  }

  // DELETE /api/admin/users/:id - Delete user
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await adminUserService.deleteUser(id);

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to delete user",
      });
    }
  }
}