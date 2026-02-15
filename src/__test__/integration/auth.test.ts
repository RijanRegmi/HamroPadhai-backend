import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { connectDatabaseTest } from "../unit/services/setup";

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

  // Clean up before AND after to handle leftover data from previous runs
  beforeAll(async () => {
    await connectDatabaseTest();
    await UserModel.deleteMany({
      $or: [
        { email: testUser.email },
        { username: testUser.username },
        { phone: testUser.phone },
        { email: "new@test.com" },
        { username: "newuser" },
        { username: "newuser2" },
        { email: "new2@test.com" },
      ],
    });
  }, 30000);

  afterAll(async () => {
    await UserModel.deleteMany({
      $or: [
        { email: testUser.email },
        { username: testUser.username },
        { phone: testUser.phone },
      ],
    });
  }, 30000);

  // ─── Register ─────────────────────────────────────────────────────────────
  describe("POST /api/auth/register", () => {
    test("should register a new user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("username", testUser.username);
      expect(res.body.data).not.toHaveProperty("password");
    });

    test("should return 409 for duplicate username", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, email: "new@test.com", phone: "9811111111" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    test("should return 409 for duplicate email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, username: "newuser", phone: "9811111112" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    test("should return 409 for duplicate phone", async () => {
      // Use a username/email that doesn't conflict but same phone
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, username: "newuser2", email: "new2@test.com" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    test("should return 400 for missing required fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "incomplete" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Login ────────────────────────────────────────────────────────────────
  describe("POST /api/auth/login", () => {
    // Register user first if not exists
    beforeAll(async () => {
      const exists = await UserModel.findOne({ username: testUser.username });
      if (!exists) {
        await request(app).post("/api/auth/register").send(testUser);
      }
    }, 30000);

    test("should login successfully with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: testUser.username, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user).toHaveProperty("username", testUser.username);
      expect(res.body.data.user).not.toHaveProperty("password");

      authToken = res.body.data.token;
    });

    test("should return 401 for wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: testUser.username, password: "WrongPass!" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("should return 404 for non-existent username", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "ghostuser123", password: "Password123!" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test("should return 400 for missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Profile ──────────────────────────────────────────────────────────────
  describe("GET /api/auth/profile", () => {
    beforeAll(async () => {
      // Make sure we have a valid token
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: testUser.username, password: testUser.password });
      authToken = res.body.data?.token;
    }, 30000);

    test("should return profile for authenticated user", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("username", testUser.username);
      expect(res.body.data).not.toHaveProperty("password");
    });

    test("should return 401 without token", async () => {
      const res = await request(app).get("/api/auth/profile");
      expect(res.status).toBe(401);
    });

    test("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer invalidtoken123");
      expect(res.status).toBe(401);
    });
  });

  // ─── Update Profile ───────────────────────────────────────────────────────
  describe("PUT /api/auth/profile", () => {
    beforeAll(async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: testUser.username, password: testUser.password });
      authToken = res.body.data?.token;
    }, 30000);

    test("should update profile successfully", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ fullName: "Updated Integration User", about: "Test bio" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe("Updated Integration User");
    });

    test("should return 401 without token", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .send({ fullName: "No Auth" });
      expect(res.status).toBe(401);
    });
  });

  // ─── Forgot Password ──────────────────────────────────────────────────────
  describe("POST /api/auth/forgot-password", () => {
    test("should send reset code for registered email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("should return 404 for unregistered email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "ghost@nowhere.com" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test("should return 400 for missing email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Verify Code ──────────────────────────────────────────────────────────
  describe("POST /api/auth/verify-code", () => {
    beforeAll(async () => {
      // Set a known reset code directly in DB
      await UserModel.findOneAndUpdate(
        { email: testUser.email },
        {
          resetPasswordCode: "112233",
          resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        }
      );
    }, 30000);

    test("should verify valid code", async () => {
      const res = await request(app)
        .post("/api/auth/verify-code")
        .send({ email: testUser.email, code: "112233" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
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
        .send({ email: testUser.email });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Reset Password ───────────────────────────────────────────────────────
  describe("POST /api/auth/reset-password", () => {
    beforeAll(async () => {
      await UserModel.findOneAndUpdate(
        { email: testUser.email },
        {
          resetPasswordCode: "445566",
          resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        }
      );
    }, 30000);

    test("should reset password with valid code", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          email: testUser.email,
          code: "445566",
          newPassword: "NewPassword789!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("should login with new password after reset", async () => {
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