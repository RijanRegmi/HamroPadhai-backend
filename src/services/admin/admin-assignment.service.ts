import { CreateAssignmentDTO, UpdateAssignmentDTO } from "../../dtos/assignment.dto";
import { AssignmentRepository } from "../../repositories/assignment.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http.error";
import mongoose from "mongoose";

const assignmentRepository = new AssignmentRepository();
const userRepository = new UserRepository();

export class AdminAssignmentService {
  async createAssignment(data: CreateAssignmentDTO, createdBy: string) {
    const assignmentData: any = {
      ...data,
      dueDate:    new Date(data.dueDate),
      createdBy:  new mongoose.Types.ObjectId(createdBy),
      submissions: [],
      isActive:   true,
      // ✅ Convert string[] to ObjectId[]
      assignedTeacherIds: data.assignedTeacherIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
    };

    return assignmentRepository.createAssignment(assignmentData);
  }

  async getAllAssignments() {
    const now = new Date();
    const assignments = await assignmentRepository.getAllAssignments();
    return assignments.filter((a) => a.isActive && new Date(a.dueDate) >= now);
  }

  async getAssignmentById(assignmentId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) throw new HttpError(404, "Assignment not found");

    const allStudents = await userRepository.getUsersByClassAndSection(assignment.classId, assignment.sectionId);
    const students = allStudents.filter((u: any) => u.role === "user");

    const studentsWithSubmissions = students.map((student: any) => {
      const submission = assignment.submissions.find(
        (sub) => sub.studentId.toString() === student._id.toString()
      );
      return {
        _id:          student._id,
        fullName:     student.fullName,
        username:     student.username,
        email:        student.email,
        classId:      student.classId,
        sectionId:    student.sectionId,
        profileImage: student.profileImage || null,
        submission:   submission || null,
        hasSubmitted: !!submission,
        isGraded:     submission ? (submission.marks !== null && submission.marks !== undefined) : false,
      };
    });

    return { ...assignment.toObject(), students: studentsWithSubmissions };
  }

  async getAssignmentsByClassAndSection(classId: string, sectionId: string) {
    const now = new Date();
    const assignments = await assignmentRepository.getAssignmentsByClassAndSection(classId, sectionId);
    return assignments.filter((a) => a.isActive && new Date(a.dueDate) >= now);
  }

  async getAssignmentsBySubject(subject: string) {
    const now = new Date();
    const assignments = await assignmentRepository.getAssignmentsBySubject(subject);
    return assignments.filter((a) => a.isActive && new Date(a.dueDate) >= now);
  }

  async updateAssignment(assignmentId: string, data: UpdateAssignmentDTO) {
    const existing = await assignmentRepository.getAssignmentById(assignmentId);
    if (!existing) throw new HttpError(404, "Assignment not found");

    const updateData: any = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    // ✅ Convert string[] to ObjectId[]
    if (data.assignedTeacherIds) {
      updateData.assignedTeacherIds = data.assignedTeacherIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    }

    return assignmentRepository.updateAssignment(assignmentId, updateData);
  }

  async deleteAssignment(assignmentId: string) {
    const assignment = await assignmentRepository.deleteAssignment(assignmentId);
    if (!assignment) throw new HttpError(404, "Assignment not found");
    return assignment;
  }

  async activateAssignment(assignmentId: string) {
    const assignment = await assignmentRepository.updateAssignment(assignmentId, { isActive: true } as any);
    if (!assignment) throw new HttpError(404, "Assignment not found");
    return assignment;
  }

  async deactivateAssignment(assignmentId: string) {
    const assignment = await assignmentRepository.updateAssignment(assignmentId, { isActive: false } as any);
    if (!assignment) throw new HttpError(404, "Assignment not found");
    return assignment;
  }

  async getSubmissionStats(assignmentId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) throw new HttpError(404, "Assignment not found");

    const allStudents = await userRepository.getUsersByClassAndSection(assignment.classId, assignment.sectionId);
    const students = allStudents.filter((u: any) => u.role === "user");

    const totalStudents    = students.length;
    const totalSubmissions = assignment.submissions.length;
    const gradedSubmissions = assignment.submissions.filter(
      (s) => s.marks !== null && s.marks !== undefined
    ).length;

    return {
      totalStudents,
      totalSubmissions,
      gradedSubmissions,
      pendingGrading: totalSubmissions - gradedSubmissions,
      notSubmitted:   totalStudents - totalSubmissions,
    };
  }

  async getSubmissions(assignmentId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) throw new HttpError(404, "Assignment not found");
    return assignment.submissions;
  }

  async getOverdueAssignments()            { return assignmentRepository.getOverdueAssignments(); }
  async getUpcomingAssignments(days = 7)   { return assignmentRepository.getUpcomingAssignments(days); }

  async getHistoryAssignments() {
    const now = new Date();
    const all = await assignmentRepository.getAllAssignments();
    return all.filter((a) => new Date(a.dueDate) < now);
  }
}