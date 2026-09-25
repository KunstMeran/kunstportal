const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { requireAuth, requirePermission } = require("../middleware/auth");

const STORAGE_PATH = process.env.STORAGE_PATH || "/var/www/kunstmeran/storage";

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.params.folder || "invoices";
        const uploadPath = path.join(STORAGE_PATH, folder);

        // Create directory if not exists
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // WICHTIG: Bei multipart/form-data ist req.body.filename hier noch nicht verfügbar!
        // Daher verwenden wir query parameter (?filename=...) oder generieren einen eindeutigen Namen
        const filename = req.query.filename || `${Date.now()}_${file.originalname}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        // Only allow PDFs and images
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only PDF and images allowed."));
        }
    }
});

// GET file - serve PDF or image
router.get("/:folder/:filename", requireAuth, async (req, res) => {
    const { folder, filename } = req.params;
    const filePath = path.join(STORAGE_PATH, folder, filename);

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found" });
        }

        // Determine content type
        const ext = path.extname(filename).toLowerCase();
        const contentTypes = {
            ".pdf": "application/pdf",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif"
        };

        const contentType = contentTypes[ext] || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (err) {
        console.error("File serve error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET file with subfolder support
router.get("/:folder/:subfolder/:filename", requireAuth, async (req, res) => {
    const { folder, subfolder, filename } = req.params;
    const filePath = path.join(STORAGE_PATH, folder, subfolder, filename);

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found" });
        }

        const ext = path.extname(filename).toLowerCase();
        const contentTypes = {
            ".pdf": "application/pdf",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif"
        };

        const contentType = contentTypes[ext] || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (err) {
        console.error("File serve error:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST upload file
router.post("/:folder", requireAuth, requirePermission("rechnungen", "write"), upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const folder = req.params.folder;
        const relativePath = `${folder}/${req.file.filename}`;

        res.json({
            success: true,
            filename: req.file.filename,
            path: relativePath,
            size: req.file.size
        });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE file
router.delete("/:folder/:filename", requireAuth, requirePermission("rechnungen", "delete"), async (req, res) => {
    const { folder, filename } = req.params;
    const filePath = path.join(STORAGE_PATH, folder, filename);

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found" });
        }

        fs.unlinkSync(filePath);
        res.json({ success: true, deleted: filename });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET list files in folder
router.get("/:folder", requireAuth, async (req, res) => {
    const { folder } = req.params;
    const folderPath = path.join(STORAGE_PATH, folder);

    try {
        if (!fs.existsSync(folderPath)) {
            return res.json([]);
        }

        const files = fs.readdirSync(folderPath, { withFileTypes: true });
        const fileList = files
            .filter(f => f.isFile())
            .map(f => ({
                name: f.name,
                path: `${folder}/${f.name}`,
                size: fs.statSync(path.join(folderPath, f.name)).size
            }));

        res.json(fileList);
    } catch (err) {
        console.error("List files error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
