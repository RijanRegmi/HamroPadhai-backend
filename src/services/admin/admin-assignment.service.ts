import { CreateAssignmentDTO, UpdateAssignmentDTO } from "../../dtos/assignment.dto";
import { AssignmentRepository } from "../../repositories/assignment.repository";
import { UserRepository } from "../../repositories/user.repository";
import { NotificationService } from "../notification.service";
import { NotificationRepository } from "../../repositories/notification.repository";
import { HttpError } from "../../errors/http.error";
import mongoose from "mongoose";

const assignmentRepository  = new AssignmentRepository();
const userRepository        = new UserRepository();
const notificationService   = new NotificationService();
const notificationRepository = new NotificationRepository(); // ✅ for delete

export class AdminAssignmentService {
  async createAssignment(data: CreateAssignmentDTO, createdBy: string) {
    const assignedTeacherIds = data.assignedTeacherIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const assignmentData: any = {
      ...data,
      dueDate:           new Date(data.dueDate),
      createdBy:         new mongoose.Types.ObjectId(createdBy),
      submissions:       [],
      isActive:          true,
      assignedTeacherIds,
    };
    const assignment = await assignmentRepository.createAssignment(assignmentData);

    notificationService.notifyAssignment({
      type:               "assignment_created",
      assignmentId:       assignment._id,
      title:              data.title,
      subject:            data.subject,
      classId:            data.classId,
      sectionId:          data.sectionId,
      assignedTeacherIds,
    });

    return assignment;
  }

  async getAllAssignments() {
    const now = new Date();
    return (await assignmentRepository.getAllAssignments())
      .filter((a) => a.isActive && new Date(a.dueDate) >= now);
  }

  async getAssignmentById(assignmentId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) throw new HttpError(404, "Assignment not found");

    const allStudents = await userRepository.getUsersByClassAndSection(
      assignment.classId, assignment.sectionId
    );
    const students = allStudents.filter((u: any) => u.role === "user");

    const studentsWithSubmissions = students.map((student: any) => {
      const submission = assignment.submissions.find(
        (sub) => sub.studentId.toString() === student._id.toString()
      );
      return {
        _id: student._id, fullName: student.fullName, username: student.username,
        email: student.email, classId: student.classId, sectionId: student.sectionId,
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
    return (await assignmentRepository.getAssignmentsByClassAndSection(classId, sectionId))
      .filter((a) => a.isActive && new Date(a.dueDate) >= now);
  }

  async getAssignmentsBySubject(subject: string) {
    const now = new Date();
    return (await assignmentRepository.getAssignmentsBySubject(subject))
      .filter((a) => a.isActive && new Date(a.dueDate) >= now);
  }

  async updateAssignment(assignmentId: string, data: UpdateAssignmentDTO) {
    const existing = await assignmentRepository.getAssignmentById(assignmentId);
    if (!existing) throw new HttpError(404, "Assignment not found");

    const updateData: any = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    let assignedTeacherIds: mongoose.Types.ObjectId[] | undefined;
    if (data.assignedTeacherIds) {
      assignedTeacherIds = data.assignedTeacherIds.map((id) => new mongoose.Types.ObjectId(id));
      updateData.assignedTeacherIds = assignedTeacherIds;
    }

    const assignment = await assignmentRepository.updateAssignment(assignmentId, updateData);

    notificationService.notifyAssignment({
      type:               "assignment_updated",
      assignmentId:       existing._id,
      title:              data.title    || existing.title,
      subject:            data.subject  || existing.subject,
      classId:            existing.classId,
      sectionId:          existing.sectionId,
      assignedTeacherIds: assignedTeacherIds || (existing.assignedTeacherIds as mongoose.Types.ObjectId[]),
    });

    return assignment;
  }

  async deleteAssignment(assignmentId: string) {
    const a = await assignmentRepository.deleteAssignment(assignmentId);
    if (!a) throw new HttpError(404, "Assignment not found");

    // ✅ Remove all notifications linked to this assignment
    await notificationRepository.deleteByRef(a._id);

    return a;
  }

  async activateAssignment(assignmentId: string) {
    const a = await assignmentRepository.updateAssignment(assignmentId, { isActive: true } as any);
    if (!a) throw new HttpError(404, "Assignment not found");
    return a;
  }

  async deactivateAssignment(assignmentId: string) {
    const a = await assignmentRepository.updateAssignment(assignmentId, { isActive: false } as any);
    if (!a) throw new HttpError(404, "Assignment not found");
    return a;
  }

  async getSubmissionStats(assignmentId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) throw new HttpError(404, "Assignment not found");
    const allStudents       = await userRepository.getUsersByClassAndSection(assignment.classId, assignment.sectionId);
    const students          = allStudents.filter((u: any) => u.role === "user");
    const totalStudents     = students.length;
    const totalSubmissions  = assignment.submissions.length;
    const gradedSubmissions = assignment.submissions.filter((s) => s.marks !== null && s.marks !== undefined).length;
    return {
      totalStudents, totalSubmissions, gradedSubmissions,
      pendingGrading: totalSubmissions - gradedSubmissions,
      notSubmitted:   totalStudents    - totalSubmissions,
    };
  }

  async getSubmissions(assignmentId: string) {
    const a = await assignmentRepository.getAssignmentById(assignmentId);
    if (!a) throw new HttpError(404, "Assignment not found");
    return a.submissions;
  }

  async getOverdueAssignments()          { return assignmentRepository.getOverdueAssignments(); }
  async getUpcomingAssignments(days = 7) { return assignmentRepository.getUpcomingAssignments(days); }
  async getHistoryAssignments() {
    const now = new Date();
    return (await assignmentRepository.getAllAssignments()).filter((a) => new Date(a.dueDate) < now);
  }
}