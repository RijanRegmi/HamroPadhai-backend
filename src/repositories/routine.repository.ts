import { RoutineModel, IRoutine } from "../models/routine.model";

export class RoutineRepository {
  async createRoutine(data: Partial<IRoutine>): Promise<IRoutine> {
    console.log("=== REPOSITORY: createRoutine ===");
    console.log("Data to save:", JSON.stringify(data, null, 2));
    
    try {
      const routine = new RoutineModel(data);
      console.log("Routine model created, saving to MongoDB...");
      
      const savedRoutine = await routine.save();
      
      console.log("✅ SAVED TO MONGODB");
      console.log("Saved routine ID:", savedRoutine._id);
      console.log("Saved routine:", JSON.stringify(savedRoutine, null, 2));
      
      return savedRoutine;
    } catch (error: any) {
      console.error("=== REPOSITORY SAVE ERROR ===");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Full error:", error);
      throw error;
    }
  }

  async getRoutineById(routineId: string): Promise<IRoutine | null> {
    return RoutineModel.findById(routineId).populate("createdBy", "fullName username email");
  }

  async getAllRoutines(): Promise<IRoutine[]> {
    return RoutineModel.find().populate("createdBy", "fullName username email").sort({ createdAt: -1 });
  }

  async getRoutinesByClassAndSection(classId: string, sectionId: string): Promise<IRoutine[]> {
    return RoutineModel.find({ classId, sectionId })
      .populate("createdBy", "fullName username email")
      .sort({ createdAt: -1 });
  }

  async getActiveRoutineByClassAndSection(
    classId: string,
    sectionId: string,
    academicYear?: string
  ): Promise<IRoutine | null> {
    const query: any = { classId, sectionId, isActive: true };
    if (academicYear) {
      query.academicYear = academicYear;
    }
    return RoutineModel.findOne(query).populate("createdBy", "fullName username email");
  }

  async getRoutinesByTeacher(teacherId: string): Promise<IRoutine[]> {
    return RoutineModel.find({
      "entries.periods.teacherId": teacherId,
      isActive: true,
    })
      .populate("createdBy", "fullName username email")
      .sort({ createdAt: -1 });
  }

  async updateRoutine(routineId: string, data: Partial<IRoutine>): Promise<IRoutine | null> {
    return RoutineModel.findByIdAndUpdate(routineId, { $set: data }, { new: true, runValidators: true }).populate(
      "createdBy",
      "fullName username email"
    );
  }

  async deleteRoutine(routineId: string): Promise<IRoutine | null> {
    return RoutineModel.findByIdAndDelete(routineId);
  }

  async deactivateOtherRoutines(classId: string, sectionId: string, academicYear: string, excludeId?: string): Promise<void> {
    const query: any = { classId, sectionId, academicYear, isActive: true };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    await RoutineModel.updateMany(query, { $set: { isActive: false } });
  }

  async getRoutinesByClass(classId: string): Promise<IRoutine[]> {
    return RoutineModel.find({ classId })
      .populate("createdBy", "fullName username email")
      .sort({ createdAt: -1 });
  }

  async getRoutinesByAcademicYear(academicYear: string): Promise<IRoutine[]> {
    return RoutineModel.find({ academicYear })
      .populate("createdBy", "fullName username email")
      .sort({ createdAt: -1 });
  }

  async searchRoutines(query: any): Promise<IRoutine[]> {
    return RoutineModel.find(query)
      .populate("createdBy", "fullName username email")
      .sort({ createdAt: -1 });
  }
}