import { SubmitAssignmentDTO } from "../../dtos/assignment.dto";
import { AssignmentRepository } from "../../repositories/assignment.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http.error";

const assignmentRepository = new AssignmentRepository();
const userRepository = new UserRepository();

export class StudentAssignmentService {
  // Helper to verify student has access to assignment
  private async verifyStudentAccess(assignmentId: string, studentId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    // Normalize values for comparison
    const studentClass = String(student.classId || "").trim();
    const studentSection = String(student.sectionId || "").trim();
    const assignmentClass = String(assignment.classId).trim();
    const assignmentSection = String(assignment.sectionId).trim();

    // Check if assignment belongs to student's class and section
    if (studentClass !== assignmentClass || studentSection !== assignmentSection) {
      throw new HttpError(
        403,
        `You can only access assignments for your own class and section. Your class: ${studentClass}-${studentSection}, Assignment class: ${assignmentClass}-${assignmentSection}`
      );
    }

    return { assignment, student };
  }

  // Get all assignments for student (based on their class and section)
  async getMyAssignments(studentId: string) {
    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    if (!student.classId || !student.sectionId) {
      throw new HttpError(400, "You are not assigned to any class or section. Please contact your administrator.");
    }

    console.log("📚 Fetching assignments for student:", {
      studentId,
      studentName: student.fullName,
      classId: student.classId,
      sectionId: student.sectionId,
    });

    const assignments = await assignmentRepository.getAssignmentsForStudent(
      student.classId,
      student.sectionId
    );

    console.log("📚 Found assignments:", assignments.length);

    const now = new Date();

    // Filter only active assignments that haven't passed deadline
    const activeAssignments = assignments.filter(
      (assignment) => assignment.isActive && new Date(assignment.dueDate) >= now
    );

    console.log("📚 Active assignments:", activeAssignments.length);

    // Add submission status for each assignment
    const assignmentsWithStatus = activeAssignments.map((assignment) => {
      const submission = assignment.submissions.find(
        (sub) => sub.studentId.toString() === studentId
      );

      return {
        ...assignment.toObject(),
        mySubmission: submission || null,
        hasSubmitted: !!submission,
        isGraded: submission ? submission.marks !== null && submission.marks !== undefined : false,
      };
    });

    return assignmentsWithStatus;
  }

  // Get assignment by ID (only if it belongs to student's class/section)
  async getAssignmentById(assignmentId: string, studentId: string) {
    const { assignment, student } = await this.verifyStudentAccess(assignmentId, studentId);

    // Find student's submission if exists
    const submission = assignment.submissions.find(
      (sub) => sub.studentId.toString() === studentId
    );

    return {
      ...assignment.toObject(),
      mySubmission: submission || null,
      hasSubmitted: !!submission,
      isGraded: submission ? submission.marks !== null && submission.marks !== undefined : false,
    };
  }

  // Submit assignment
  async submitAssignment(
    assignmentId: string,
    data: SubmitAssignmentDTO,
    studentId: string
  ) {
    const { assignment, student } = await this.verifyStudentAccess(assignmentId, studentId);

    // Check if assignment is still active
    if (!assignment.isActive) {
      throw new HttpError(400, "This assignment is no longer active");
    }

    // Check if deadline has passed
    const now = new Date();
    if (new Date(assignment.dueDate) < now) {
      throw new HttpError(400, "Assignment deadline has passed. Late submissions are not allowed.");
    }

    // Check if already submitted
    const hasSubmitted = await assignmentRepository.hasStudentSubmitted(
      assignmentId,
      studentId
    );

    const submissionData = {
      studentId: student._id,
      studentName: student.fullName,
      files: (data.files || []).map(file => ({
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileType: file.fileType,
        fileSize: file.fileSize || 0,
      })),
      textContent: data.textContent || "",
    };

    let updatedAssignment;

    if (hasSubmitted) {
      // Update existing submission (resubmit)
      updatedAssignment = await assignmentRepository.updateSubmission(
        assignmentId,
        studentId,
        submissionData
      );
    } else {
      // Create new submission
      updatedAssignment = await assignmentRepository.submitAssignment(
        assignmentId,
        submissionData
      );
    }

    return updatedAssignment;
  }

  // Get my submission for an assignment
  async getMySubmission(assignmentId: string, studentId: string) {
    await this.verifyStudentAccess(assignmentId, studentId);

    const submission = await assignmentRepository.getStudentSubmission(
      assignmentId,
      studentId
    );

    if (!submission) {
      throw new HttpError(404, "You have not submitted this assignment yet");
    }

    return submission;
  }

