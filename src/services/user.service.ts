import { RegisterDTO, LoginDTO, UpdateProfileDTO, ForgotPasswordDTO, ResetPasswordDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import { HttpError } from "../errors/http.error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { sendEmail } from "../config/email";

const userRepository = new UserRepository();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

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

    const userData: any = {
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      gender: data.gender,
      classId: data.classId || null,
      sectionId: data.sectionId || null,
    };

    const user = await userRepository.createUser(userData);

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

    const tokenExpiry = data.rememberMe ? "30d" : "7d";

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );
    
    const userWithoutPassword = {
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      role: user.role,
      profileImage: user.profileImage,
      about: user.about || "",
      address: user.address || "",
      parentContact: user.parentContact || "",
      classId: user.classId,
      sectionId: user.sectionId,
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

  async updateProfile(userId: string, data: UpdateProfileDTO) {
    if (data.email) {
      const emailTaken = await userRepository.isEmailTakenByOther(data.email, userId);
      if (emailTaken) {
        throw new HttpError(409, "Email already exists");
      }
    }

    if (data.phone) {
      const phoneTaken = await userRepository.isPhoneTakenByOther(data.phone, userId);
      if (phoneTaken) {
        throw new HttpError(409, "Phone number already exists");
      }
    }

    const updateData: any = {};
    
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.gender) updateData.gender = data.gender;
    if (data.about !== undefined) updateData.about = data.about;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.parentContact !== undefined) updateData.parentContact = data.parentContact;

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

  // ============================================
  // CHANGED: Send Password Reset Code
  // Changed error message when email not found
  // ============================================
  async sendPasswordResetCode(data: ForgotPasswordDTO) {
    const user = await userRepository.getUserByEmail(data.email);
    
    if (!user) {
      // ❌ OLD: return { message: "If the email is registered, a verification code has been sent." };
      // ✅ NEW: Throw specific error
      throw new HttpError(404, "This email hasn't been registered");
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry time (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save code to database
    await userRepository.setResetPasswordCode(user._id.toString(), code, expiresAt);

    // Send email with verification code
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">HamroPadhai</h1>
        </div>
        
        <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hello <strong>${user.fullName}</strong>,
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password. Use the verification code below to proceed:
          </p>
          
          <div style="background: #f7f7f7; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
            <p style="color: #333; font-size: 14px; margin: 0 0 10px 0;">Your verification code:</p>
            <h1 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; display: inline-block; border-radius: 8px; letter-spacing: 8px; margin: 0; font-size: 32px;">
              ${code}
            </h1>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            ⏰ This code will <strong>expire in 15 minutes</strong>.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            This is an automated message from HamroPadhai. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    await sendEmail(
      user.email,
      "HamroPadhai - Password Reset Verification Code",
      emailHtml
    );

    return { message: "Verification code sent to your email" };
  }

  // ============================================
  // NEW METHOD: Verify Reset Code
  // This verifies the code on the verification page
  // ============================================
  async verifyResetCode(email: string, code: string) {
    const user = await userRepository.getUserByResetCode(email, code);
    
    if (!user) {
      throw new HttpError(400, "Verification code doesn't match");
    }

    // Return user to confirm code is valid
    return user;
  }
  // ============================================

  // Reset Password with Code
  async resetPassword(data: ResetPasswordDTO) {
    const user = await userRepository.getUserByResetCode(data.email, data.code);
    
    if (!user) {
      throw new HttpError(400, "Invalid or expired verification code");
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(data.newPassword, 10);

    // Update password
    await userRepository.updatePassword(user._id.toString(), hashedPassword);

    // Clear reset code
    await userRepository.clearResetPasswordCode(user._id.toString());

    // Send confirmation email
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">HamroPadhai</h1>
        </div>
        
        <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Successful</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hello <strong>${user.fullName}</strong>,
          </p>
          
          <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #2e7d32; font-size: 16px; margin: 0;">
              ✅ Your password has been successfully reset.
            </p>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You can now log in to your account using your new password.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you did not make this change, please contact our support team immediately.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            This is an automated message from HamroPadhai. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    await sendEmail(
      user.email,
      "HamroPadhai - Password Reset Successful",
      confirmationHtml
    );

    return { message: "Password reset successfully" };
  }
}