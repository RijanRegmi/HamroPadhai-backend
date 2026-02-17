import { CreateNoticeDTO, UpdateNoticeDTO } from "../../dtos/notice.dto";
import { NoticeRepository } from "../../repositories/notice.repository";
import { UserRepository } from "../../repositories/user.repository";
import { NotificationService } from "../notification.service";
import { NotificationRepository } from "../../repositories/notification.repository";
import { HttpError } from "../../errors/http.error";
import mongoose from "mongoose";

const noticeRepository       = new NoticeRepository();
const userRepository         = new UserRepository();
const notificationService    = new NotificationService();
const notificationRepository = new NotificationRepository(); // ✅ for delete

export class AdminNoticeService {
  async createNotice(data: CreateNoticeDTO, createdBy: string) {
    const noticeData: any = {
      ...data,
      publishDate: new Date(),
      expiryDate:  null,
      isPinned:    false,
      createdBy:   new mongoose.Types.ObjectId(createdBy),
      readBy:      [],
      isActive:    true,
    };

    const notice = await noticeRepository.createNotice(noticeData);

    // ✅ Only notifies students/teachers in the selected targetClasses
    notificationService.notifyNotice({
      type:          "notice_created",
      noticeId:      notice._id,
      title:         data.title,
      priority:      (data as any).priority || "low",
      targetClasses: notice.targetClasses,
    });

    return notice;
  }

  async getAllNotices() {
    return noticeRepository.getAllNotices();
  }

  async getNoticeById(noticeId: string) {
    const notice = await noticeRepository.getNoticeById(noticeId);
    if (!notice) throw new HttpError(404, "Notice not found");
    return notice;
  }

  async updateNotice(noticeId: string, data: UpdateNoticeDTO) {
    const existingNotice = await noticeRepository.getNoticeById(noticeId);
    if (!existingNotice) throw new HttpError(404, "Notice not found");

    const notice = await noticeRepository.updateNotice(noticeId, { ...data } as any);

    // ✅ Use updated targetClasses if changed, otherwise keep existing
    const targetClasses = (data as any).targetClasses ?? existingNotice.targetClasses;

    notificationService.notifyNotice({
      type:          "notice_updated",
      noticeId:      existingNotice._id,
      title:         (data as any).title    || existingNotice.title,
      priority:      (data as any).priority || (existingNotice as any).priority || "low",
      targetClasses,
    });

    return notice;
  }

  async deleteNotice(noticeId: string) {
    const notice = await noticeRepository.deleteNotice(noticeId);
    if (!notice) throw new HttpError(404, "Notice not found");

    // ✅ Remove all notifications linked to this notice
    await notificationRepository.deleteByRef(notice._id);

    return notice;
  }

  async activateNotice(noticeId: string) {
    const notice = await noticeRepository.updateNotice(noticeId, { isActive: true } as any);
    if (!notice) throw new HttpError(404, "Notice not found");
    return notice;
  }

  async deactivateNotice(noticeId: string) {
    const notice = await noticeRepository.updateNotice(noticeId, { isActive: false } as any);
    if (!notice) throw new HttpError(404, "Notice not found");
    return notice;
  }

  async getPinnedNotices()              { return noticeRepository.getPinnedNotices(); }
  async getNoticesByPriority(p: string) { return noticeRepository.getNoticesByPriority(p); }
  async getExpiredNotices()             { return noticeRepository.getExpiredNotices(); }
  async getScheduledNotices()           { return noticeRepository.getScheduledNotices(); }
  async searchNotices(q: string)        { return noticeRepository.searchNotices(q); }

  async getNoticeStats(noticeId: string) {
    const stats = await noticeRepository.getNoticeStats(noticeId);
    if (!stats) throw new HttpError(404, "Notice not found");

    const notice = await noticeRepository.getNoticeById(noticeId);
    if (!notice) throw new HttpError(404, "Notice not found");

    let totalTargetStudents = 0;
    for (const target of notice.targetClasses) {
      for (const section of target.sections) {
        const students = await userRepository.getUsersByClassAndSection(target.classId, section);
        totalTargetStudents += students.filter((u: any) => u.role === "user").length;
      }
    }

    return {
      ...stats,
      totalTargetStudents,
      readPercentage: totalTargetStudents > 0
        ? ((stats.totalReads / totalTargetStudents) * 100).toFixed(2)
        : "0.00",
    };
  }
}