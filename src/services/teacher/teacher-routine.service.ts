import { RoutineRepository } from "../../repositories/routine.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http.error";

const routineRepository = new RoutineRepository();
const userRepository = new UserRepository();

export class TeacherRoutineService {
  async getMyRoutines(teacherId: string) {
    // Get all active routines where this teacher is assigned
    const routines = await routineRepository.getRoutinesByTeacher(teacherId);
    return routines;
  }

  async getRoutineById(routineId: string, teacherId: string) {
    const routine = await routineRepository.getRoutineById(routineId);
    if (!routine) {
      throw new HttpError(404, "Routine not found");
    }

    // Check if teacher is assigned to this routine
    const isAssigned = routine.entries.some((entry) =>
      entry.periods.some((period) => period.teacherId === teacherId)
    );

    if (!isAssigned) {
      throw new HttpError(403, "You are not assigned to this routine");
    }

    return routine;
  }

  async getRoutinesByClassAndSection(classId: string, sectionId: string, teacherId: string) {
    const routines = await routineRepository.getRoutinesByClassAndSection(classId, sectionId);

    // Filter routines where teacher is assigned
    const teacherRoutines = routines.filter((routine) =>
      routine.entries.some((entry) => entry.periods.some((period) => period.teacherId === teacherId))
    );

    return teacherRoutines;
  }

  async getActiveRoutine(classId: string, sectionId: string, teacherId: string) {
    const routine = await routineRepository.getActiveRoutineByClassAndSection(classId, sectionId);
    
    if (!routine) {
      throw new HttpError(404, "No active routine found for this class and section");
    }

    // Check if teacher is assigned to this routine
    const isAssigned = routine.entries.some((entry) =>
      entry.periods.some((period) => period.teacherId === teacherId)
    );

    if (!isAssigned) {
      throw new HttpError(403, "You are not assigned to this routine");
    }

    return routine;
  }
}
