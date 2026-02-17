import { NotificationRepository } from "./../repositories/notification.repository";
import { UserRepository } from "./../repositories/user.repository";
import { sendFCMPush } from "./fcm.service";
import mongoose from "mongoose";
import { UserModel } from "../models/user.model";

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

function collectTokens(users: any[]): string[] {
  return users.flatMap((u) => u.fcmTokens ?? []).filter(Boolean);
}

async function purgeInvalidTokens(tokens: string[]) {
  if (tokens.length === 0) return;
  try {
    await UserModel.updateMany(
      { fcmTokens: { $in: tokens } },
      { $pull: { fcmTokens: { $in: tokens } } }
    );
    console.log(`🗑️ Purged ${tokens.length} invalid FCM token(s)`);
  } catch (err) {
    console.error("❌ Failed to purge invalid tokens:", err);
  }
}

// ✅ Check if a student belongs to any of the notice's targetClasses
function studentMatchesTarget(
  user: any,
  targetClasses: Array<{ classId: string; sections: string[] }>
): boolean {
  const userClass   = String(user.classId   || "").trim();
  const userSection = String(user.sectionId || "").trim();
  if (!userClass || !userSection) return false;

  return targetClasses.some(
    (t) =>
      String(t.classId).trim() === userClass &&
      t.sections.map((s) => String(s).trim()).includes(userSection)
  );
}

