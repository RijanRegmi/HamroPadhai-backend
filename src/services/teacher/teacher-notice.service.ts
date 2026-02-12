import { NoticeRepository } from "../../repositories/notice.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http.error";

const noticeRepository = new NoticeRepository();
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

export class TeacherNoticeService {
  // Get all notices for teacher (based on their assigned classes/sections)
  async getMyNotices(teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    // ✅ Parse teacher's class-section assignments
    const teacherAssignments = parseTeacherAssignments(teacher);
    
    if (teacherAssignments.length === 0) {
      console.log("❌ Teacher has no class/section assignments");
      return [];
    }

    console.log("📢 Fetching notices for teacher:", {
      teacherId,
      teacherName: teacher.fullName,
      assignments: teacherAssignments,
    });

    // Get notices for all teacher's class-section pairs
    const notices = await noticeRepository.getNoticesForMultipleClassSections(
      teacherAssignments
    );

    console.log("📢 Found notices:", notices.length);

    // Add read status for each notice
    const noticesWithStatus = notices.map((notice) => {
      const hasRead = notice.readBy.some(
        (read) => read.userId.toString() === teacherId
      );

      return {
        ...notice.toObject(),
        hasRead,
        readAt: hasRead 
          ? notice.readBy.find((read) => read.userId.toString() === teacherId)?.readAt 
          : null,
      };
    });

    return noticesWithStatus;
  }

  // Get notice by ID (only if it's for teacher's class/section)
  async getNoticeById(noticeId: string, teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    const teacherAssignments = parseTeacherAssignments(teacher);
    
    if (teacherAssignments.length === 0) {
      throw new HttpError(400, "You are not assigned to any class or section");
    }

    const notice = await noticeRepository.getNoticeById(noticeId);
    if (!notice) {
      throw new HttpError(404, "Notice not found");
    }

    // ✅ FIXED: Check if notice is for any of teacher's class-section pairs
    // notice.targetClasses is now an array of objects: [{classId: "11", sections: ["A", "B"]}]
    const isForTeacher = teacherAssignments.some(assignment =>
      notice.targetClasses.some(target =>
        target.classId === assignment.classId &&
        target.sections.some(section => assignment.sections.includes(section))
      )
    );

    if (!isForTeacher) {
      throw new HttpError(403, "You do not have access to this notice");
    }

    // Check if teacher has read this notice
    const hasRead = notice.readBy.some(
      (read) => read.userId.toString() === teacherId
    );

    return {
      ...notice.toObject(),
      hasRead,
      readAt: hasRead 
        ? notice.readBy.find((read) => read.userId.toString() === teacherId)?.readAt 
        : null,
    };
  }

  // Mark notice as read
  async markAsRead(noticeId: string, teacherId: string) {
    // Verify teacher has access to this notice
    await this.getNoticeById(noticeId, teacherId);

    const notice = await noticeRepository.markAsRead(noticeId, teacherId);
    return notice;
  }

  // Get unread count for teacher (across all their classes)
  async getUnreadCount(teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    const teacherAssignments = parseTeacherAssignments(teacher);
    
    if (teacherAssignments.length === 0) {
      return { unreadCount: 0 };
    }

    // Get all notices for teacher
    const notices = await noticeRepository.getNoticesForMultipleClassSections(
      teacherAssignments
    );

    // Count unread notices
    const unreadCount = notices.filter(notice =>
      !notice.readBy.some(read => read.userId.toString() === teacherId)
    ).length;

    return { unreadCount };
  }

  // Get pinned notices for teacher
  async getPinnedNotices(teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    const teacherAssignments = parseTeacherAssignments(teacher);
    
    if (teacherAssignments.length === 0) {
      return [];
    }

    const allPinnedNotices = await noticeRepository.getPinnedNotices();

    // ✅ FIXED: Filter only notices for teacher's class-section pairs
    const myPinnedNotices = allPinnedNotices.filter(notice =>
      teacherAssignments.some(assignment =>
        notice.targetClasses.some(target =>
          target.classId === assignment.classId &&
          target.sections.some(section => assignment.sections.includes(section))
        )
      )
    );

    // Add read status
    const noticesWithStatus = myPinnedNotices.map((notice) => {
      const hasRead = notice.readBy.some(
        (read) => read.userId.toString() === teacherId
      );

      return {
        ...notice.toObject(),
        hasRead,
        readAt: hasRead 
          ? notice.readBy.find((read) => read.userId.toString() === teacherId)?.readAt 
          : null,
      };
    });

    return noticesWithStatus;
  }

  // Get notices by priority for teacher
  async getNoticesByPriority(priority: string, teacherId: string) {
    const teacher = await userRepository.getUserById(teacherId);
    if (!teacher) {
      throw new HttpError(404, "Teacher not found");
    }

    const teacherAssignments = parseTeacherAssignments(teacher);
    
    if (teacherAssignments.length === 0) {
      return [];
    }

    const allNoticesByPriority = await noticeRepository.getNoticesByPriority(priority);

    // ✅ FIXED: Filter only notices for teacher's class-section pairs
    const myNotices = allNoticesByPriority.filter(notice =>
      teacherAssignments.some(assignment =>
        notice.targetClasses.some(target =>
          target.classId === assignment.classId &&
          target.sections.some(section => assignment.sections.includes(section))
        )
      )
    );

    // Add read status
    const noticesWithStatus = myNotices.map((notice) => {
      const hasRead = notice.readBy.some(
        (read) => read.userId.toString() === teacherId
      );

      return {
        ...notice.toObject(),
        hasRead,
        readAt: hasRead 
          ? notice.readBy.find((read) => read.userId.toString() === teacherId)?.readAt 
          : null,
      };
    });

    return noticesWithStatus;
  }
}