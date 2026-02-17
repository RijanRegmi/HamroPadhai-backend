import { NoticeRepository } from "../../repositories/notice.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http.error";

const noticeRepository = new NoticeRepository();
const userRepository = new UserRepository();

export class StudentNoticeService {
  // Get all notices for student (based on their class and section)
  async getMyNotices(studentId: string) {
    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    if (!student.classId || !student.sectionId) {
      throw new HttpError(400, "You are not assigned to any class or section");
    }

    console.log("📢 Fetching notices for student:", {
      studentId,
      studentName: student.fullName,
      classId: student.classId,
      sectionId: student.sectionId,
    });

    const notices = await noticeRepository.getNoticesForClassAndSection(
      student.classId,
      student.sectionId
    );

    console.log("📢 Found notices:", notices.length);

    // Add read status for each notice
    const noticesWithStatus = notices.map((notice) => {
      const hasRead = notice.readBy.some(
        (read) => read.userId.toString() === studentId
      );

      return {
        ...notice.toObject(),
        hasRead,
        readAt: hasRead 
          ? notice.readBy.find((read) => read.userId.toString() === studentId)?.readAt 
          : null,
      };
    });

    return noticesWithStatus;
  }

  // Get notice by ID (only if it's for student's class/section)
  async getNoticeById(noticeId: string, studentId: string) {
    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    if (!student.classId || !student.sectionId) {
      throw new HttpError(400, "You are not assigned to any class or section");
    }

    const notice = await noticeRepository.getNoticeById(noticeId);
    if (!notice) {
      throw new HttpError(404, "Notice not found");
    }

    // Check if notice is for student's class and section
    const isForStudent = notice.targetClasses.some(
      (target) =>
        target.classId === student.classId &&
        target.sections.includes(student.sectionId!)
    );

    if (!isForStudent) {
      throw new HttpError(403, "You do not have access to this notice");
    }

    // Check if student has read this notice
    const hasRead = notice.readBy.some(
      (read) => read.userId.toString() === studentId
    );

    return {
      ...notice.toObject(),
      hasRead,
      readAt: hasRead 
        ? notice.readBy.find((read) => read.userId.toString() === studentId)?.readAt 
        : null,
    };
  }

  // Mark notice as read
  async markAsRead(noticeId: string, studentId: string) {
    // Verify student has access to this notice
    await this.getNoticeById(noticeId, studentId);

    const notice = await noticeRepository.markAsRead(noticeId, studentId);
    return notice;
  }

  // Get unread count
  async getUnreadCount(studentId: string) {
    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    if (!student.classId || !student.sectionId) {
      return { unreadCount: 0 };
    }

    const count = await noticeRepository.getUnreadCount(
      student.classId,
      student.sectionId,
      studentId
    );

    return { unreadCount: count };
  }

  // Get pinned notices for student
  async getPinnedNotices(studentId: string) {
    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    if (!student.classId || !student.sectionId) {
      return [];
    }

    const allPinnedNotices = await noticeRepository.getPinnedNotices();

    // Filter only notices for student's class and section
    const myPinnedNotices = allPinnedNotices.filter(notice =>
      notice.targetClasses.some(
        (target) =>
          target.classId === student.classId &&
          target.sections.includes(student.sectionId!)
      )
    );

    // Add read status
    const noticesWithStatus = myPinnedNotices.map((notice) => {
      const hasRead = notice.readBy.some(
        (read) => read.userId.toString() === studentId
      );

      return {
        ...notice.toObject(),
        hasRead,
        readAt: hasRead 
          ? notice.readBy.find((read) => read.userId.toString() === studentId)?.readAt 
          : null,
      };
    });

    return noticesWithStatus;
  }

  // Get notices by priority for student
  async getNoticesByPriority(priority: string, studentId: string) {
    const student = await userRepository.getUserById(studentId);
    if (!student) {
      throw new HttpError(404, "Student not found");
    }

    if (!student.classId || !student.sectionId) {
      return [];
    }

    const allNoticesByPriority = await noticeRepository.getNoticesByPriority(priority);

    // Filter only notices for student's class and section
    const myNotices = allNoticesByPriority.filter(notice =>
      notice.targetClasses.some(
        (target) =>
          target.classId === student.classId &&
          target.sections.includes(student.sectionId!)
      )
    );

    // Add read status
    const noticesWithStatus = myNotices.map((notice) => {
      const hasRead = notice.readBy.some(
        (read) => read.userId.toString() === studentId
      );

      return {
        ...notice.toObject(),
        hasRead,
        readAt: hasRead 
          ? notice.readBy.find((read) => read.userId.toString() === studentId)?.readAt 
          : null,
      };
    });

    return noticesWithStatus;
  }
}