// ✅ Check if a teacher is assigned to any of the notice's targetClasses/sections
function teacherMatchesTarget(
  user: any,
  targetClasses: Array<{ classId: string; sections: string[] }>
): boolean {
  const pairs = parseClassSections(String(user.classId || ""));
  if (pairs.length === 0) return false;

  return pairs.some((p) =>
    targetClasses.some(
      (t) =>
        String(t.classId).trim() === String(p.classId).trim() &&
        t.sections.some((ts) =>
          p.sections.map((s) => String(s).trim()).includes(String(ts).trim())
        )
    )
  );
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
        String(u.classId   || "").trim() === String(opts.classId).trim() &&
        String(u.sectionId || "").trim() === String(opts.sectionId).trim()
      );

      const teacherDocs = allUsers.filter((u: any) =>
        opts.assignedTeacherIds.some((id) => String(id) === String(u._id))
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
          refId:    opts.assignmentId,
          refModel: "Assignment",
          isRead:   false,
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
          refId:    opts.assignmentId,
          refModel: "Assignment",
          isRead:   false,
        });
      }

      if (notifications.length > 0) {
        await notificationRepo.createMany(notifications);
        console.log(`✅ notifyAssignment: saved ${notifications.length} notifications`);

        const fcmTitle = isNew ? `New Assignment: ${opts.title}` : `Assignment Updated: ${opts.title}`;
        const fcmBody  = isNew
          ? `${opts.subject} assignment posted for Class ${opts.classId}-${opts.sectionId}`
          : `${opts.subject} assignment updated for Class ${opts.classId}-${opts.sectionId}`;

        const tokens = collectTokens([...students, ...teacherDocs]);
        if (tokens.length > 0) {
          const invalid = await sendFCMPush(tokens, fcmTitle, fcmBody, opts.type);
          await purgeInvalidTokens(invalid);
        } else {
          console.warn("⚠️ notifyAssignment: no FCM tokens found for recipients");
        }
      } else {
        console.warn(`⚠️ notifyAssignment: 0 recipients found for class ${opts.classId}-${opts.sectionId}`);
      }
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

      console.log(`🔔 notifyRoutine: type=${opts.type} class=${opts.classId} section=${opts.sectionId}`);

      const students = allUsers.filter((u: any) =>
        u.role === "user" &&
        String(u.classId   || "").trim() === String(opts.classId).trim() &&
        String(u.sectionId || "").trim() === String(opts.sectionId).trim()
      );

      const teachers = allUsers.filter((u: any) => {
        if (u.role !== "teacher") return false;
        const pairs = parseClassSections(String(u.classId || ""));
        return pairs.some(
          (p) =>
            String(p.classId).trim() === String(opts.classId).trim() &&
            p.sections.map((s: string) => s.trim()).includes(String(opts.sectionId).trim())
        );
      });

      console.log(`   Students: ${students.length}, Teachers: ${teachers.length}`);

      const isNew = opts.type === "routine_created";
      const titleText   = isNew
        ? `New Routine: Class ${opts.classId}-${opts.sectionId}`
        : `Routine Updated: Class ${opts.classId}-${opts.sectionId}`;
      const messageText = isNew
        ? `A new class routine has been created for Class ${opts.classId}-${opts.sectionId} (${opts.academicYear})`
        : `The class routine for Class ${opts.classId}-${opts.sectionId} has been updated`;

      const notifications: any[] = [];

      for (const student of students) {
        notifications.push({
          recipientId: student._id, recipientRole: "user",
          type: opts.type, title: titleText, message: messageText,
          refId: opts.routineId, refModel: "Routine", isRead: false,
        });
      }
      for (const teacher of teachers) {
        notifications.push({
          recipientId: teacher._id, recipientRole: "teacher",
          type: opts.type, title: titleText, message: messageText,
          refId: opts.routineId, refModel: "Routine", isRead: false,
        });
      }

      if (notifications.length > 0) {
        await notificationRepo.createMany(notifications);
        console.log(`✅ notifyRoutine: saved ${notifications.length} notifications`);

        const tokens = collectTokens([...students, ...teachers]);
        if (tokens.length > 0) {
          const invalid = await sendFCMPush(tokens, titleText, messageText, opts.type);
          await purgeInvalidTokens(invalid);
        } else {
          console.warn("⚠️ notifyRoutine: no FCM tokens found for recipients");
        }
      } else {
        console.warn(`⚠️ notifyRoutine: 0 recipients found for class ${opts.classId}-${opts.sectionId}`);
      }
    } catch (err) {
      console.error("❌ notifyRoutine error:", err);
    }
  }

  // ── Notice ──────────────────────────────────────────────────────────────────
  async notifyNotice(opts: {
    type: "notice_created" | "notice_updated";
    noticeId: mongoose.Types.ObjectId;
    title: string;
    priority: "low" | "medium" | "high";
    // ✅ targetClasses now passed in so we know exactly who to notify
    targetClasses: Array<{ classId: string; sections: string[] }>;
  }) {
    try {
      const allUsers = await userRepo.getAllUsers();

      const isNew      = opts.type === "notice_created";
      const priorityEmoji = opts.priority === "high" ? "🔴 " : opts.priority === "medium" ? "🟡 " : "";
      const notifTitle = isNew
        ? `${priorityEmoji}New Notice: ${opts.title}`
        : `${priorityEmoji}Notice Updated: ${opts.title}`;
      const notifMsg   = isNew
        ? "A new school notice has been published"
        : "A school notice has been updated";

      const notifications: any[] = [];
      const recipients:    any[] = [];

      for (const user of allUsers) {
        if (user.role === "admin") continue;

        // ✅ Only notify students/teachers whose class-section is in targetClasses
        const matches =
          user.role === "user"
            ? studentMatchesTarget(user, opts.targetClasses)
            : teacherMatchesTarget(user, opts.targetClasses);

        if (!matches) continue;

        notifications.push({
          recipientId:   user._id,
          recipientRole: user.role === "teacher" ? "teacher" : "user",
          type:          opts.type,
          title:         notifTitle,
          message:       notifMsg,
          refId:         opts.noticeId,
          refModel:      "Notice",
          isRead:        false,
        });

        recipients.push(user);
      }

      if (notifications.length > 0) {
        await notificationRepo.createMany(notifications);
        console.log(`✅ notifyNotice: saved ${notifications.length} notifications for ${opts.targetClasses.length} target class(es)`);

        const tokens = collectTokens(recipients);
        if (tokens.length > 0) {
          const invalid = await sendFCMPush(tokens, notifTitle, notifMsg, opts.type);
          await purgeInvalidTokens(invalid);
        } else {
          console.warn("⚠️ notifyNotice: no FCM tokens found for recipients");
        }
      } else {
        console.warn("⚠️ notifyNotice: 0 recipients matched the targetClasses");
      }
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