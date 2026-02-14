import { NotificationModel, INotification } from "../models/notification.model";
import mongoose from "mongoose";

export class NotificationRepository {
  async createMany(notifications: Partial<INotification>[]): Promise<void> {
    if (notifications.length === 0) return;
    await NotificationModel.insertMany(notifications);
  }

  async getByRecipient(recipientId: string, limit = 30): Promise<INotification[]> {
    return NotificationModel.find({ recipientId: new mongoose.Types.ObjectId(recipientId) })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    return NotificationModel.countDocuments({
      recipientId: new mongoose.Types.ObjectId(recipientId),
      isRead: false,
    });
  }

  async markAsRead(notificationId: string, recipientId: string): Promise<void> {
    await NotificationModel.updateOne(
      { _id: notificationId, recipientId: new mongoose.Types.ObjectId(recipientId) },
      { $set: { isRead: true } }
    );
  }

  async markAllAsRead(recipientId: string): Promise<void> {
    await NotificationModel.updateMany(
      { recipientId: new mongoose.Types.ObjectId(recipientId), isRead: false },
      { $set: { isRead: true } }
    );
  }

  async deleteOld(recipientId: string): Promise<void> {
    const docs = await NotificationModel.find({ recipientId: new mongoose.Types.ObjectId(recipientId) })
      .sort({ createdAt: -1 })
      .select("_id")
      .limit(50);
    const keepIds = docs.map(d => d._id);
    await NotificationModel.deleteMany({
      recipientId: new mongoose.Types.ObjectId(recipientId),
      _id: { $nin: keepIds },
    });
  }
}