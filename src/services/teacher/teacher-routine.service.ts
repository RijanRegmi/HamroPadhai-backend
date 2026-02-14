import { RoutineRepository } from "../../repositories/routine.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http.error";

const routineRepository = new RoutineRepository();
const userRepository    = new UserRepository();

// ── Helper: parse teacher's class-section JSON ────────────────────────────────
function parseTeacherAssignments(teacher: any): Array<{ classId: string; sections: string[] }> {
  if (!teacher.classId) return [];
  try {
    if (typeof teacher.classId === "string" && teacher.classId.startsWith("[{")) {
      return JSON.parse(teacher.classId);
    } else if (typeof teacher.classId === "string" && teacher.classId.startsWith("[")) {
      const classes  = JSON.parse(teacher.classId);
      const sections = teacher.sectionId ? JSON.parse(teacher.sectionId) : [];
      return classes.map((cls: string) => ({ classId: cls, sections }));
    } else {
      return [{ classId: teacher.classId, sections: teacher.sectionId ? [teacher.sectionId] : [] }];
    }
  } catch {
    return [];
  }
}

function teacherTeachesClassSection(
  assignments: Array<{ classId: string; sections: string[] }>,
  classId: string,
  sectionId: string
): boolean {
  return assignments.some(a => a.classId === classId && a.sections.includes(sectionId));
}

// ── Key fix: convert Mongoose doc to plain object FIRST, then filter ──────────
// The old bug: spreading a Mongoose subdocument with ...entry kept the original
// Mongoose 'periods' array instead of our filtered one. We must call toObject()
// on the entire document before any filtering.
function filterRoutineForTeacher(routine: any, teacherId: string) {
  // Convert entire Mongoose document to plain JS object first
  const plain = typeof routine.toObject === "function"
    ? routine.toObject()
    : JSON.parse(JSON.stringify(routine));

  console.log(`🔍 Filtering routine ${plain._id} (Class ${plain.classId}-${plain.sectionId}) for teacher ${teacherId}`);

  const filteredEntries = plain.entries
    .map((entry: any) => {
      const filteredPeriods = entry.periods.filter((period: any) => {
        const periodTeacherId = String(period.teacherId ?? "");
        const match = periodTeacherId === String(teacherId);
        console.log(`   Period ${period.periodNumber}: teacherId=${periodTeacherId} match=${match}`);
        return match;
      });
      return { ...entry, periods: filteredPeriods };
    })
    .filter((entry: any) => entry.periods.length > 0);

  console.log(`   → ${filteredEntries.length} days with periods for this teacher`);

  return { ...plain, entries: filteredEntries };
}

export class TeacherRoutineService {

  // ── Get routines — only periods assigned to THIS teacher ──────────────────
  async getMyRoutines(teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) throw new HttpError(404, "Teacher not found");

    console.log("📚 Fetching routines for teacher:", teacherId, teacher.fullName);

    const assignments = parseTeacherAssignments(teacher);
    if (assignments.length === 0) {
      console.log("❌ Teacher has no class/section assignments");
      return [];
    }

    console.log("✅ Teacher assignments:", assignments);

    const allRoutines = await routineRepository.getAllRoutines();

    const matchedRoutines = allRoutines.filter(
      (r) => r.isActive && teacherTeachesClassSection(assignments, r.classId, r.sectionId)
    );

    console.log(`✅ Class-section matched routines: ${matchedRoutines.length}`);

    const myRoutines = matchedRoutines
      .map((routine) => filterRoutineForTeacher(routine, teacherId))
      .filter((routine) => routine.entries.length > 0);

    console.log(`✅ Final routines after period filtering: ${myRoutines.length}`);

    return myRoutines;
  }

  // ── Get routine by ID ─────────────────────────────────────────────────────
  async getRoutineById(routineId: string, teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) throw new HttpError(404, "Teacher not found");

    const routine = await routineRepository.getRoutineById(routineId);
    if (!routine) throw new HttpError(404, "Routine not found");

    const assignments = parseTeacherAssignments(teacher);
    if (!teacherTeachesClassSection(assignments, routine.classId, routine.sectionId)) {
      throw new HttpError(403, "You can only view routines for classes and sections you teach");
    }

    return filterRoutineForTeacher(routine, teacherId);
  }

  // ── Get routines by class+section ─────────────────────────────────────────
  async getRoutinesByClassAndSection(classId: string, sectionId: string, teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) throw new HttpError(404, "Teacher not found");

    const assignments = parseTeacherAssignments(teacher);
    if (!teacherTeachesClassSection(assignments, classId, sectionId)) {
      throw new HttpError(403, "You can only view routines for classes and sections you teach");
    }

    const routines = await routineRepository.getRoutinesByClassAndSection(classId, sectionId);

    return routines
      .filter((r) => r.isActive)
      .map((routine) => filterRoutineForTeacher(routine, teacherId))
      .filter((r) => r.entries.length > 0);
  }

  // ── Get active routine for class+section ──────────────────────────────────
  async getActiveRoutine(classId: string, sectionId: string, teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) throw new HttpError(404, "Teacher not found");

    const assignments = parseTeacherAssignments(teacher);
    if (!teacherTeachesClassSection(assignments, classId, sectionId)) {
      throw new HttpError(403, "You can only view routines for classes and sections you teach");
    }

    const routine = await routineRepository.getActiveRoutineByClassAndSection(classId, sectionId);
    if (!routine) throw new HttpError(404, "No active routine found for this class and section");

    return filterRoutineForTeacher(routine, teacherId);
  }
}