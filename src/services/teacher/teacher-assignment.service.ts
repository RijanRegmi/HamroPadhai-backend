import { GradeSubmissionDTO } from "../../dtos/assignment.dto";
import { AssignmentRepository } from "../../repositories/assignment.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http.error";

const assignmentRepository = new AssignmentRepository();
const userRepository = new UserRepository();

// ✅ Helper function to parse teacher's class-section assignments
function parseTeacherAssignments(teacher: any): Array<{classId: string, sections: string[]}> {
  if (!teacher.classId) return [];

  try {
    // NEW format: [{"classId":"11","sections":["A","B"]},{"classId":"12","sections":["D"]}]
    if (teacher.classId.startsWith('[{')) {
      return JSON.parse(teacher.classId);
    } 
    // Legacy format: separate arrays
    else if (teacher.classId.startsWith('[')) {
      const classes = JSON.parse(teacher.classId);
      const sections = teacher.sectionId ? JSON.parse(teacher.sectionId) : [];
      return classes.map((cls: string) => ({
        classId: cls,
        sections: sections
      }));
    } 
    // Single value format
    else {
      return [{
        classId: teacher.classId,
        sections: teacher.sectionId ? [teacher.sectionId] : []
      }];
    }
  } catch (error) {
    console.error('Error parsing teacher assignments:', error);
    return [];
  }
}

// ✅ Helper to check if teacher teaches a specific class-section
function teacherTeachesClassSection(
  teacherAssignments: Array<{classId: string, sections: string[]}>,
  assignmentClassId: string,
  assignmentSectionId: string
): boolean {
  return teacherAssignments.some(assignment => 
    assignment.classId === assignmentClassId && 
    assignment.sections.includes(assignmentSectionId)
  );
}

export class TeacherAssignmentService {
  // Get assignments for teacher (based on their assigned classes/sections)
  async getMyAssignments(teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    // ✅ Parse teacher's class-section assignments
    const teacherAssignments = parseTeacherAssignments(teacher);
    
    if (teacherAssignments.length === 0) {
      throw new HttpError(400, "Teacher is not assigned to any class or section");
    }

    console.log("📚 Fetching assignments for teacher:", {
      teacherId,
      teacherName: teacher.fullName,
      assignments: teacherAssignments,
    });

    // Get all assignments
    const allAssignments = await assignmentRepository.getAllAssignments();

    const now = new Date();

    // ✅ Filter assignments that match teacher's class-section pairs AND haven't passed deadline
    const myAssignments = allAssignments.filter(assignment => {
      const matches = teacherTeachesClassSection(
        teacherAssignments,
        assignment.classId,
        assignment.sectionId
      );
      const isActive = new Date(assignment.dueDate) >= now;
      return matches && isActive;
    });

    console.log("✅ Found assignments:", myAssignments.length);

    return myAssignments;
  }

  // ✅ ENHANCED: Get assignment by ID with ALL students (submitted + not submitted) INCLUDING PROFILE IMAGES
  async getAssignmentById(assignmentId: string, teacherId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    // ✅ Check if teacher teaches this class/section using new format
    const teacherAssignments = parseTeacherAssignments(teacher);
    const teachesThisClass = teacherTeachesClassSection(
      teacherAssignments,
      assignment.classId,
      assignment.sectionId
    );

    if (!teachesThisClass) {
      throw new HttpError(403, "You are not assigned to this class/section");
    }

    // ✅ Get all students in this class/section WITH PROFILE IMAGES
    const allStudents = await userRepository.getUsersByClassAndSection(
      assignment.classId,
      assignment.sectionId
    );

    // Filter only students (role === "user")
    const students = allStudents.filter((user: any) => user.role === "user");

    console.log("📚 Teacher viewing assignment:", {
      assignmentId,
      teacherId: teacher.fullName,
      classId: assignment.classId,
      sectionId: assignment.sectionId,
      totalStudents: students.length,
      totalSubmissions: assignment.submissions.length,
    });

    // Map students with their submission status AND profile image
    const studentsWithSubmissions = students.map((student: any) => {
      const submission = assignment.submissions.find(
        (sub: any) => sub.studentId.toString() === student._id.toString()
      );

      return {
        _id: student._id,
        fullName: student.fullName,
        username: student.username,
        email: student.email,
        classId: student.classId,
        sectionId: student.sectionId,
        profileImage: student.profileImage || null, // ✅ PROFILE IMAGE
        submission: submission || null,
        hasSubmitted: !!submission,
        isGraded: submission
          ? submission.marks !== null && submission.marks !== undefined
          : false,
      };
    });

    // Return assignment with enhanced student data
    return {
      ...(assignment.toObject ? assignment.toObject() : assignment),
      students: studentsWithSubmissions,
    };
  }

