import { AssignmentModel, IAssignment, ISubmission } from "../models/assignment.model";
import mongoose from "mongoose";

const POPULATE_TEACHERS = { path: "assignedTeacherIds", select: "fullName username email" };
const POPULATE_CREATOR  = { path: "createdBy", select: "fullName username email" };
const POPULATE_GRADER   = { path: "submissions.gradedBy", select: "fullName username" };

export class AssignmentRepository {
  // ==================== ADMIN ====================

  async createAssignment(data: Partial<IAssignment>): Promise<IAssignment> {
    const assignment = new AssignmentModel(data);
    const saved = await assignment.save();
    return AssignmentModel.findById(saved._id)
      .populate(POPULATE_CREATOR)
      .populate(POPULATE_TEACHERS)
      .populate(POPULATE_GRADER) as Promise<IAssignment>;
  }

  // Returns ALL assignments regardless of isActive or dueDate
  // Used by admin listing AND teacher filtering
  async getAllAssignments(): Promise<IAssignment[]> {
    return AssignmentModel.find()
      .populate(POPULATE_CREATOR)
      .populate(POPULATE_TEACHERS)
      .populate(POPULATE_GRADER)
      .sort({ createdAt: -1 });
  }

  async getAssignmentById(assignmentId: string): Promise<IAssignment | null> {
    return AssignmentModel.findById(assignmentId)
      .populate(POPULATE_CREATOR)
      .populate(POPULATE_TEACHERS)
      .populate(POPULATE_GRADER);
  }

  async updateAssignment(assignmentId: string, data: Partial<IAssignment>): Promise<IAssignment | null> {
    return AssignmentModel.findByIdAndUpdate(
      assignmentId,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate(POPULATE_CREATOR)
      .populate(POPULATE_TEACHERS)
      .populate(POPULATE_GRADER);
  }

  async deleteAssignment(assignmentId: string): Promise<IAssignment | null> {
    return AssignmentModel.findByIdAndDelete(assignmentId);
  }

  async getAssignmentsByClassAndSection(classId: string, sectionId: string): Promise<IAssignment[]> {
    return AssignmentModel.find({ classId, sectionId })
      .populate(POPULATE_CREATOR)
      .populate(POPULATE_TEACHERS)
      .sort({ createdAt: -1 });
  }

  async getAssignmentsBySubject(subject: string): Promise<IAssignment[]> {
    return AssignmentModel.find({ subject })
      .populate(POPULATE_CREATOR)
      .populate(POPULATE_TEACHERS)
      .sort({ createdAt: -1 });
  }

  // ==================== STUDENT ====================

  async getAssignmentsForStudent(classId: string, sectionId: string): Promise<IAssignment[]> {
    return AssignmentModel.find({ classId, sectionId, isActive: true })
      .populate(POPULATE_CREATOR)
      .populate(POPULATE_TEACHERS)
      .sort({ dueDate: 1 });
  }

  async submitAssignment(assignmentId: string, submission: Partial<ISubmission>): Promise<IAssignment | null> {
    return AssignmentModel.findByIdAndUpdate(
      assignmentId,
      { $push: { submissions: { ...submission, submittedAt: new Date() } } },
      { new: true }
    );
  }

  async updateSubmission(assignmentId: string, studentId: string, submission: Partial<ISubmission>): Promise<IAssignment | null> {
    return AssignmentModel.findOneAndUpdate(
      { _id: assignmentId, "submissions.studentId": studentId },
      {
        $set: {
          "submissions.$.files":       submission.files,
          "submissions.$.textContent": submission.textContent,
          "submissions.$.submittedAt": new Date(),
        },
      },
      { new: true }
    );
  }

  async getStudentSubmission(assignmentId: string, studentId: string): Promise<ISubmission | null> {
    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) return null;
    return assignment.submissions.find((s) => s.studentId.toString() === studentId) || null;
  }

  async hasStudentSubmitted(assignmentId: string, studentId: string): Promise<boolean> {
    const result = await AssignmentModel.findOne({
      _id: assignmentId,
      "submissions.studentId": studentId,
    });
    return !!result;
  }

  // ==================== TEACHER ====================

  async gradeSubmission(
    assignmentId: string,
    studentId: string,
    marks: number,
    feedback: string,
    gradedBy: string
  ): Promise<IAssignment | null> {
    return AssignmentModel.findOneAndUpdate(
      { _id: assignmentId, "submissions.studentId": studentId },
      {
        $set: {
          "submissions.$.marks":    marks,
          "submissions.$.feedback": feedback,
          "submissions.$.gradedBy": new mongoose.Types.ObjectId(gradedBy),
          "submissions.$.gradedAt": new Date(),
        },
      },
      { new: true }
    ).populate(POPULATE_GRADER);
  }

  async getSubmissions(assignmentId: string): Promise<ISubmission[]> {
    const assignment = await AssignmentModel.findById(assignmentId);
    return assignment?.submissions || [];
  }

  async getSubmissionStats(assignmentId: string) {
    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) return null;
    const total  = assignment.submissions.length;
    const graded = assignment.submissions.filter(
      (s) => s.marks !== null && s.marks !== undefined
    ).length;
    return {
      totalSubmissions: total,
      gradedSubmissions: graded,
      pendingGrading: total - graded,
    };
  }

  // ==================== QUERY ====================

  async getOverdueAssignments(): Promise<IAssignment[]> {
    return AssignmentModel.find({ dueDate: { $lt: new Date() }, isActive: true })
      .populate(POPULATE_CREATOR)
      .populate(POPULATE_TEACHERS)
      .sort({ dueDate: -1 });
  }

  async getUpcomingAssignments(days = 7): Promise<IAssignment[]> {
    const today  = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);
    return AssignmentModel.find({ dueDate: { $gte: today, $lte: future }, isActive: true })
      .populate(POPULATE_CREATOR)
      .populate(POPULATE_TEACHERS)
      .sort({ dueDate: 1 });
  }
}