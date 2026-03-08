import { Router, Request, Response, NextFunction } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "./../middlewares/auth.middleware";
import { upload } from "./../middlewares/upload.middleware";
import multer from "multer";

const router = Router();
const controller = new AuthController();

const handleMulterUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single("profileImage")(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 5MB",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    } else if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

router.post("/register", controller.register.bind(controller));
router.post("/login", controller.login.bind(controller));

router.post("/forgot-password", controller.forgotPassword.bind(controller));
router.post("/verify-code", controller.verifyCode.bind(controller));
router.post("/reset-password", controller.resetPassword.bind(controller));

router.get("/profile", authMiddleware, controller.getProfile.bind(controller));

router.post(
  "/upload-profile-image",
  authMiddleware,
  handleMulterUpload,
  controller.uploadProfileImage.bind(controller)
);

router.put("/profile", authMiddleware, controller.updateProfile.bind(controller));

router.put(
  "/:id",
  authMiddleware,
  handleMulterUpload,
  controller.updateUserById.bind(controller)
);

router.post("/change-password", authMiddleware, controller.changePassword.bind(controller));

export default router;