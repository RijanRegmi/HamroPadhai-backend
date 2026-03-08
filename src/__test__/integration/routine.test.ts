import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { RoutineModel } from "../../models/routine.model";
import { connectDatabaseTest } from "../unit/services/setup";

jest.mock("../../config/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

describe("Routine Integration Tests", () => {
  let studentToken: string;

  const studentData = {
    fullName: "Student Routine",
    username: "studentroutine",
    email: "studentroutine@test.com",
    phone: "9809999999",
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
      email: /studentroutine/,
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
      email: /studentroutine/,
    });
  }, 30000);

  // ─── Get Routines ─────────────────────────────────────────────────────────
  describe("GET /api/routines/my", () => {
    test("should get student routine or return appropriate response", async () => {
      const res = await request(app)
        .get("/api/routines/my")
        .set("Authorization", `Bearer ${studentToken}`);

      // Should either return 200 with data or 404 if no routine exists
      expect([200, 404]).toContain(res.status);
      expect(res.body.success).toBeDefined();
    });

    test("should fail without authentication", async () => {
      const res = await request(app).get("/api/routines/my");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/routines/my/all", () => {
    test("should get all student routines", async () => {
      const res = await request(app)
        .get("/api/routines/my/all")
        .set("Authorization", `Bearer ${studentToken}`);

      expect([200, 404]).toContain(res.status);
      expect(res.body.success).toBeDefined();
    });
  });
});