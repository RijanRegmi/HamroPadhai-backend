import { CreateRoutineDTO, UpdateRoutineDTO } from "../../dtos/routine.dto";
import { RoutineRepository } from "../../repositories/routine.repository";
import { HttpError } from "../../errors/http.error";
import { IRoutineEntry } from "../../models/routine.model";
import mongoose from "mongoose";

const routineRepository = new RoutineRepository();

export class AdminRoutineService {
  async createRoutine(data: CreateRoutineDTO, createdBy: string) {
    console.log("=== SERVICE: createRoutine ===");
    console.log("Input data:", JSON.stringify(data, null, 2));
    console.log("Created by:", createdBy);

    try {
      // Check if there's already an active routine for this class-section-year
      console.log("Checking for existing routine...");
      const existingRoutine = await routineRepository.getActiveRoutineByClassAndSection(
        data.classId,
        data.sectionId,
        data.academicYear
      );

      if (existingRoutine) {
        console.error("❌ Routine already exists:", existingRoutine._id);
        throw new HttpError(
          409,
          `An active routine already exists for Class ${data.classId}, Section ${data.sectionId} for academic year ${data.academicYear}`
        );
      }

      console.log("✓ No existing routine found");

      // Normalize entries to ensure teacherId is string | null (not undefined)
      console.log("Normalizing entries...");
      const normalizedEntries: IRoutineEntry[] = data.entries.map((entry) => ({
        day: entry.day,
        periods: entry.periods.map((period) => ({
          periodNumber: period.periodNumber,
          startTime: period.startTime,
          endTime: period.endTime,
          subject: period.subject,
          teacherId: period.teacherId ?? null,
          teacherName: period.teacherName,
          roomNumber: period.roomNumber || "",
        })),
      }));

      console.log("Normalized entries:", JSON.stringify(normalizedEntries, null, 2));

      const routineData = {
        classId: data.classId,
        sectionId: data.sectionId,
        academicYear: data.academicYear,
        entries: normalizedEntries,
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(createdBy),
      };

      console.log("Creating routine with data:", JSON.stringify(routineData, null, 2));
      
      const routine = await routineRepository.createRoutine(routineData);
      
      console.log("✅ ROUTINE CREATED IN DATABASE");
      console.log("Routine ID:", routine._id);
      console.log("Routine data:", JSON.stringify(routine, null, 2));
      
      return routine;
    } catch (error: any) {
      console.error("=== SERVICE ERROR ===");
      console.error("Error:", error);
      throw error;
    }
  }

  async getAllRoutines() {
    const routines = await routineRepository.getAllRoutines();
    return routines;
  }

  async getRoutineById(routineId: string) {
    const routine = await routineRepository.getRoutineById(routineId);
    if (!routine) {
      throw new HttpError(404, "Routine not found");
    }
    return routine;
  }

  async getRoutinesByClass(classId: string) {
    const routines = await routineRepository.getRoutinesByClass(classId);
    return routines;
  }

  async getRoutinesByClassAndSection(classId: string, sectionId: string) {
    const routines = await routineRepository.getRoutinesByClassAndSection(classId, sectionId);
    return routines;
  }

  async updateRoutine(routineId: string, data: UpdateRoutineDTO) {
    const existingRoutine = await routineRepository.getRoutineById(routineId);
    if (!existingRoutine) {
      throw new HttpError(404, "Routine not found");
    }

    // If updating to active and class/section/year info changed, deactivate other routines
    if (data.isActive === true) {
      const classId = data.classId || existingRoutine.classId;
      const sectionId = data.sectionId || existingRoutine.sectionId;
      const academicYear = data.academicYear || existingRoutine.academicYear;

      await routineRepository.deactivateOtherRoutines(classId, sectionId, academicYear, routineId);
    }

    // Normalize entries if they exist
    const updateData: any = {
      ...(data.classId && { classId: data.classId }),
      ...(data.sectionId && { sectionId: data.sectionId }),
      ...(data.academicYear && { academicYear: data.academicYear }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    if (data.entries) {
      updateData.entries = data.entries.map((entry) => ({
        day: entry.day,
        periods: entry.periods.map((period) => ({
          periodNumber: period.periodNumber,
          startTime: period.startTime,
          endTime: period.endTime,
          subject: period.subject,
          teacherId: period.teacherId ?? null,
          teacherName: period.teacherName,
          roomNumber: period.roomNumber || "",
        })),
      }));
    }

    const routine = await routineRepository.updateRoutine(routineId, updateData);
    if (!routine) {
      throw new HttpError(404, "Routine not found");
    }

    return routine;
  }

  async deleteRoutine(routineId: string) {
    const routine = await routineRepository.deleteRoutine(routineId);
    if (!routine) {
      throw new HttpError(404, "Routine not found");
    }
    return routine;
  }

  async deactivateRoutine(routineId: string) {
    const routine = await routineRepository.updateRoutine(routineId, { isActive: false });
    if (!routine) {
      throw new HttpError(404, "Routine not found");
    }
    return routine;
  }

  async activateRoutine(routineId: string) {
    const routine = await routineRepository.getRoutineById(routineId);
    if (!routine) {
      throw new HttpError(404, "Routine not found");
    }

    // Deactivate other routines for the same class-section-year
    await routineRepository.deactivateOtherRoutines(
      routine.classId,
      routine.sectionId,
      routine.academicYear,
      routineId
    );

    const updatedRoutine = await routineRepository.updateRoutine(routineId, { isActive: true });
    return updatedRoutine;
  }
}