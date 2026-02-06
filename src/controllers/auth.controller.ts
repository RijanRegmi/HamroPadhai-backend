import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { registerDTO, loginDTO, updateProfileDTO, forgotPasswordDTO, resetPasswordDTO } from "../dtos/user.dto";
import { ZodError } from "zod";

const userService = new UserService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const parsed = registerDTO.safeParse(req.body);
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

      const user = await userService.register(parsed.data);
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
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
        },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Registration failed",
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const parsed = loginDTO.safeParse(req.body);
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

      const result = await userService.login(parsed.data);
      
      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token: result.token,
          user: {
            _id: result.user._id,
            fullName: result.user.fullName,
            username: result.user.username,
            email: result.user.email,
            phone: result.user.phone,
            gender: result.user.gender,
            role: result.user.role,
            profileImage: result.user.profileImage,
            about: result.user.about,
            address: result.user.address,
            parentContact: result.user.parentContact,
          },
        },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Login failed",
      });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await userService.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

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
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch profile",
      });
    }
  }

  async uploadProfileImage(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      console.log("File uploaded successfully:", {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      });

      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      const user = await userService.updateProfileImage(userId, imageUrl);

      return res.status(200).json({
        success: true,
        message: "Profile image updated successfully",
        data: {
          profileImage: user.profileImage,
        },
      });
    } catch (error: any) {
      console.error("Error in uploadProfileImage:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to upload profile image",
      });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const parsed = updateProfileDTO.safeParse(req.body);
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

      const user = await userService.updateProfile(userId, parsed.data);

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
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
        },
      });
    } catch (error: any) {
      console.error("Error in updateProfile:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update profile",
      });
    }
  }

  async updateUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const loggedInUserId = (req as any).user?.id;

      if (!loggedInUserId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (loggedInUserId !== id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden - You can only update your own profile",
        });
      }

      const parsed = updateProfileDTO.safeParse(req.body);
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

      const updateData: any = { ...parsed.data };

      if (req.file) {
        updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
      }

      const user = await userService.updateProfile(id, updateData);

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
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
        },
      });
    } catch (error: any) {
      console.error("Error in updateUserById:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update profile",
      });
    }
  }

  // Forgot Password - Send Verification Code
  async forgotPassword(req: Request, res: Response) {
    try {
      const parsed = forgotPasswordDTO.safeParse(req.body);
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

      const result = await userService.sendPasswordResetCode(parsed.data);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error("Error in forgotPassword:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to send verification code",
      });
    }
  }

  // ============================================
  // NEW METHOD: Verify Code
  // ============================================
  async verifyCode(req: Request, res: Response) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: "Email and code are required",
        });
      }

      // Verify the code through service
      await userService.verifyResetCode(email, code);

      return res.status(200).json({
        success: true,
        message: "Code verified successfully",
      });
    } catch (error: any) {
      console.error("Error in verifyCode:", error);
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Failed to verify code",
      });
    }
  }
  // ============================================

  // Reset Password with Verification Code
  async resetPassword(req: Request, res: Response) {
    try {
      const parsed = resetPasswordDTO.safeParse(req.body);
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

      const result = await userService.resetPassword(parsed.data);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error("Error in resetPassword:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to reset password",
      });
    }
  }
}