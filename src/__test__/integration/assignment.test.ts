import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { AssignmentModel } from "../../models/assignment.model";
import { connectDatabaseTest } from "../unit/services/setup";

jest.mock("../../config/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

describe("Assignment Integration Tests", () => {
  let studentToken: string;

  const studentData = {
    fullName: "Student Assignment",
    username: "studentassign",
    email: "studentassign@test.com",
    phone: "9803333333",
    password: "Student123!",
    gender: "male",
    role: "user",
    classId: "10",
    sectionId: "A",
  };

  beforeAll(async () => {
    await connectDatabaseTest();

    // Clean up
    await UserModel.deleteMany({
      email: /studentassign/,
    });

    // Register and login
    await request(app).post("/api/auth/register").send(studentData);

    const studentLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: studentData.username, password: studentData.password });
    studentToken = studentLogin.body.data.token;
  }, 30000);

  afterAll(async () => {
    await UserModel.deleteMany({
      email: /studentassign/,
    });
  }, 30000);

  // ─── Get My Assignments ───────────────────────────────────────────────────
  describe("GET /api/assignments/my", () => {
    test("should get student's assignments", async () => {
      const res = await request(app)
        .get("/api/assignments/my")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("should fail without authentication", async () => {
      const res = await request(app).get("/api/assignments/my");
      expect(res.status).toBe(401);
    });
  });

  // ─── Get Pending Assignments ──────────────────────────────────────────────
  describe("GET /api/assignments/pending", () => {
    test("should get pending assignments", async () => {
      const res = await request(app)
        .get("/api/assignments/pending")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── Get Submitted Assignments ────────────────────────────────────────────
  describe("GET /api/assignments/submitted", () => {
    test("should get submitted assignments", async () => {
      const res = await request(app)
        .get("/api/assignments/submitted")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── Get Graded Assignments ───────────────────────────────────────────────
  describe("GET /api/assignments/graded", () => {
    test("should get graded assignments", async () => {
      const res = await request(app)
        .get("/api/assignments/graded")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── Get Overdue Assignments ──────────────────────────────────────────────
  describe("GET /api/assignments/overdue", () => {
    test("should get overdue assignments", async () => {
      const res = await request(app)
        .get("/api/assignments/overdue")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── Get Assignment History ───────────────────────────────────────────────
  describe("GET /api/assignments/history", () => {
    test("should get assignment history", async () => {
      const res = await request(app)
        .get("/api/assignments/history")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});