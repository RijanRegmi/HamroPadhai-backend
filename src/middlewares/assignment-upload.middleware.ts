import multer from "multer";
import path from "path";
import fs from "fs";

// Create upload directory for assignments
const assignmentUploadDir = path.join(__dirname, "../../uploads/assignments");
if (!fs.existsSync(assignmentUploadDir)) {
  fs.mkdirSync(assignmentUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assignmentUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `assignment-${uniqueSuffix}-${sanitizedFilename}`);
  },
});

// Image extensions that Android sends as application/octet-stream
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".heic", ".heif"];
const ALLOWED_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  ".pdf", ".doc", ".docx", ".ppt", ".pptx",
  ".xls", ".xlsx", ".txt", ".csv", ".zip",
];

const ALLOWED_MIMETYPES = [
  // Images
  "image/jpeg", "image/jpg", "image/png", "image/gif",
  "image/webp", "image/bmp", "image/heic", "image/heif",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/zip",
  // Android/Flutter often sends these generic types for any file
  "application/octet-stream",
  "application/binary",
];

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeAllowed = ALLOWED_MIMETYPES.includes(file.mimetype);
  const extAllowed = ALLOWED_EXTENSIONS.includes(ext);

  console.log("Assignment file received:", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    ext,
    mimeAllowed,
    extAllowed,
  });

  // Accept if EITHER the mimetype OR the extension is allowed
  // This handles Android sending application/octet-stream for images
  if (mimeAllowed || extAllowed) {
    console.log("File validation passed");
    return cb(null, true);
  }

  console.log("File validation failed:", file.mimetype, ext);
  cb(new Error(
    `Invalid file type. Allowed: PDF, DOC, PPT, XLS, TXT, Images. Received: ${file.mimetype} (${ext})`
  ));
};

export const uploadAssignmentFiles = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10,
  },
  fileFilter,
});

// Detect file type — check extension first since Android sends wrong mimetypes
export function getFileType(mimetype: string, originalname?: string): string {
  const ext = originalname ? path.extname(originalname).toLowerCase() : "";

  // Check by extension first (more reliable from mobile)
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".heic", ".heif"].includes(ext)) return "image";
  if (ext === ".pdf") return "pdf";
  if ([".doc", ".docx"].includes(ext)) return "document";
  if ([".ppt", ".pptx"].includes(ext)) return "presentation";
  if ([".xls", ".xlsx"].includes(ext)) return "spreadsheet";
  if ([".txt", ".csv"].includes(ext)) return "text";

  // Fallback to mimetype
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.includes("word")) return "document";
  if (mimetype.includes("powerpoint") || mimetype.includes("presentation")) return "presentation";
  if (mimetype.includes("excel") || mimetype.includes("spreadsheet")) return "spreadsheet";
  if (mimetype === "text/plain" || mimetype === "text/csv") return "text";

  return "other";
}

export function deleteAssignmentFiles(files: Array<{ fileUrl: string }>) {
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