import { RoutineRepository } from "../repositories/routine.repository";
import { UserRepository } from "../repositories/user.repository";
import { HttpError } from "../errors/http.error";

const routineRepository = new RoutineRepository();
const userRepository = new UserRepository();

export class StudentRoutineService {
  async getMyRoutine(userId: string) {
    // Get user to find their class and section
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    if (!user.classId || !user.sectionId) {
      throw new HttpError(400, "You are not assigned to any class or section");
    }

    // Get active routine for user's class and section
    const routine = await routineRepository.getActiveRoutineByClassAndSection(user.classId, user.sectionId);

    if (!routine) {
      throw new HttpError(404, "No routine found for your class and section");
    }

    return routine;
  }

  async getRoutineById(routineId: string, userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    if (!user.classId || !user.sectionId) {
      throw new HttpError(400, "You are not assigned to any class or section");
    }

    const routine = await routineRepository.getRoutineById(routineId);
    if (!routine) {
      throw new HttpError(404, "Routine not found");
    }

    // Check if routine belongs to user's class and section
    if (routine.classId !== user.classId || routine.sectionId !== user.sectionId) {
      throw new HttpError(403, "You can only view routines for your own class and section");
    }

    return routine;
  }

  async getAllMyRoutines(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    if (!user.classId || !user.sectionId) {
      throw new HttpError(400, "You are not assigned to any class or section");
    }

    const routines = await routineRepository.getRoutinesByClassAndSection(user.classId, user.sectionId);
    return routines;
  }
}
