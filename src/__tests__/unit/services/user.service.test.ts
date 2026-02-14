import { UserService } from "../../../services/user.service";
import { UserModel } from "../../../models/user.model";
import bcryptjs from "bcryptjs";

// Mock sendEmail so no real emails fire during tests
jest.mock("../../../config/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

describe("UserService Unit Tests", () => {
  let userService: UserService;

  const baseRegisterData = {
    fullName: "Service User",
    username: "serviceuser",
    email: "service@example.com",
    phone: "9800111222",
    password: "Password123!",
    gender: "female" as const,
  };

  beforeAll(() => {
    userService = new UserService();
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
    jest.clearAllMocks();
  });

  // ─── register ─────────────────────────────────────────────────────────────
  describe("register", () => {
    test("should register a new user successfully", async () => {
      const user = await userService.register(baseRegisterData);

      expect(user).toBeDefined();
      expect(user.fullName).toBe(baseRegisterData.fullName);
      expect(user.username).toBe(baseRegisterData.username);
      expect(user.email).toBe(baseRegisterData.email);
    });

    test("should hash the password on registration", async () => {
      const user = await userService.register(baseRegisterData);
      const isHashed = await bcryptjs.compare(
        baseRegisterData.password,
        user.password
      );
      expect(isHashed).toBe(true);
    });

    test("should throw 409 if username already exists", async () => {
      await userService.register(baseRegisterData);
      await expect(
        userService.register({
          ...baseRegisterData,
          email: "new@test.com",
          phone: "9811111111",
        })
      ).rejects.toMatchObject({ statusCode: 409, message: "Username already exists" });
    });

    test("should throw 409 if email already exists", async () => {
      await userService.register(baseRegisterData);
      await expect(
        userService.register({
          ...baseRegisterData,
          username: "newuser",
          phone: "9811111111",
        })
      ).rejects.toMatchObject({ statusCode: 409, message: "Email already exists" });
    });

    test("should throw 409 if phone already exists", async () => {
      await userService.register(baseRegisterData);
      await expect(
        userService.register({
          ...baseRegisterData,
          username: "newuser",
          email: "new@test.com",
        })
      ).rejects.toMatchObject({ statusCode: 409, message: "Phone number already exists" });
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────
  describe("login", () => {
    beforeEach(async () => {
      await userService.register(baseRegisterData);
    });

    test("should login with correct credentials", async () => {
      const result = await userService.login({
        username: baseRegisterData.username,
        password: baseRegisterData.password,
      });

      expect(result).toHaveProperty("token");
      expect(result.user.username).toBe(baseRegisterData.username);
      expect(result.user.email).toBe(baseRegisterData.email);
      expect((result.user as any).password).toBeUndefined();
    });

    test("should return longer expiry token with rememberMe", async () => {
      const result = await userService.login({
        username: baseRegisterData.username,
        password: baseRegisterData.password,
        rememberMe: true,
      });
      expect(result.token).toBeDefined();
    });

    test("should throw 404 if username not found", async () => {
      await expect(
        userService.login({ username: "ghost", password: "any" })
      ).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
    });

    test("should throw 401 if password is wrong", async () => {
      await expect(
        userService.login({
          username: baseRegisterData.username,
          password: "WrongPass!",
        })
      ).rejects.toMatchObject({ statusCode: 401, message: "Invalid credentials" });
    });
  });

  // ─── getUserById ──────────────────────────────────────────────────────────
  describe("getUserById", () => {
    test("should return user by id", async () => {
      const created = await userService.register(baseRegisterData);
      const found = await userService.getUserById(created._id.toString());

      expect(found).toBeDefined();
      expect(found._id.toString()).toBe(created._id.toString());
    });

    test("should throw 404 for non-existent user", async () => {
      const fakeId = "64f1a2b3c4d5e6f7a8b9c0d1";
      await expect(userService.getUserById(fakeId)).rejects.toMatchObject({
        statusCode: 404,
        message: "User not found",
      });
    });
  });

  // ─── updateProfile ────────────────────────────────────────────────────────
  describe("updateProfile", () => {
    test("should update profile fields", async () => {
      const created = await userService.register(baseRegisterData);
      const updated = await userService.updateProfile(created._id.toString(), {
        fullName: "Updated Name",
        about: "I am a student",
      });

      expect(updated.fullName).toBe("Updated Name");
      expect(updated.about).toBe("I am a student");
    });

    test("should throw 409 if new email is taken by another user", async () => {
      const user1 = await userService.register(baseRegisterData);
      const user2 = await userService.register({
        ...baseRegisterData,
        username: "user2",
        email: "user2@test.com",
        phone: "9822222222",
      });

      await expect(
        userService.updateProfile(user1._id.toString(), {
          email: "user2@test.com",
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test("should throw 409 if new phone is taken by another user", async () => {
      const user1 = await userService.register(baseRegisterData);
      await userService.register({
        ...baseRegisterData,
        username: "user2",
        email: "user2@test.com",
        phone: "9822222222",
      });

      await expect(
        userService.updateProfile(user1._id.toString(), {
          phone: "9822222222",
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ─── sendPasswordResetCode ────────────────────────────────────────────────
  describe("sendPasswordResetCode", () => {
    test("should send reset code for registered email", async () => {
      await userService.register(baseRegisterData);
      const result = await userService.sendPasswordResetCode({
        email: baseRegisterData.email,
      });

      expect(result).toHaveProperty("message", "Verification code sent to your email");
    });

    test("should throw 404 for unregistered email", async () => {
      await expect(
        userService.sendPasswordResetCode({ email: "ghost@test.com" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "This email hasn't been registered",
      });
    });
  });

  // ─── verifyResetCode ──────────────────────────────────────────────────────
  describe("verifyResetCode", () => {
    test("should verify valid code successfully", async () => {
      const created = await userService.register(baseRegisterData);

      // Manually set a reset code on the user
      await UserModel.findByIdAndUpdate(created._id, {
        resetPasswordCode: "123456",
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      });

      const result = await userService.verifyResetCode(
        baseRegisterData.email,
        "123456"
      );
      expect(result).toBeDefined();
    });

    test("should throw 400 for wrong code", async () => {
      await userService.register(baseRegisterData);
      await expect(
        userService.verifyResetCode(baseRegisterData.email, "000000")
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Verification code doesn't match",
      });
    });

    test("should throw 400 for expired code", async () => {
      const created = await userService.register(baseRegisterData);

      await UserModel.findByIdAndUpdate(created._id, {
        resetPasswordCode: "999999",
        resetPasswordExpires: new Date(Date.now() - 1000), // expired
      });

      await expect(
        userService.verifyResetCode(baseRegisterData.email, "999999")
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────────
  describe("resetPassword", () => {
    test("should reset password successfully", async () => {
      const created = await userService.register(baseRegisterData);

      await UserModel.findByIdAndUpdate(created._id, {
        resetPasswordCode: "777777",
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      });

      const result = await userService.resetPassword({
        email: baseRegisterData.email,
        code: "777777",
        newPassword: "NewPassword456!",
      });

      expect(result).toHaveProperty("message", "Password reset successfully");

      // Verify new password actually works
      const loginResult = await userService.login({
        username: baseRegisterData.username,
        password: "NewPassword456!",
      });
      expect(loginResult.token).toBeDefined();
    });

    test("should throw 400 for invalid reset code", async () => {
      await userService.register(baseRegisterData);
      await expect(
        userService.resetPassword({
          email: baseRegisterData.email,
          code: "badcode",
          newPassword: "NewPass123!",
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("should clear reset code after successful reset", async () => {
      const created = await userService.register(baseRegisterData);

      await UserModel.findByIdAndUpdate(created._id, {
        resetPasswordCode: "888888",
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      });

      await userService.resetPassword({
        email: baseRegisterData.email,
        code: "888888",
        newPassword: "Cleared123!",
      });

      const user = await UserModel.findById(created._id);
      expect(user!.resetPasswordCode).toBeNull();
      expect(user!.resetPasswordExpires).toBeNull();
    });
  });
});
