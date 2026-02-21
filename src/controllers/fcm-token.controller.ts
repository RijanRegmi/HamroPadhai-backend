import { Request, Response } from "express";
import { UserModel } from "../models/user.model";

export class FCMTokenController {
  async saveToken(req: Request, res: Response) {
    try {
      const { fcmToken, oldFcmToken } = req.body; // Flutter sends old token if it has one
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (!fcmToken || typeof fcmToken !== "string" || fcmToken.trim() === "") {
        return res.status(400).json({ success: false, message: "Invalid FCM token" });
      }

      const newToken = fcmToken.trim();

      if (oldFcmToken && typeof oldFcmToken === "string" && oldFcmToken.trim() !== newToken) {
        // Replace old token with new one atomically
        await UserModel.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: oldFcmToken.trim() },
        });
      }

      await UserModel.findByIdAndUpdate(userId, {
        $addToSet: { fcmTokens: newToken },
      });

      console.log(`✅ FCM token saved for user ${userId}`);
      return res.status(200).json({ success: true, message: "FCM token saved" });
    } catch (err: any) {
      console.error("❌ saveToken error:", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  async removeToken(req: Request, res: Response) {
    try {
      const { fcmToken } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (fcmToken && typeof fcmToken === "string") {
        await UserModel.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: fcmToken.trim() },
        });
        console.log(`✅ FCM token removed for user ${userId}`);
      }

      return res.status(200).json({ success: true, message: "FCM token removed" });
    } catch (err: any) {
      console.error("❌ removeToken error:", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}