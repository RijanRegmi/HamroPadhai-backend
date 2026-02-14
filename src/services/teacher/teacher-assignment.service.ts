import { GradeSubmissionDTO } from "../../dtos/assignment.dto";
import { AssignmentRepository } from "../../repositories/assignment.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http.error";

const assignmentRepository = new AssignmentRepository();
const userRepository = new UserRepository();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTeacherAssignments(teacher: any): Array<{ classId: string; sections: string[] }> {
  if (!teacher.classId) return [];
  try {
    if (teacher.classId.startsWith("[{")) {
      return JSON.parse(teacher.classId);
    } else if (teacher.classId.startsWith("[")) {
      const classes  = JSON.parse(teacher.classId);
      const sections = teacher.sectionId ? JSON.parse(teacher.sectionId) : [];
      return classes.map((cls: string) => ({ classId: cls, sections }));
    } else {
      return [{ classId: teacher.classId, sections: teacher.sectionId ? [teacher.sectionId] : [] }];
    }
  } catch { return []; }
}

function teacherTeachesClassSection(
  pairs: Array<{ classId: string; sections: string[] }>,
  classId: string,
  sectionId: string
): boolean {
  return pairs.some(p => p.classId === classId && p.sections.includes(sectionId));
}

// ✅ FIXED: Robust ID comparison handling ObjectId objects, strings, and nested {_id} shapes
function normalizeId(id: any): string {
  if (!id) return "";
  // Handle populated objects like { _id: ObjectId(...) }
  if (typeof id === "object" && id._id) return id._id.toString();
  return id.toString();
}

function canTeacherAccess(
  assignment: any,
  teacherId: string,
  pairs: Array<{ classId: string; sections: string[] }>
): boolean {
  const ids: any[] = assignment.assignedTeacherIds || [];

  console.log(`🔍 canTeacherAccess: assignedTeacherIds=${JSON.stringify(ids.map(normalizeId))} teacherId=${teacherId}`);

  if (ids.length > 0) {
    const match = ids.some((id: any) => normalizeId(id) === teacherId.toString());
    console.log(`   → assignedTeacherIds check: ${match}`);
    return match;
  }

  // Fallback for old assignments without assignedTeacherIds
  const fallback = teacherTeachesClassSection(pairs, assignment.classId, assignment.sectionId);
  console.log(`   → fallback class/section check: ${fallback}`);
  return fallback;
}

// ──────────────────────────────────────────────────────────────────────────────

export class TeacherAssignmentService {

  async getMyAssignments(teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) throw new HttpError(404, "Teacher not found");

    const pairs = parseTeacherAssignments(teacher);
    const now   = new Date();
    const all   = await assignmentRepository.getAllAssignmentsUnfiltered();

    console.log(`📋 Teacher ${teacher.fullName} - checking ${all.length} assignments`);

    return all.filter(a =>
      canTeacherAccess(a, teacherId, pairs) && new Date(a.dueDate) >= now
    );
  }

  async getAssignmentById(assignmentId: string, teacherId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) throw new HttpError(404, "Assignment not found");

    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) throw new HttpError(404, "Teacher not found");

    const pairs = parseTeacherAssignments(teacher);
    if (!canTeacherAccess(assignment, teacherId, pairs)) {
      throw new HttpError(403, "You are not assigned to grade this assignment");
    }

    const allStudents = await userRepository.getUsersByClassAndSection(
      assignment.classId, assignment.sectionId
    );
    const students = allStudents.filter((u: any) => u.role === "user");

    const studentsWithSubmissions = students.map((student: any) => {
      const submission = assignment.submissions.find(
        (sub: any) => sub.studentId.toString() === student._id.toString()
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
        isGraded:     submission
          ? (submission.marks !== null && submission.marks !== undefined)
          : false,
      };
    });

    return {
      ...(assignment.toObject ? assignment.toObject() : assignment),
      students: studentsWithSubmissions,
    };
  }

  async getAssignmentsByClassAndSection(classId: string, sectionId: string, teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) throw new HttpError(404, "Teacher not found");

    const pairs = parseTeacherAssignments(teacher);
    const now   = new Date();
    const assignments = await assignmentRepository.getAssignmentsByClassAndSection(classId, sectionId);

    return assignments.filter(a =>
      canTeacherAccess(a, teacherId, pairs) && new Date(a.dueDate) >= now
    );
  }

  async gradeSubmission(assignmentId: string, data: GradeSubmissionDTO, teacherId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) throw new HttpError(404, "Assignment not found");

    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) throw new HttpError(404, "Teacher not found");

    const pairs = parseTeacherAssignments(teacher);
    if (!canTeacherAccess(assignment, teacherId, pairs)) {
      throw new HttpError(403, "You are not assigned to grade this assignment");
    }

    if (data.marks > assignment.totalMarks) {
      throw new HttpError(400, `Marks cannot exceed total marks (${assignment.totalMarks})`);
    }

    const hasSubmitted = await assignmentRepository.hasStudentSubmitted(assignmentId, data.studentId);
    if (!hasSubmitted) throw new HttpError(404, "Student has not submitted this assignment");

    return assignmentRepository.gradeSubmission(
      assignmentId, data.studentId, data.marks, data.feedback || "", teacherId
    );
  }

  async getSubmissions(assignmentId: string, teacherId: string) {
    const assignment = await this.getAssignmentById(assignmentId, teacherId);
    return assignment.submissions;
  }

  async getSubmissionStats(assignmentId: string, teacherId: string) {
    const assignment = await assignmentRepository.getAssignmentById(assignmentId);
    if (!assignment) throw new HttpError(404, "Assignment not found");

    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) throw new HttpError(404, "Teacher not found");

    const pairs = parseTeacherAssignments(teacher);
    if (!canTeacherAccess(assignment, teacherId, pairs)) {
      throw new HttpError(403, "You are not assigned to this assignment");
    }

    const allStudents = await userRepository.getUsersByClassAndSection(
      assignment.classId, assignment.sectionId
    );
    const students = allStudents.filter((u: any) => u.role === "user");

    const totalStudents    = students.length;
    const totalSubmissions = assignment.submissions.length;
    const graded = assignment.submissions.filter(
      (s: any) => s.marks !== null && s.marks !== undefined
    ).length;

    return {
      totalStudents,
      totalSubmissions,
      gradedSubmissions: graded,
      pendingGrading:    totalSubmissions - graded,
      notSubmitted:      totalStudents - totalSubmissions,
    };
  }

  async getPendingSubmissions(assignmentId: string, teacherId: string) {
    const assignment = await this.getAssignmentById(assignmentId, teacherId);
    return assignment.submissions.filter(
      (s: any) => s.marks === null || s.marks === undefined
    );
  }

  async getGradedSubmissions(assignmentId: string, teacherId: string) {
    const assignment = await this.getAssignmentById(assignmentId, teacherId);
    return assignment.submissions.filter(
      (s: any) => s.marks !== null && s.marks !== undefined
    );
  }

  async getHistoryAssignments(teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) throw new HttpError(404, "Teacher not found");

    const pairs = parseTeacherAssignments(teacher);
    const now   = new Date();
    const all   = await assignmentRepository.getAllAssignmentsUnfiltered();

    return all.filter(a =>
      canTeacherAccess(a, teacherId, pairs) && new Date(a.dueDate) < now
    );
  }
}