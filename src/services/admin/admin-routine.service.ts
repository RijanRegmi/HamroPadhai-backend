import { CreateRoutineDTO, UpdateRoutineDTO } from "../../dtos/routine.dto";
import { RoutineRepository } from "../../repositories/routine.repository";
import { NotificationService } from "../notification.service";
import { NotificationRepository } from "../../repositories/notification.repository";
import { HttpError } from "../../errors/http.error";
import { IRoutineEntry } from "../../models/routine.model";
import mongoose from "mongoose";

const routineRepository      = new RoutineRepository();
const notificationService    = new NotificationService();
const notificationRepository = new NotificationRepository(); // ✅ for delete

export class AdminRoutineService {
  async createRoutine(data: CreateRoutineDTO, createdBy: string) {
    console.log("=== SERVICE: createRoutine ===");

    const existingRoutine = await routineRepository.getActiveRoutineByClassAndSection(
      data.classId, data.sectionId, data.academicYear
    );
    if (existingRoutine) {
      throw new HttpError(
        409,
        `An active routine already exists for Class ${data.classId}, Section ${data.sectionId} for academic year ${data.academicYear}`
      );
    }

    const normalizedEntries: IRoutineEntry[] = data.entries.map((entry) => ({
      day: entry.day,
      periods: entry.periods.map((period) => ({
        periodNumber: period.periodNumber,
        startTime:    period.startTime,
        endTime:      period.endTime,
        subject:      period.subject,
        teacherId:    period.teacherId ?? null,
        teacherName:  period.teacherName,
        roomNumber:   period.roomNumber || "",
      })),
    }));

    const routine = await routineRepository.createRoutine({
      classId:      data.classId,
      sectionId:    data.sectionId,
      academicYear: data.academicYear,
      entries:      normalizedEntries,
      isActive:     true,
      createdBy:    new mongoose.Types.ObjectId(createdBy),
    });

    console.log("✅ ROUTINE CREATED:", routine._id);

    notificationService.notifyRoutine({
      type:         "routine_created",
      routineId:    routine._id as mongoose.Types.ObjectId,
      classId:      data.classId,
      sectionId:    data.sectionId,
      academicYear: data.academicYear,
    }).catch((err) => console.error("❌ notifyRoutine (create) error:", err));

    return routine;
  }

  async getAllRoutines() {
    return routineRepository.getAllRoutines();
  }

  async getRoutineById(routineId: string) {
    const routine = await routineRepository.getRoutineById(routineId);
    if (!routine) throw new HttpError(404, "Routine not found");
    return routine;
  }

  async getRoutinesByClass(classId: string) {
    return routineRepository.getRoutinesByClass(classId);
  }

  async getRoutinesByClassAndSection(classId: string, sectionId: string) {
    return routineRepository.getRoutinesByClassAndSection(classId, sectionId);
  }

  async updateRoutine(routineId: string, data: UpdateRoutineDTO) {
    const existingRoutine = await routineRepository.getRoutineById(routineId);
    if (!existingRoutine) throw new HttpError(404, "Routine not found");

    if (data.isActive === true) {
      const classId      = data.classId      || existingRoutine.classId;
      const sectionId    = data.sectionId    || existingRoutine.sectionId;
      const academicYear = data.academicYear || existingRoutine.academicYear;
      await routineRepository.deactivateOtherRoutines(classId, sectionId, academicYear, routineId);
    }

    const updateData: any = {
      ...(data.classId      && { classId:      data.classId }),
      ...(data.sectionId    && { sectionId:    data.sectionId }),
      ...(data.academicYear && { academicYear: data.academicYear }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    if (data.entries) {
      updateData.entries = data.entries.map((entry) => ({
        day: entry.day,
        periods: entry.periods.map((period) => ({
          periodNumber: period.periodNumber,
          startTime:    period.startTime,
          endTime:      period.endTime,
          subject:      period.subject,
          teacherId:    period.teacherId ?? null,
          teacherName:  period.teacherName,
          roomNumber:   period.roomNumber || "",
        })),
      }));
    }

    const routine = await routineRepository.updateRoutine(routineId, updateData);
    if (!routine) throw new HttpError(404, "Routine not found");

    notificationService.notifyRoutine({
      type:         "routine_updated",
      routineId:    routine._id as mongoose.Types.ObjectId,
      classId:      data.classId      || existingRoutine.classId,
      sectionId:    data.sectionId    || existingRoutine.sectionId,
      academicYear: data.academicYear || existingRoutine.academicYear,
    }).catch((err) => console.error("❌ notifyRoutine (update) error:", err));

    return routine;
  }

  async deleteRoutine(routineId: string) {
    const routine = await routineRepository.deleteRoutine(routineId);
    if (!routine) throw new HttpError(404, "Routine not found");

    // ✅ Remove all notifications linked to this routine
    await notificationRepository.deleteByRef(routine._id);

    return routine;
  }

  async deactivateRoutine(routineId: string) {
    const routine = await routineRepository.updateRoutine(routineId, { isActive: false });
    if (!routine) throw new HttpError(404, "Routine not found");
    return routine;
  }

  async activateRoutine(routineId: string) {
    const routine = await routineRepository.getRoutineById(routineId);
    if (!routine) throw new HttpError(404, "Routine not found");

    await routineRepository.deactivateOtherRoutines(
      routine.classId, routine.sectionId, routine.academicYear, routineId
    );

    const updatedRoutine = await routineRepository.updateRoutine(routineId, { isActive: true });

    notificationService.notifyRoutine({
      type:         "routine_updated",
      routineId:    new mongoose.Types.ObjectId(routineId),
      classId:      routine.classId,
      sectionId:    routine.sectionId,
      academicYear: routine.academicYear,
    }).catch((err) => console.error("❌ notifyRoutine (activate) error:", err));

    return updatedRoutine;
  }
}