  // Get assignments by class and section (only if teacher teaches there)
  async getAssignmentsByClassAndSection(
    classId: string,
    sectionId: string,
    teacherId: string
  ) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    // ✅ Check if teacher teaches this class/section using new format
    const teacherAssignments = parseTeacherAssignments(teacher);
    const teachesThisClass = teacherTeachesClassSection(
      teacherAssignments,
      classId,
      sectionId
    );

    if (!teachesThisClass) {
      throw new HttpError(403, "You are not assigned to this class/section");
    }

    const assignments =
      await assignmentRepository.getAssignmentsByClassAndSection(
        classId,
        sectionId
      );

    const now = new Date();

    // Filter only assignments that haven't passed deadline
    const activeAssignments = assignments.filter(
      (assignment) => new Date(assignment.dueDate) >= now
    );

    return activeAssignments;
  }

  // Grade a submission
  async gradeSubmission(
    assignmentId: string,
    data: GradeSubmissionDTO,
    teacherId: string
  ) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    // ✅ Check if teacher teaches this class/section using new format
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    const teacherAssignments = parseTeacherAssignments(teacher);
    const teachesThisClass = teacherTeachesClassSection(
      teacherAssignments,
      assignment.classId,
      assignment.sectionId
    );

    if (!teachesThisClass) {
      throw new HttpError(403, "You are not assigned to this class/section");
    }

    // Validate marks
    if (data.marks > assignment.totalMarks) {
      throw new HttpError(
        400,
        `Marks cannot exceed total marks (${assignment.totalMarks})`
      );
    }

    // Check if submission exists
    const hasSubmitted = await assignmentRepository.hasStudentSubmitted(
      assignmentId,
      data.studentId
    );

    if (!hasSubmitted) {
      throw new HttpError(404, "Student has not submitted this assignment");
    }

    // Grade the submission
    const updatedAssignment = await assignmentRepository.gradeSubmission(
      assignmentId,
      data.studentId,
      data.marks,
      data.feedback || "",
      teacherId
    );

    return updatedAssignment;
  }

  // Get all submissions for an assignment
  async getSubmissions(assignmentId: string, teacherId: string) {
    const assignment = await this.getAssignmentById(assignmentId, teacherId);
    return assignment.submissions;
  }

  // ✅ ENHANCED: Get submission statistics with student count
  async getSubmissionStats(assignmentId: string, teacherId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    // Verify teacher access
    await this.getAssignmentById(assignmentId, teacherId);

    // Get all students in this class/section
    const allStudents = await userRepository.getUsersByClassAndSection(
      assignment.classId,
      assignment.sectionId
    );

    const students = allStudents.filter((user: any) => user.role === "user");

    const totalStudents = students.length;
    const totalSubmissions = assignment.submissions.length;
    const gradedSubmissions = assignment.submissions.filter(
      (sub: any) => sub.marks !== null && sub.marks !== undefined
    ).length;
    const pendingGrading = totalSubmissions - gradedSubmissions;
    const notSubmitted = totalStudents - totalSubmissions;

    return {
      totalStudents,
      totalSubmissions,
      gradedSubmissions,
      pendingGrading,
      notSubmitted,
    };
  }

  // Get pending submissions (not graded yet)
  async getPendingSubmissions(assignmentId: string, teacherId: string) {
    const assignment = await this.getAssignmentById(assignmentId, teacherId);
    const pendingSubmissions = assignment.submissions.filter(
      (sub: any) => sub.marks === null || sub.marks === undefined
    );

    return pendingSubmissions;
  }

  // Get graded submissions
  async getGradedSubmissions(assignmentId: string, teacherId: string) {
    const assignment = await this.getAssignmentById(assignmentId, teacherId);
    const gradedSubmissions = assignment.submissions.filter(
      (sub: any) => sub.marks !== null && sub.marks !== undefined
    );

    return gradedSubmissions;
  }

  // Get history assignments (past deadline)
  async getHistoryAssignments(teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    // ✅ Parse teacher's class-section assignments
    const teacherAssignments = parseTeacherAssignments(teacher);
    
    if (teacherAssignments.length === 0) {
      throw new HttpError(400, "Teacher is not assigned to any class or section");
    }

    // Get all assignments
    const allAssignments = await assignmentRepository.getAllAssignments();

    const now = new Date();

    // ✅ Filter assignments that match teacher's class-section pairs AND have passed deadline
    const historyAssignments = allAssignments.filter(assignment => {
      const matches = teacherTeachesClassSection(
        teacherAssignments,
        assignment.classId,
        assignment.sectionId
      );
      const isPastDue = new Date(assignment.dueDate) < now;
      return matches && isPastDue;
    });

    return historyAssignments;
  }
}