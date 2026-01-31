import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../../uploads/profiles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter with better logging
const fileFilter = (req: any, file: any, cb: any) => {
  // Log the file details for debugging
  console.log("File received:", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  
  const allowedExtensions = /jpeg|jpg|png|gif|webp/;
  
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    console.log("✅ File validation passed");
    return cb(null, true);
  } else {
    console.log("❌ File validation failed:", {
      mimetype: file.mimetype,
      extname: path.extname(file.originalname),
      mimetypeValid: mimetype,
      extnameValid: extname,
    });
    cb(
      new Error(
        `Invalid file type. Allowed: JPEG, JPG, PNG, GIF, WEBP. Received: ${file.mimetype}`
      )
    );
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});