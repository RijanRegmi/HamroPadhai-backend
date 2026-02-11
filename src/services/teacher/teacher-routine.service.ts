import { RoutineRepository } from "../../repositories/routine.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http.error";

const routineRepository = new RoutineRepository();
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
  routineClassId: string,
  routineSectionId: string
): boolean {
  return teacherAssignments.some(assignment => 
    assignment.classId === routineClassId && 
    assignment.sections.includes(routineSectionId)
  );
}

export class TeacherRoutineService {
  // Get all routines where teacher is assigned
  async getMyRoutines(teacherId: string) {
    // Get teacher user data
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    console.log("📚 Fetching routines for teacher:", {
      teacherId,
      teacherName: teacher.fullName,
      classId: teacher.classId,
      sectionId: teacher.sectionId,
    });

    // ✅ Parse teacher's class-section assignments
    const teacherAssignments = parseTeacherAssignments(teacher);
    
    if (teacherAssignments.length === 0) {
      console.log("❌ Teacher has no class/section assignments");
      return [];
    }

    console.log("✅ Teacher assignments:", teacherAssignments);

    // Get all active routines
    const allRoutines = await routineRepository.getAllRoutines();
    
    console.log("📚 Total routines in database:", allRoutines.length);

    // ✅ Filter routines that match teacher's assignments
    const myRoutines = allRoutines.filter(routine => {
      const matches = teacherTeachesClassSection(
        teacherAssignments,
        routine.classId,
        routine.sectionId
      );
      
      if (matches) {
        console.log(`✅ Match found: Class ${routine.classId} - Section ${routine.sectionId}`);
      }
      
      return matches && routine.isActive;
    });

    console.log("✅ Filtered routines count:", myRoutines.length);
    
    return myRoutines;
  }

  // Get routine by ID (only if teacher is assigned to that class-section)
  async getRoutineById(routineId: string, teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    const routine = await routineRepository.getRoutineById(routineId);
    if (!routine) {
      throw new HttpError(404, "Routine not found");
    }

    // ✅ Parse and check if teacher teaches this routine's class-section
    const teacherAssignments = parseTeacherAssignments(teacher);
    const canAccess = teacherTeachesClassSection(
      teacherAssignments,
      routine.classId,
      routine.sectionId
    );

    if (!canAccess) {
      throw new HttpError(
        403, 
        "You can only view routines for classes and sections you teach"
      );
    }

    return routine;
  }

  // Get routines by class and section (only if teacher teaches that class-section)
  async getRoutinesByClassAndSection(
    classId: string, 
    sectionId: string, 
    teacherId: string
  ) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    // ✅ Verify teacher teaches this class-section
    const teacherAssignments = parseTeacherAssignments(teacher);
    const canAccess = teacherTeachesClassSection(
      teacherAssignments, 
      classId, 
      sectionId
    );

    if (!canAccess) {
      throw new HttpError(
        403, 
        "You can only view routines for classes and sections you teach"
      );
    }

    const routines = await routineRepository.getRoutinesByClassAndSection(
      classId, 
      sectionId
    );
    
    return routines.filter(r => r.isActive);
  }

  // Get active routine for a specific class-section (only if teacher teaches it)
  async getActiveRoutine(
    classId: string, 
    sectionId: string, 
    teacherId: string
  ) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    // ✅ Verify teacher teaches this class-section
    const teacherAssignments = parseTeacherAssignments(teacher);
    const canAccess = teacherTeachesClassSection(
      teacherAssignments, 
      classId, 
      sectionId
    );

    if (!canAccess) {
      throw new HttpError(
        403, 
        "You can only view routines for classes and sections you teach"
      );
    }

    const routine = await routineRepository.getActiveRoutineByClassAndSection(
      classId, 
      sectionId
    );
    
    if (!routine) {
      throw new HttpError(
        404, 
        "No active routine found for this class and section"
      );
    }

    return routine;
  }
}