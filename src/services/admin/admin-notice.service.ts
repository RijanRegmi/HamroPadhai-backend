import { CreateNoticeDTO, UpdateNoticeDTO } from "../../dtos/notice.dto";
import { NoticeRepository } from "../../repositories/notice.repository";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http.error";
import mongoose from "mongoose";

const noticeRepository = new NoticeRepository();
const userRepository = new UserRepository();

export class AdminNoticeService {
  // Create notice
  async createNotice(data: CreateNoticeDTO, createdBy: string) {
    const noticeData: any = {
      ...data,
      publishDate: new Date(), // Always use current time
      expiryDate: null, // No expiry - lasts forever
      isPinned: false, // No pin feature
      createdBy: new mongoose.Types.ObjectId(createdBy),
      readBy: [],
      isActive: true,
    };

    const notice = await noticeRepository.createNotice(noticeData);
    return notice;
  }

  // Get all notices (admin view)
  async getAllNotices() {
    const notices = await noticeRepository.getAllNotices();
    return notices;
  }

  // Get notice by ID
  async getNoticeById(noticeId: string) {
    const notice = await noticeRepository.getNoticeById(noticeId);
    if (!notice) {
      throw new HttpError(404, "Notice not found");
    }
    return notice;
  }

  // Update notice
  async updateNotice(noticeId: string, data: UpdateNoticeDTO) {
    const existingNotice = await noticeRepository.getNoticeById(noticeId);
    if (!existingNotice) {
      throw new HttpError(404, "Notice not found");
    }

    const updateData: any = { ...data };
    const notice = await noticeRepository.updateNotice(noticeId, updateData);
    return notice;
  }

  // Delete notice
  async deleteNotice(noticeId: string) {
    const notice = await noticeRepository.deleteNotice(noticeId);
    if (!notice) {
      throw new HttpError(404, "Notice not found");
    }
    return notice;
  }

  // Activate notice
  async activateNotice(noticeId: string) {
    const notice = await noticeRepository.updateNotice(noticeId, {
      isActive: true,
    } as any);
    if (!notice) {
      throw new HttpError(404, "Notice not found");
    }
    return notice;
  }

  // Deactivate notice
  async deactivateNotice(noticeId: string) {
    const notice = await noticeRepository.updateNotice(noticeId, {
      isActive: false,
    } as any);
    if (!notice) {
      throw new HttpError(404, "Notice not found");
    }
    return notice;
  }

  // Get pinned notices
  async getPinnedNotices() {
    const notices = await noticeRepository.getPinnedNotices();
    return notices;
  }

  // Get notices by priority
  async getNoticesByPriority(priority: string) {
    const notices = await noticeRepository.getNoticesByPriority(priority);
    return notices;
  }

  // Get expired notices
  async getExpiredNotices() {
    const notices = await noticeRepository.getExpiredNotices();
    return notices;
  }

  // Get scheduled (future) notices
  async getScheduledNotices() {
    const notices = await noticeRepository.getScheduledNotices();
    return notices;
  }

  // Search notices
  async searchNotices(query: string) {
    const notices = await noticeRepository.searchNotices(query);
    return notices;
  }

  // Get notice statistics
  async getNoticeStats(noticeId: string) {
    const stats = await noticeRepository.getNoticeStats(noticeId);
    if (!stats) {
      throw new HttpError(404, "Notice not found");
    }

    const notice = await noticeRepository.getNoticeById(noticeId);
    if (!notice) {
      throw new HttpError(404, "Notice not found");
    }

    let totalTargetStudents = 0;
    
    for (const target of notice.targetClasses) {
      for (const section of target.sections) {
        const students = await userRepository.getUsersByClassAndSection(target.classId, section);
        const studentCount = students.filter((user: any) => user.role === "user").length;
        totalTargetStudents += studentCount;
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