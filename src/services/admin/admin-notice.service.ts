import { CreateNoticeDTO, UpdateNoticeDTO } from "../../dtos/notice.dto";
import { NoticeRepository } from "../../repositories/notice.repository";
import { UserRepository } from "../../repositories/user.repository";
import { NotificationService } from "../notification.service"; 
import { HttpError } from "../../errors/http.error";
import mongoose from "mongoose";

const noticeRepository    = new NoticeRepository();
const userRepository      = new UserRepository();
const notificationService = new NotificationService();

export class AdminNoticeService {
  // Create notice
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

    // 🔔 fire-and-forget
    notificationService.notifyNotice({
      type:     "notice_created",
      noticeId: notice._id,
      title:    data.title,
      priority: (data as any).priority || "low",
    });

    return notice;
  }

  // Get all notices (admin view)
  async getAllNotices() {
    return noticeRepository.getAllNotices();
  }

  // Get notice by ID
  async getNoticeById(noticeId: string) {
    const notice = await noticeRepository.getNoticeById(noticeId);
    if (!notice) throw new HttpError(404, "Notice not found");
    return notice;
  }

  // Update notice
  async updateNotice(noticeId: string, data: UpdateNoticeDTO) {
    const existingNotice = await noticeRepository.getNoticeById(noticeId);
    if (!existingNotice) throw new HttpError(404, "Notice not found");

    const notice = await noticeRepository.updateNotice(noticeId, { ...data } as any);

    // 🔔 fire-and-forget
    notificationService.notifyNotice({
      type:     "notice_updated",
      noticeId: existingNotice._id,
      title:    (data as any).title || existingNotice.title,
      priority: (data as any).priority || (existingNotice as any).priority || "low",
    });

    return notice;
  }

  // Delete notice
  async deleteNotice(noticeId: string) {
    const notice = await noticeRepository.deleteNotice(noticeId);
    if (!notice) throw new HttpError(404, "Notice not found");
    return notice;
  }

  // Activate notice
  async activateNotice(noticeId: string) {
    const notice = await noticeRepository.updateNotice(noticeId, { isActive: true } as any);
    if (!notice) throw new HttpError(404, "Notice not found");
    return notice;
  }

  // Deactivate notice
  async deactivateNotice(noticeId: string) {
    const notice = await noticeRepository.updateNotice(noticeId, { isActive: false } as any);
    if (!notice) throw new HttpError(404, "Notice not found");
    return notice;
  }

  // Get pinned notices
  async getPinnedNotices() {
    return noticeRepository.getPinnedNotices();
  }

  // Get notices by priority
  async getNoticesByPriority(priority: string) {
    return noticeRepository.getNoticesByPriority(priority);
  }

  // Get expired notices
  async getExpiredNotices() {
    return noticeRepository.getExpiredNotices();
  }

  // Get scheduled (future) notices
  async getScheduledNotices() {
    return noticeRepository.getScheduledNotices();
  }

  // Search notices
  async searchNotices(query: string) {
    return noticeRepository.searchNotices(query);
  }

  // Get notice statistics
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