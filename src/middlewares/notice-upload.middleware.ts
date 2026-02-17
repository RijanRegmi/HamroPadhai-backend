import multer from "multer";
import path from "path";
import fs from "fs";

// Create upload directory for notices
const noticeUploadDir = path.join(__dirname, "../../uploads/notices");
if (!fs.existsSync(noticeUploadDir)) {
  fs.mkdirSync(noticeUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, noticeUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: notice-timestamp-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `notice-${uniqueSuffix}-${sanitizedFilename}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  console.log("Notice file received:", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  // Allowed file types for notices
  const allowedMimeTypes = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log("File validation passed");
    return cb(null, true);
  } else {
    console.log("File validation failed:", file.mimetype);
    cb(
      new Error(
        `Invalid file type. Allowed: PDF, DOC, PPT, XLS, TXT, Images. Received: ${file.mimetype}`
      )
    );
  }
};

export const uploadNoticeFiles = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Maximum 10 files
  },
  fileFilter: fileFilter,
});

// Helper function to get file type from mimetype
export function getNoticeFileType(mimetype: string): string {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.includes("word")) return "document";
  if (mimetype.includes("powerpoint") || mimetype.includes("presentation")) return "presentation";
  if (mimetype.includes("excel") || mimetype.includes("spreadsheet")) return "spreadsheet";
  if (mimetype === "text/plain") return "text";
  return "other";
}

// Helper function to delete notice files
export function deleteNoticeFiles(files: Array<{ fileUrl: string }>) {
  files.forEach((file) => {
    try {
      const filePath = path.join(__dirname, "../../", file.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Deleted file:", filePath);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  });
}