import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

// Mock sendEmail so no real emails fire
jest.mock("../../config/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

describe("Auth Integration Tests", () => {
  const testUser = {
    fullName: "Integration User",
    username: "integrationuser",
    email: "integration@example.com",
    phone: "9800999888",
    password: "Password123!",
    gender: "male",
  };

  let authToken: string;

  beforeAll(async () => {
    await UserModel.deleteMany({
      $or: [{ email: testUser.email }, { username: testUser.username }],
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      $or: [{ email: testUser.email }, { username: testUser.username }],
    });
  });

  // ─── POST /api/auth/register ───────────────────────────────────────────────
  describe("POST /api/auth/register", () => {
    test("should register a new user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("username", testUser.username);
      expect(res.body.data).toHaveProperty("email", testUser.email);
      expect(res.body.data).not.toHaveProperty("password");
    });

    test("should return 409 for duplicate username", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, email: "new@test.com", phone: "9811111111" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Username already exists/i);
    });

    test("should return 409 for duplicate email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, username: "newuser", phone: "9811111112" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Email already exists/i);
    });

    test("should return 409 for duplicate phone", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, username: "newuser2", email: "new2@test.com" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Phone number already exists/i);
    });

    test("should return 400 for missing required fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "incomplete" }); // missing fields

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── POST /api/auth/login ──────────────────────────────────────────────────
  describe("POST /api/auth/login", () => {
    test("should login successfully with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: testUser.username, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user).toHaveProperty("username", testUser.username);
      expect(res.body.data.user).not.toHaveProperty("password");

      authToken = res.body.data.token; // save for protected route tests
    });

    test("should return 401 for wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: testUser.username, password: "WrongPass!" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });

    test("should return 404 for non-existent username", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "ghostuser", password: "any" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/User not found/i);
    });

    test("should return 400 for missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── GET /api/auth/profile ─────────────────────────────────────────────────
  describe("GET /api/auth/profile", () => {
    test("should return profile for authenticated user", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("username", testUser.username);
      expect(res.body.data).toHaveProperty("email", testUser.email);
      expect(res.body.data).not.toHaveProperty("password");
    });

    test("should return 401 without token", async () => {
      const res = await request(app).get("/api/auth/profile");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer invalidtoken123");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── PUT /api/auth/profile ─────────────────────────────────────────────────
  describe("PUT /api/auth/profile", () => {
    test("should update profile successfully", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ fullName: "Updated Integration User", about: "Test bio" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe("Updated Integration User");
      expect(res.body.data.about).toBe("Test bio");
    });

    test("should return 401 without token", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .send({ fullName: "No Auth" });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/auth/forgot-password ───────────────────────────────────────
  describe("POST /api/auth/forgot-password", () => {
    test("should send reset code for registered email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Verification code sent/i);
    });

    test("should return 404 for unregistered email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "ghost@nowhere.com" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/hasn't been registered/i);
    });

    test("should return 400 for missing email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── POST /api/auth/verify-code ───────────────────────────────────────────
  describe("POST /api/auth/verify-code", () => {
    test("should verify valid code", async () => {
      // Manually set a known code
      await UserModel.findOneAndUpdate(
        { email: testUser.email },
        {
          resetPasswordCode: "112233",
          resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        }
      );

      const res = await request(app)
        .post("/api/auth/verify-code")
        .send({ email: testUser.email, code: "112233" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Code verified/i);
    });

    test("should return 400 for wrong code", async () => {
      const res = await request(app)
        .post("/api/auth/verify-code")
        .send({ email: testUser.email, code: "000000" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("should return 400 for missing email or code", async () => {
      const res = await request(app)
        .post("/api/auth/verify-code")
        .send({ email: testUser.email }); // missing code

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── POST /api/auth/reset-password ────────────────────────────────────────
  describe("POST /api/auth/reset-password", () => {
    test("should reset password with valid code", async () => {
      // Set fresh code
      await UserModel.findOneAndUpdate(
        { email: testUser.email },
        {
          resetPasswordCode: "445566",
          resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        }
      );

      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          email: testUser.email,
          code: "445566",
          newPassword: "NewPassword789!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Password reset successfully/i);
    });

    test("should be able to login with new password after reset", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: testUser.username, password: "NewPassword789!" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("should return 400 for invalid reset code", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          email: testUser.email,
          code: "badcode",
          newPassword: "AnyPass123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});