  // Get pending assignments (not submitted yet)
  async getPendingAssignments(studentId: string) {
    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    if (!student.classId || !student.sectionId) {
      throw new HttpError(400, "You are not assigned to any class or section");
    }

    const assignments = await assignmentRepository.getAssignmentsForStudent(
      student.classId,
      student.sectionId
    );

    const now = new Date();

    // Filter pending assignments (not submitted and not past deadline)
    const pendingAssignments = assignments.filter((assignment) => {
      const hasSubmitted = assignment.submissions.some(
        (sub) => sub.studentId.toString() === studentId
      );
      const isNotPastDue = new Date(assignment.dueDate) >= now;
      return !hasSubmitted && isNotPastDue && assignment.isActive;
    });

    return pendingAssignments;
  }

  // ✅ FIXED: Get submitted assignments - ALL assignments where student has submitted (regardless of due date)
  async getSubmittedAssignments(studentId: string) {
    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    if (!student.classId || !student.sectionId) {
      throw new HttpError(400, "You are not assigned to any class or section");
    }

    const assignments = await assignmentRepository.getAssignmentsForStudent(
      student.classId,
      student.sectionId
    );

    // ✅ Filter: ALL assignments where student has submitted (remove due date and active filters)
    const submittedAssignments = assignments
      .filter((assignment) => {
        const hasSubmitted = assignment.submissions.some(
          (sub) => sub.studentId.toString() === studentId
        );
        return hasSubmitted; // ✅ Only check if submitted, ignore due date and isActive
      })
      .map((assignment) => {
        const submission = assignment.submissions.find(
          (sub) => sub.studentId.toString() === studentId
        );
        return {
          ...assignment.toObject(),
          mySubmission: submission,
          hasSubmitted: true,
          isGraded: submission ? submission.marks !== null && submission.marks !== undefined : false,
        };
      });

    return submittedAssignments;
  }

  // ✅ FIXED: Get graded assignments - ALL assignments that have been graded (regardless of due date)
  async getGradedAssignments(studentId: string) {
    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    if (!student.classId || !student.sectionId) {
      throw new HttpError(400, "You are not assigned to any class or section");
    }

    const assignments = await assignmentRepository.getAssignmentsForStudent(
      student.classId,
      student.sectionId
    );

    // ✅ Filter: ALL assignments where student has a graded submission (remove due date and active filters)
    const gradedAssignments = assignments
      .filter((assignment) => {
        const submission = assignment.submissions.find(
          (sub) => sub.studentId.toString() === studentId
        );
        // Check if submission exists AND has been graded
        return submission && submission.marks !== null && submission.marks !== undefined;
      })
      .map((assignment) => {
        const submission = assignment.submissions.find(
          (sub) => sub.studentId.toString() === studentId
        );
        return {
          ...assignment.toObject(),
          mySubmission: submission,
          hasSubmitted: true,
          isGraded: true,
        };
      });

    return gradedAssignments;
  }

  // Get overdue assignments (not submitted and past due date)
  async getOverdueAssignments(studentId: string) {
    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    if (!student.classId || !student.sectionId) {
      throw new HttpError(400, "You are not assigned to any class or section");
    }

    const assignments = await assignmentRepository.getAssignmentsForStudent(
      student.classId,
      student.sectionId
    );

    const now = new Date();

    // Filter overdue assignments (not submitted and past due date but still active)
    const overdueAssignments = assignments.filter((assignment) => {
      const hasSubmitted = assignment.submissions.some(
        (sub) => sub.studentId.toString() === studentId
      );
      const isPastDue = new Date(assignment.dueDate) < now;
      return !hasSubmitted && isPastDue && assignment.isActive;
    });

    return overdueAssignments;
  }

  // Get history assignments (past deadline - submitted or not)
  async getHistoryAssignments(studentId: string) {
    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    if (!student.classId || !student.sectionId) {
      throw new HttpError(400, "You are not assigned to any class or section");
    }

    const assignments = await assignmentRepository.getAssignmentsForStudent(
      student.classId,
      student.sectionId
    );

    const now = new Date();

    // Filter history assignments (past deadline regardless of submission status)
    const historyAssignments = assignments
      .filter((assignment) => {
        const isPastDue = new Date(assignment.dueDate) < now;
        return isPastDue;
      })
      .map((assignment) => {
        const submission = assignment.submissions.find(
          (sub) => sub.studentId.toString() === studentId
        );
        return {
          ...assignment.toObject(),
          mySubmission: submission || null,
          hasSubmitted: !!submission,
          isGraded: submission ? submission.marks !== null && submission.marks !== undefined : false,
        };
      });

    return historyAssignments;
  }
}