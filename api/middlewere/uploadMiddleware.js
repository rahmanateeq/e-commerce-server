const multer = require("multer")
const path = require("path")
const { v4: uuidv4 } = require("uuid"); // Import v4 from uuid

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Set the folder where images will be stored
    },
    filename: (req, file, cb) => {
        // Use uuid to generate a unique identifier for the file
        const uniqueSuffix = uuidv4();
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});
// File filter to ensure only image files are uploaded
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};
// Set up multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: fileFilter,
});

module.exports = upload;