import { Request, Response } from "express";
import { UserModel } from "../models/user.model"; // ✅ adjust path if your model is elsewhere

export class FCMTokenController {
  // POST /api/student/fcm-token
  // Flutter calls this on login and on token refresh
  async saveToken(req: Request, res: Response) {
    try {
      const { fcmToken } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (!fcmToken || typeof fcmToken !== "string" || fcmToken.trim() === "") {
        return res.status(400).json({ success: false, message: "Invalid FCM token" });
      }

      // $addToSet prevents storing duplicate tokens for the same device
      await UserModel.findByIdAndUpdate(userId, {
        $addToSet: { fcmTokens: fcmToken.trim() },
      });

      console.log(`✅ FCM token saved for user ${userId}`);
      return res.status(200).json({ success: true, message: "FCM token saved" });
    } catch (err: any) {
      console.error("❌ saveToken error:", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  // DELETE /api/student/fcm-token
  // Flutter calls this on logout so the user stops getting notifications
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