import { NotificationRepository } from "./../repositories/notification.repository";
import { UserRepository } from "./../repositories/user.repository";
import mongoose from "mongoose";

const notificationRepo = new NotificationRepository();
const userRepo = new UserRepository();

function parseClassSections(classId: string): Array<{ classId: string; sections: string[] }> {
  if (!classId) return [];
  try {
    if (classId.startsWith("[{")) return JSON.parse(classId);
    if (classId.startsWith("[")) {
      const classes = JSON.parse(classId);
      return classes.map((c: string) => ({ classId: c, sections: [] }));
    }
    return [{ classId, sections: [] }];
  } catch { return []; }
}

export class NotificationService {
  // ── Assignment ──────────────────────────────────────────────────────────────
  async notifyAssignment(opts: {
    type: "assignment_created" | "assignment_updated";
    assignmentId: mongoose.Types.ObjectId;
    title: string;
    subject: string;
    classId: string;
    sectionId: string;
    assignedTeacherIds: mongoose.Types.ObjectId[];
  }) {
    try {
      const allUsers = await userRepo.getAllUsers();

      const students = allUsers.filter((u: any) =>
        u.role === "user" &&
        String(u.classId || "").trim() === String(opts.classId).trim() &&
        String(u.sectionId || "").trim() === String(opts.sectionId).trim()
      );

      const isNew = opts.type === "assignment_created";
      const notifications: any[] = [];

      for (const student of students) {
        notifications.push({
          recipientId:   student._id,
          recipientRole: "user",
          type:          opts.type,
          title:         isNew ? `New Assignment: ${opts.title}` : `Assignment Updated: ${opts.title}`,
          message:       isNew
            ? `A new ${opts.subject} assignment has been posted for Class ${opts.classId}-${opts.sectionId}`
            : `The ${opts.subject} assignment has been updated for Class ${opts.classId}-${opts.sectionId}`,
          refId:         opts.assignmentId,
          refModel:      "Assignment",
          isRead:        false,
        });
      }

      for (const teacherId of opts.assignedTeacherIds) {
        notifications.push({
          recipientId:   teacherId,
          recipientRole: "teacher",
          type:          opts.type,
          title:         isNew ? `New Assignment Assigned: ${opts.title}` : `Assignment Updated: ${opts.title}`,
          message:       isNew
            ? `You have been assigned to grade ${opts.subject} for Class ${opts.classId}-${opts.sectionId}`
            : `The ${opts.subject} assignment you grade has been updated`,
          refId:         opts.assignmentId,
          refModel:      "Assignment",
          isRead:        false,
        });
      }

      await notificationRepo.createMany(notifications);
    } catch (err) {
      console.error("❌ notifyAssignment error:", err);
    }
  }

  // ── Routine ─────────────────────────────────────────────────────────────────
  async notifyRoutine(opts: {
    type: "routine_created" | "routine_updated";
    routineId: mongoose.Types.ObjectId;
    classId: string;
    sectionId: string;
    academicYear: string;
  }) {
    try {
      const allUsers = await userRepo.getAllUsers();

      const students = allUsers.filter((u: any) =>
        u.role === "user" &&
        String(u.classId || "").trim() === String(opts.classId).trim() &&
        String(u.sectionId || "").trim() === String(opts.sectionId).trim()
      );

      const teachers = allUsers.filter((u: any) => {
        if (u.role !== "teacher") return false;
        const pairs = parseClassSections(String(u.classId || ""));
        return pairs.some(p =>
          p.classId === String(opts.classId) &&
          p.sections.includes(String(opts.sectionId))
        );
      });

      const isNew = opts.type === "routine_created";
      const titleText   = isNew ? `New Routine: Class ${opts.classId}-${opts.sectionId}` : `Routine Updated: Class ${opts.classId}-${opts.sectionId}`;
      const messageText = isNew
        ? `A new class routine has been created for Class ${opts.classId}-${opts.sectionId} (${opts.academicYear})`
        : `The class routine for Class ${opts.classId}-${opts.sectionId} has been updated`;

      const notifications: any[] = [];

      for (const student of students) {
        notifications.push({ recipientId: student._id, recipientRole: "user",    type: opts.type, title: titleText, message: messageText, refId: opts.routineId, refModel: "Routine", isRead: false });
      }
      for (const teacher of teachers) {
        notifications.push({ recipientId: teacher._id, recipientRole: "teacher", type: opts.type, title: titleText, message: messageText, refId: opts.routineId, refModel: "Routine", isRead: false });
      }

      await notificationRepo.createMany(notifications);
    } catch (err) {
      console.error("❌ notifyRoutine error:", err);
    }
  }

  // ── Notice ──────────────────────────────────────────────────────────────────
  // Notices are broadcast to ALL students and teachers (school-wide)
  async notifyNotice(opts: {
    type: "notice_created" | "notice_updated";
    noticeId: mongoose.Types.ObjectId;
    title: string;
    priority: "low" | "medium" | "high";
  }) {
    try {
      const allUsers = await userRepo.getAllUsers();

      const isNew = opts.type === "notice_created";
      const priorityEmoji = opts.priority === "high" ? "🔴 " : opts.priority === "medium" ? "🟡 " : "";
      const notifications: any[] = [];

      for (const user of allUsers) {
        if (user.role === "admin") continue; // admins create notices, don't receive them

        notifications.push({
          recipientId:   user._id,
          recipientRole: user.role === "teacher" ? "teacher" : "user",
          type:          opts.type,
          title:         isNew ? `${priorityEmoji}New Notice: ${opts.title}` : `${priorityEmoji}Notice Updated: ${opts.title}`,
          message:       isNew
            ? `A new school notice has been published`
            : `A school notice has been updated`,
          refId:         opts.noticeId,
          refModel:      "Notice",
          isRead:        false,
        });
      }

      await notificationRepo.createMany(notifications);
    } catch (err) {
      console.error("❌ notifyNotice error:", err);
    }
  }

  // ── Read/unread ─────────────────────────────────────────────────────────────
  async getMyNotifications(userId: string) {
    return notificationRepo.getByRecipient(userId, 30);
  }

  async getUnreadCount(userId: string) {
    return notificationRepo.getUnreadCount(userId);
  }

  async markAsRead(notificationId: string, userId: string) {
    await notificationRepo.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string) {
    await notificationRepo.markAllAsRead(userId);
  }
}