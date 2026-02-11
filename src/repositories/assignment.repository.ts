import { AssignmentModel, IAssignment, ISubmission } from "../models/assignment.model";
import mongoose from "mongoose";

export class AssignmentRepository {
  // ==================== ADMIN OPERATIONS ====================
  
  // Create assignment
  async createAssignment(data: Partial<IAssignment>): Promise<IAssignment> {
    const assignment = new AssignmentModel(data);
    const saved = await assignment.save();
    
    // Populate after creation
    return AssignmentModel.findById(saved._id)
      .populate("createdBy", "fullName username email")
      .populate("assignedTeacherId", "fullName username email classId sectionId") // NEW
      .populate("submissions.gradedBy", "fullName username") as Promise<IAssignment>;
  }

  // Get all assignments
  async getAllAssignments(): Promise<IAssignment[]> {
    return AssignmentModel.find()
      .populate("createdBy", "fullName username email")
      .populate("assignedTeacherId", "fullName username email classId sectionId") // NEW
      .populate("submissions.gradedBy", "fullName username")
      .sort({ createdAt: -1 });
  }

  // Get assignment by ID
  async getAssignmentById(assignmentId: string): Promise<IAssignment | null> {
    return AssignmentModel.findById(assignmentId)
      .populate("createdBy", "fullName username email")
      .populate("assignedTeacherId", "fullName username email classId sectionId") // NEW
      .populate("submissions.gradedBy", "fullName username");
  }

  // Update assignment
  async updateAssignment(
    assignmentId: string,
    data: Partial<IAssignment>
  ): Promise<IAssignment | null> {
    return AssignmentModel.findByIdAndUpdate(
      assignmentId,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "fullName username email")
      .populate("assignedTeacherId", "fullName username email classId sectionId") // NEW
      .populate("submissions.gradedBy", "fullName username");
  }

  // Delete assignment
  async deleteAssignment(assignmentId: string): Promise<IAssignment | null> {
    return AssignmentModel.findByIdAndDelete(assignmentId);
  }

  // Get assignments by class and section
  async getAssignmentsByClassAndSection(
    classId: string,
    sectionId: string
  ): Promise<IAssignment[]> {
    return AssignmentModel.find({ classId, sectionId })
      .populate("createdBy", "fullName username email")
      .populate("assignedTeacherId", "fullName username email classId sectionId") // NEW
      .sort({ createdAt: -1 });
  }

  // Get assignments by subject
  async getAssignmentsBySubject(subject: string): Promise<IAssignment[]> {
    return AssignmentModel.find({ subject })
      .populate("createdBy", "fullName username email")
      .populate("assignedTeacherId", "fullName username email classId sectionId") // NEW
      .sort({ createdAt: -1 });
  }

  // ==================== STUDENT OPERATIONS ====================

  // Get assignments for student (by their class and section)
  async getAssignmentsForStudent(
    classId: string,
    sectionId: string
  ): Promise<IAssignment[]> {
    return AssignmentModel.find({
      classId,
      sectionId,
      isActive: true,
    })
      .populate("createdBy", "fullName username")
      .populate("assignedTeacherId", "fullName username") // NEW
      .sort({ dueDate: 1 });
  }

  // Submit assignment
  async submitAssignment(
    assignmentId: string,
    submission: Partial<ISubmission>
  ): Promise<IAssignment | null> {
    return AssignmentModel.findByIdAndUpdate(
      assignmentId,
      {
        $push: {
          submissions: {
            ...submission,
            submittedAt: new Date(),
          },
        },
      },
      { new: true }
    );
  }

  // Update submission (resubmit)
  async updateSubmission(
    assignmentId: string,
    studentId: string,
    submission: Partial<ISubmission>
  ): Promise<IAssignment | null> {
    return AssignmentModel.findOneAndUpdate(
      {
        _id: assignmentId,
        "submissions.studentId": studentId,
      },
      {
        $set: {
          "submissions.$.files": submission.files,
          "submissions.$.textContent": submission.textContent,
          "submissions.$.submittedAt": new Date(),
        },
      },
      { new: true }
    );
  }

  // Get student's submission for an assignment
  async getStudentSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<ISubmission | null> {
    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) return null;

    const submission = assignment.submissions.find(
      (sub) => sub.studentId.toString() === studentId
    );
    return submission || null;
  }

  // Check if student has submitted
  async hasStudentSubmitted(
    assignmentId: string,
    studentId: string
  ): Promise<boolean> {
    const assignment = await AssignmentModel.findOne({
      _id: assignmentId,
      "submissions.studentId": studentId,
    });
    return !!assignment;
  }

  // ==================== TEACHER OPERATIONS ====================

  // Get assignments where teacher teaches that class/section
  async getAssignmentsForTeacher(
    classIds: string[],
    sectionIds: string[]
  ): Promise<IAssignment[]> {
    return AssignmentModel.find({
      classId: { $in: classIds },
      sectionId: { $in: sectionIds },
      isActive: true,
    })
      .populate("createdBy", "fullName username")
      .populate("assignedTeacherId", "fullName username") // NEW
      .sort({ createdAt: -1 });
  }

  // Grade submission
  async gradeSubmission(
    assignmentId: string,
    studentId: string,
    marks: number,
    feedback: string,
    gradedBy: string
  ): Promise<IAssignment | null> {
    return AssignmentModel.findOneAndUpdate(
      {
        _id: assignmentId,
        "submissions.studentId": studentId,
      },
      {
        $set: {
          "submissions.$.marks": marks,
          "submissions.$.feedback": feedback,
          "submissions.$.gradedBy": new mongoose.Types.ObjectId(gradedBy),
          "submissions.$.gradedAt": new Date(),
        },
      },
      { new: true }
    ).populate("submissions.gradedBy", "fullName username");
  }

  // Get all submissions for an assignment
  async getSubmissions(assignmentId: string): Promise<ISubmission[]> {
    const assignment = await AssignmentModel.findById(assignmentId);
    return assignment?.submissions || [];
  }

  // Get submission statistics
  async getSubmissionStats(assignmentId: string) {
    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) return null;

    const totalSubmissions = assignment.submissions.length;
    const gradedSubmissions = assignment.submissions.filter(
      (sub) => sub.marks !== null && sub.marks !== undefined
    ).length;
    const pendingGrading = totalSubmissions - gradedSubmissions;

    return {
      totalSubmissions,
      gradedSubmissions,
      pendingGrading,
    };
  }

  // ==================== QUERY OPERATIONS ====================

  // Search assignments
  async searchAssignments(query: any): Promise<IAssignment[]> {
    return AssignmentModel.find(query)
      .populate("createdBy", "fullName username email")
      .populate("assignedTeacherId", "fullName username email classId sectionId") // NEW
      .sort({ createdAt: -1 });
  }

  // Get overdue assignments
  async getOverdueAssignments(): Promise<IAssignment[]> {
    return AssignmentModel.find({
      dueDate: { $lt: new Date() },
      isActive: true,
    })
      .populate("createdBy", "fullName username")
      .populate("assignedTeacherId", "fullName username") // NEW
      .sort({ dueDate: -1 });
  }

  // Get upcoming assignments
  async getUpcomingAssignments(days: number = 7): Promise<IAssignment[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return AssignmentModel.find({
      dueDate: { $gte: today, $lte: futureDate },
      isActive: true,
    })
      .populate("createdBy", "fullName username")
      .populate("assignedTeacherId", "fullName username") // NEW
      .sort({ dueDate: 1 });
  }
}