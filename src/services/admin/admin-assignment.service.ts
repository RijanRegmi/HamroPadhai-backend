import {
  CreateAssignmentDTO,
  UpdateAssignmentDTO,
} from "../../dtos/assignment.dto";
import { AssignmentRepository } from "../../repositories/assignment.repository";
import { UserRepository } from "../../repositories/user.repository"; // ✅ ADD THIS
import { HttpError } from "../../errors/http.error";
import mongoose from "mongoose";

const assignmentRepository = new AssignmentRepository();
const userRepository = new UserRepository(); // ✅ ADD THIS

export class AdminAssignmentService {
  // Create assignment with optional teacher assignment
  async createAssignment(data: CreateAssignmentDTO, createdBy: string) {
    const assignmentData: any = {
      ...data,
      dueDate: new Date(data.dueDate),
      createdBy: new mongoose.Types.ObjectId(createdBy),
      submissions: [],
      isActive: true,
    };

    // NEW: Add assigned teacher if provided
    if (data.assignedTeacherId) {
      assignmentData.assignedTeacherId = new mongoose.Types.ObjectId(data.assignedTeacherId);
    }

    const assignment = await assignmentRepository.createAssignment(assignmentData);
    return assignment;
  }

  // Get all assignments
  async getAllAssignments() {
    const now = new Date();
    const assignments = await assignmentRepository.getAllAssignments();
    
    // Filter only active assignments that haven't passed deadline
    const activeAssignments = assignments.filter(
      (assignment) => assignment.isActive && new Date(assignment.dueDate) >= now
    );
    
    return activeAssignments;
  }

  // ✅ NEW: Get assignment by ID with ALL students (submitted + not submitted)
  async getAssignmentById(assignmentId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    // Get all students in this class/section
    const allStudents = await userRepository.getUsersByClassAndSection(
      assignment.classId,
      assignment.sectionId
    );

    // Filter only students (role === "user")
    const students = allStudents.filter((user: any) => user.role === "user");

    console.log("📚 Assignment students:", {
      assignmentId,
      classId: assignment.classId,
      sectionId: assignment.sectionId,
      totalStudents: students.length,
      totalSubmissions: assignment.submissions.length,
    });

    // Map students with their submission status
    const studentsWithSubmissions = students.map((student: any) => {
      const submission = assignment.submissions.find(
        (sub) => sub.studentId.toString() === student._id.toString()
      );

      return {
        _id: student._id,
        fullName: student.fullName,
        username: student.username,
        email: student.email,
        classId: student.classId,
        sectionId: student.sectionId,
        submission: submission || null,
        hasSubmitted: !!submission,
        isGraded: submission ? (submission.marks !== null && submission.marks !== undefined) : false,
      };
    });

    // Return assignment with enhanced student data
    return {
      ...assignment.toObject(),
      students: studentsWithSubmissions, // ✅ ADD THIS
    };
  }

  // Get assignments by class and section
  async getAssignmentsByClassAndSection(classId: string, sectionId: string) {
    const now = new Date();
    const assignments = await assignmentRepository.getAssignmentsByClassAndSection(
      classId,
      sectionId
    );
    
    // Filter only active assignments that haven't passed deadline
    const activeAssignments = assignments.filter(
      (assignment) => assignment.isActive && new Date(assignment.dueDate) >= now
    );
    
    return activeAssignments;
  }

  // Get assignments by subject
  async getAssignmentsBySubject(subject: string) {
    const now = new Date();
    const assignments = await assignmentRepository.getAssignmentsBySubject(subject);
    
    // Filter only active assignments that haven't passed deadline
    const activeAssignments = assignments.filter(
      (assignment) => assignment.isActive && new Date(assignment.dueDate) >= now
    );
    
    return activeAssignments;
  }

  // Update assignment (including teacher assignment)
  async updateAssignment(assignmentId: string, data: UpdateAssignmentDTO) {
    const existingAssignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!existingAssignment) {
      throw new HttpError(404, "Assignment not found");
    }

    const updateData: any = { ...data };
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    // NEW: Handle teacher assignment update
    if (data.assignedTeacherId) {
      updateData.assignedTeacherId = new mongoose.Types.ObjectId(data.assignedTeacherId);
    }

    const assignment = await assignmentRepository.updateAssignment(
      assignmentId,
      updateData
    );
    return assignment;
  }

  // Delete assignment
  async deleteAssignment(assignmentId: string) {
    const assignment = await assignmentRepository.deleteAssignment(assignmentId);
    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }
    return assignment;
  }

  // Activate assignment
  async activateAssignment(assignmentId: string) {
    const assignment = await assignmentRepository.updateAssignment(assignmentId, {
      isActive: true,
    } as any);
    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }
    return assignment;
  }

  // Deactivate assignment
  async deactivateAssignment(assignmentId: string) {
    const assignment = await assignmentRepository.updateAssignment(assignmentId, {
      isActive: false,
    } as any);
    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }
    return assignment;
  }

  // ✅ ENHANCED: Get submission statistics with student count
  async getSubmissionStats(assignmentId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    // Get all students in this class/section
    const allStudents = await userRepository.getUsersByClassAndSection(
      assignment.classId,
      assignment.sectionId
    );
    const students = allStudents.filter((user: any) => user.role === "user");

    const totalStudents = students.length;
    const totalSubmissions = assignment.submissions.length;
    const gradedSubmissions = assignment.submissions.filter(
      (sub) => sub.marks !== null && sub.marks !== undefined
    ).length;
    const pendingGrading = totalSubmissions - gradedSubmissions;
    const notSubmitted = totalStudents - totalSubmissions;

    return {
      totalStudents, // ✅ NEW
      totalSubmissions,
      gradedSubmissions,
      pendingGrading,
      notSubmitted, // ✅ NEW
    };
  }

  // Get all submissions for an assignment
  async getSubmissions(assignmentId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    return assignment.submissions;
  }

  // Get overdue assignments
  async getOverdueAssignments() {
    const assignments = await assignmentRepository.getOverdueAssignments();
    return assignments;
  }

  // Get upcoming assignments
  async getUpcomingAssignments(days: number = 7) {
    const assignments = await assignmentRepository.getUpcomingAssignments(days);
    return assignments;
  }

  // Get history assignments (past deadline)
  async getHistoryAssignments() {
    const now = new Date();
    const allAssignments = await assignmentRepository.getAllAssignments();
    
    // Filter assignments that have passed their deadline
    const historyAssignments = allAssignments.filter(
      (assignment) => new Date(assignment.dueDate) < now
    );
    
    return historyAssignments;
  }
}