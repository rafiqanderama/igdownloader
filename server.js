const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// Paths
// =======================
const DATA_DIR = "/data";
const IG_COOKIE_PATH = path.join(DATA_DIR, "ig_cookies.txt");

// mkdir jika tidak ada
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// =======================
// Upload Cookies IG
// =======================

const ADMIN_TOKEN = "gokuryo32";

// storage multer
const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, DATA_DIR),
    filename: (_, __, cb) => cb(null, "ig_cookies.txt")
});

const upload = multer({ storage });

// Middleware Admin
function requireAdmin(req, res, next) {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "").trim();

    if (token !== ADMIN_TOKEN) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

app.post("/admin/upload-ig", requireAdmin, upload.single("cookies"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    return res.json({ ok: true, message: "IG cookies uploaded" });
});

// =======================
// Helper yt-dlp
// =======================
const YTDLP = "/usr/local/bin/yt-dlp";

function runYtDlpJSON(args) {
    return new Promise((resolve, reject) => {
        execFile(YTDLP, args, { maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) return reject(stderr || err.toString());
            try {
                resolve(JSON.parse(stdout.toString()));
            } catch (e) {
                reject("JSON parse failed: " + e.toString());
            }
        });
    });
}

// =======================
// Downloader IG
// =======================

app.post("/api/ig", async (req, res) => {
    const { url } = req.body;

    if (!url) return res.json({ error: "URL kosong" });

    const cookieArgs = fs.existsSync(IG_COOKIE_PATH)
        ? ["--cookies", IG_COOKIE_PATH]
        : [];

    try {
        const json = await runYtDlpJSON(["-j", url, ...cookieArgs]);

        const video = json.formats?.find(
            f => f.ext === "mp4" && f.acodec !== "none"
        );

        if (!video) return res.json({ error: "Tidak ada video ditemukan" });

        return res.json({ url: video.url });

    } catch (e) {
        return res.json({ error: e.toString() });
    }
});

// =======================
// Static File
// =======================
app.use(express.static("public"));

// =======================
const PORT = 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
