import { NoticeModel, INotice } from "../models/notice.model";
import mongoose from "mongoose";

// ✅ Single source of truth for populate fields
const CREATED_BY_FIELDS = "fullName username email role profileImage";
const READ_BY_FIELDS = "fullName username";

export class NoticeRepository {
  // ==================== ADMIN OPERATIONS ====================

  async createNotice(data: Partial<INotice>): Promise<INotice> {
    const notice = new NoticeModel(data);
    const saved = await notice.save();
    return NoticeModel.findById(saved._id)
      .populate("createdBy", CREATED_BY_FIELDS)
      .populate("readBy.userId", READ_BY_FIELDS) as Promise<INotice>;
  }

  async getAllNotices(): Promise<INotice[]> {
    return NoticeModel.find()
      .populate("createdBy", CREATED_BY_FIELDS)
      .populate("readBy.userId", READ_BY_FIELDS)
      .sort({ isPinned: -1, publishDate: -1, createdAt: -1 });
  }

  async getNoticeById(noticeId: string): Promise<INotice | null> {
    return NoticeModel.findById(noticeId)
      .populate("createdBy", CREATED_BY_FIELDS)
      .populate("readBy.userId", READ_BY_FIELDS);
  }

  async updateNotice(noticeId: string, data: Partial<INotice>): Promise<INotice | null> {
    return NoticeModel.findByIdAndUpdate(
      noticeId,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate("createdBy", CREATED_BY_FIELDS)
      .populate("readBy.userId", READ_BY_FIELDS);
  }

  async deleteNotice(noticeId: string): Promise<INotice | null> {
    return NoticeModel.findByIdAndDelete(noticeId);
  }

  // ==================== STUDENT/TEACHER OPERATIONS ====================

  async getNoticesForClassAndSection(classId: string, sectionId: string): Promise<INotice[]> {
    const now = new Date();
    return NoticeModel.find({
      "targetClasses.classId": classId,
      "targetClasses.sections": sectionId,
      isActive: true,
      publishDate: { $lte: now },
      $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
    })
      .populate("createdBy", CREATED_BY_FIELDS)
      .sort({ isPinned: -1, publishDate: -1 });
  }

  async getNoticesForMultipleClassSections(
    classSectionPairs: Array<{ classId: string; sections: string[] }>
  ): Promise<INotice[]> {
    const now = new Date();
    const orConditions = classSectionPairs.flatMap((pair) =>
      pair.sections.map((section) => ({
        "targetClasses.classId": pair.classId,
        "targetClasses.sections": section,
      }))
    );

    return NoticeModel.find({
      $and: [
        { $or: orConditions },
        { $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }] },
      ],
      isActive: true,
      publishDate: { $lte: now },
    })
      .populate("createdBy", CREATED_BY_FIELDS)
      .sort({ isPinned: -1, publishDate: -1 });
  }

  async markAsRead(noticeId: string, userId: string): Promise<INotice | null> {
    const existing = await NoticeModel.findOne({
      _id: noticeId,
      "readBy.userId": userId,
    });
    if (existing) return existing;

    return NoticeModel.findByIdAndUpdate(
      noticeId,
      {
        $push: {
          readBy: { userId: new mongoose.Types.ObjectId(userId), readAt: new Date() },
        },
      },
      { new: true }
    )
      .populate("createdBy", CREATED_BY_FIELDS)
      .populate("readBy.userId", READ_BY_FIELDS);
  }

  async hasUserRead(noticeId: string, userId: string): Promise<boolean> {
    const notice = await NoticeModel.findOne({ _id: noticeId, "readBy.userId": userId });
    return !!notice;
  }

  async getUnreadCount(classId: string, sectionId: string, userId: string): Promise<number> {
    const now = new Date();
    return NoticeModel.countDocuments({
      "targetClasses.classId": classId,
      "targetClasses.sections": sectionId,
      isActive: true,
      publishDate: { $lte: now },
      $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
      "readBy.userId": { $ne: userId },
    });
  }

  // ==================== QUERY OPERATIONS ====================

  async getPinnedNotices(): Promise<INotice[]> {
    const now = new Date();
    return NoticeModel.find({
      isPinned: true,
      isActive: true,
      publishDate: { $lte: now },
      $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
    })
      .populate("createdBy", CREATED_BY_FIELDS)
      .sort({ publishDate: -1 });
  }

  async getNoticesByPriority(priority: string): Promise<INotice[]> {
    const now = new Date();
    return NoticeModel.find({
      priority,
      isActive: true,
      publishDate: { $lte: now },
      $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
    })
      .populate("createdBy", CREATED_BY_FIELDS)
      .sort({ isPinned: -1, publishDate: -1 });
  }

  async getExpiredNotices(): Promise<INotice[]> {
    const now = new Date();
    return NoticeModel.find({ expiryDate: { $lt: now }, isActive: true })
      .populate("createdBy", CREATED_BY_FIELDS)
      .sort({ expiryDate: -1 });
  }

  async getScheduledNotices(): Promise<INotice[]> {
    const now = new Date();
    return NoticeModel.find({ publishDate: { $gt: now }, isActive: true })
      .populate("createdBy", CREATED_BY_FIELDS)
      .sort({ publishDate: 1 });
  }

  async searchNotices(query: string): Promise<INotice[]> {
    return NoticeModel.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
      ],
      isActive: true,
    })
      .populate("createdBy", CREATED_BY_FIELDS)
      .sort({ isPinned: -1, publishDate: -1 });
  }

  async getNoticeStats(noticeId: string) {
    const notice = await NoticeModel.findById(noticeId);
    if (!notice) return null;
    return {
      totalReads: notice.readBy.length,
      readByUsers: notice.readBy.map((read) => ({
        userId: read.userId,
        readAt: read.readAt,
      })),
    };
  }
}