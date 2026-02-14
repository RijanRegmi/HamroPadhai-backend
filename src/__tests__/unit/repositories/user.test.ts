import { UserRepository } from "../../../repositories/user.repository";
import { UserModel } from "../../../models/user.model";
import mongoose from "mongoose";

describe("UserRepository Unit Tests", () => {
  let userRepository: UserRepository;

  const baseUser = {
    fullName: "Test User",
    username: "testuser",
    email: "test@example.com",
    phone: "9800000000",
    password: "hashedpassword",
    gender: "male" as const,
  };

  beforeAll(() => {
    userRepository = new UserRepository();
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  // ─── createUser ───────────────────────────────────────────────────────────
  describe("createUser", () => {
    test("should create a new user successfully", async () => {
      const user = await userRepository.createUser(baseUser);

      expect(user).toBeDefined();
      expect(user._id).toBeDefined();
      expect(user.fullName).toBe(baseUser.fullName);
      expect(user.username).toBe(baseUser.username);
      expect(user.email).toBe(baseUser.email);
      expect(user.phone).toBe(baseUser.phone);
      expect(user.gender).toBe(baseUser.gender);
      expect(user.role).toBe("user"); // default role
      expect(user.profileImage).toBeNull();
    });

    test("should set default role to 'user'", async () => {
      const user = await userRepository.createUser(baseUser);
      expect(user.role).toBe("user");
    });

    test("should fail with duplicate username", async () => {
      await userRepository.createUser(baseUser);
      await expect(
        userRepository.createUser({ ...baseUser, email: "other@test.com", phone: "9811111111" })
      ).rejects.toThrow();
    });

    test("should fail with duplicate email", async () => {
      await userRepository.createUser(baseUser);
      await expect(
        userRepository.createUser({ ...baseUser, username: "otheruser", phone: "9811111111" })
      ).rejects.toThrow();
    });

    test("should fail with duplicate phone", async () => {
      await userRepository.createUser(baseUser);
      await expect(
        userRepository.createUser({ ...baseUser, username: "otheruser", email: "other@test.com" })
      ).rejects.toThrow();
    });
  });

  // ─── getUserByEmail ───────────────────────────────────────────────────────
  describe("getUserByEmail", () => {
    test("should find user by email", async () => {
      await userRepository.createUser(baseUser);
      const found = await userRepository.getUserByEmail(baseUser.email);

      expect(found).not.toBeNull();
      expect(found!.email).toBe(baseUser.email);
    });

    test("should return null if email not found", async () => {
      const found = await userRepository.getUserByEmail("nonexistent@test.com");
      expect(found).toBeNull();
    });
  });

  // ─── getUserByUsername ────────────────────────────────────────────────────
  describe("getUserByUsername", () => {
    test("should find user by username", async () => {
      await userRepository.createUser(baseUser);
      const found = await userRepository.getUserByUsername(baseUser.username);

      expect(found).not.toBeNull();
      expect(found!.username).toBe(baseUser.username);
    });

    test("should return null if username not found", async () => {
      const found = await userRepository.getUserByUsername("ghostuser");
      expect(found).toBeNull();
    });
  });

  // ─── getUserByPhone ───────────────────────────────────────────────────────
  describe("getUserByPhone", () => {
    test("should find user by phone", async () => {
      await userRepository.createUser(baseUser);
      const found = await userRepository.getUserByPhone(baseUser.phone);

      expect(found).not.toBeNull();
      expect(found!.phone).toBe(baseUser.phone);
    });

    test("should return null if phone not found", async () => {
      const found = await userRepository.getUserByPhone("0000000000");
      expect(found).toBeNull();
    });
  });

  // ─── getUserById ──────────────────────────────────────────────────────────
  describe("getUserById", () => {
    test("should find user by id", async () => {
      const created = await userRepository.createUser(baseUser);
      const found = await userRepository.getUserById(created._id.toString());

      expect(found).not.toBeNull();
      expect(found!._id.toString()).toBe(created._id.toString());
    });

    test("should return null for non-existent id", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const found = await userRepository.getUserById(fakeId);
      expect(found).toBeNull();
    });
  });

  // ─── updateProfileImage ───────────────────────────────────────────────────
  describe("updateProfileImage", () => {
    test("should update profile image URL", async () => {
      const created = await userRepository.createUser(baseUser);
      const imageUrl = "/uploads/profiles/test.jpg";
      const updated = await userRepository.updateProfileImage(
        created._id.toString(),
        imageUrl
      );

      expect(updated).not.toBeNull();
      expect(updated!.profileImage).toBe(imageUrl);
    });
  });

  // ─── updateUserProfile ────────────────────────────────────────────────────
  describe("updateUserProfile", () => {
    test("should update user profile fields", async () => {
      const created = await userRepository.createUser(baseUser);
      const updated = await userRepository.updateUserProfile(
        created._id.toString(),
        { fullName: "Updated Name", about: "Hello world" }
      );

      expect(updated).not.toBeNull();
      expect(updated!.fullName).toBe("Updated Name");
      expect(updated!.about).toBe("Hello world");
    });
  });

  // ─── isEmailTakenByOther ──────────────────────────────────────────────────
  describe("isEmailTakenByOther", () => {
    test("should return true if email taken by another user", async () => {
      const user1 = await userRepository.createUser(baseUser);
      const user2 = await userRepository.createUser({
        ...baseUser,
        username: "user2",
        email: "user2@test.com",
        phone: "9822222222",
      });

      const taken = await userRepository.isEmailTakenByOther(
        user2.email,
        user1._id.toString()
      );
      expect(taken).toBe(true);
    });

    test("should return false if email belongs to same user", async () => {
      const user = await userRepository.createUser(baseUser);
      const taken = await userRepository.isEmailTakenByOther(
        user.email,
        user._id.toString()
      );
      expect(taken).toBe(false);
    });
  });

  // ─── isPhoneTakenByOther ──────────────────────────────────────────────────
  describe("isPhoneTakenByOther", () => {
    test("should return true if phone taken by another user", async () => {
      const user1 = await userRepository.createUser(baseUser);
      const user2 = await userRepository.createUser({
        ...baseUser,
        username: "user2",
        email: "user2@test.com",
        phone: "9822222222",
      });

      const taken = await userRepository.isPhoneTakenByOther(
        user2.phone,
        user1._id.toString()
      );
      expect(taken).toBe(true);
    });

    test("should return false if phone belongs to same user", async () => {
      const user = await userRepository.createUser(baseUser);
      const taken = await userRepository.isPhoneTakenByOther(
        user.phone,
        user._id.toString()
      );
      expect(taken).toBe(false);
    });
  });

  // ─── Password Reset ───────────────────────────────────────────────────────
  describe("password reset methods", () => {
    test("should set reset password code", async () => {
      const created = await userRepository.createUser(baseUser);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const updated = await userRepository.setResetPasswordCode(
        created._id.toString(),
        "123456",
        expiresAt
      );

      expect(updated!.resetPasswordCode).toBe("123456");
      expect(updated!.resetPasswordExpires).toBeDefined();
    });

    test("should find user by valid reset code", async () => {
      const created = await userRepository.createUser(baseUser);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await userRepository.setResetPasswordCode(
        created._id.toString(),
        "654321",
        expiresAt
      );

      const found = await userRepository.getUserByResetCode(
        baseUser.email,
        "654321"
      );
      expect(found).not.toBeNull();
    });

    test("should not find user with expired reset code", async () => {
      const created = await userRepository.createUser(baseUser);
      const expiredAt = new Date(Date.now() - 1000); // already expired
      await userRepository.setResetPasswordCode(
        created._id.toString(),
        "999999",
        expiredAt
      );

      const found = await userRepository.getUserByResetCode(
        baseUser.email,
        "999999"
      );
      expect(found).toBeNull();
    });

    test("should clear reset password code", async () => {
      const created = await userRepository.createUser(baseUser);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await userRepository.setResetPasswordCode(
        created._id.toString(),
        "111111",
        expiresAt
      );

      const cleared = await userRepository.clearResetPasswordCode(
        created._id.toString()
      );
      expect(cleared!.resetPasswordCode).toBeNull();
      expect(cleared!.resetPasswordExpires).toBeNull();
    });

    test("should update password", async () => {
      const created = await userRepository.createUser(baseUser);
      const newHash = "newhashedpassword";
      const updated = await userRepository.updatePassword(
        created._id.toString(),
        newHash
      );

      expect(updated!.password).toBe(newHash);
    });
  });

  // ─── getUsersByRole ───────────────────────────────────────────────────────
  describe("getUsersByRole", () => {
    test("should return users filtered by role", async () => {
      await userRepository.createUser(baseUser); // role: user
      await userRepository.createUser({
        ...baseUser,
        username: "teacher1",
        email: "teacher@test.com",
        phone: "9833333333",
        role: "teacher",
      } as any);

      const users = await userRepository.getUsersByRole("user");
      expect(users.length).toBe(1);
      expect(users[0].role).toBe("user");

      const teachers = await userRepository.getUsersByRole("teacher");
      expect(teachers.length).toBe(1);
      expect(teachers[0].role).toBe("teacher");
    });

    test("should not return passwords", async () => {
      await userRepository.createUser(baseUser);
      const users = await userRepository.getUsersByRole("user");
      expect((users[0] as any).password).toBeUndefined();
    });
  });

  // ─── searchUsers ──────────────────────────────────────────────────────────
  describe("searchUsers", () => {
    test("should find user by fullName partial match", async () => {
      await userRepository.createUser(baseUser);
      const results = await userRepository.searchUsers("Test");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].fullName).toContain("Test");
    });

    test("should find user by email partial match", async () => {
      await userRepository.createUser(baseUser);
      const results = await userRepository.searchUsers("example.com");
      expect(results.length).toBeGreaterThan(0);
    });

    test("should return empty array for no match", async () => {
      await userRepository.createUser(baseUser);
      const results = await userRepository.searchUsers("zzznomatch");
      expect(results).toHaveLength(0);
    });
  });
});