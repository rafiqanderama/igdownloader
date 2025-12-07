const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());

// =============================
// CONFIG
// =============================
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "goryto32"; // token default
const IG_COOKIE_PATH = "/data/ig_cookies.txt";
const YTDLP = "/usr/local/bin/yt-dlp";

// =============================
// Helper: jalankan yt-dlp (RAW)
// =============================
function runYtDlpRaw(args) {
    return new Promise((resolve, reject) => {
        execFile(
            YTDLP,
            args,
            { maxBuffer: 1024 * 1024 * 50 },
            (err, stdout, stderr) => {
                if (err) return reject(stderr || err.toString());
                resolve(stdout.toString());
            }
        );
    });
}

// =============================
// Helper: yt-dlp JSON
// =============================
function runYtDlpJSON(args) {
    return new Promise((resolve, reject) => {
        execFile(
            YTDLP,
            args,
            { maxBuffer: 1024 * 1024 * 50 },
            (err, stdout, stderr) => {
                if (err) return reject(stderr || err.toString());
                try {
                    resolve(JSON.parse(stdout.toString()));
                } catch (e) {
                    reject("JSON Parse Error: " + e.message);
                }
            }
        );
    });
}

// =============================
// ADMIN AUTH MIDDLEWARE
// =============================
function requireAdmin(req, res, next) {
    const header = req.headers["authorization"] || "";
    const token = header.replace("Bearer ", "").trim();

    if (token !== ADMIN_TOKEN) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    next();
}

// =============================
// UPLOAD IG COOKIES
// =============================
const storageIG = multer.diskStorage({
    destination: (_, __, cb) => cb(null, "/data"),
    filename: (_, __, cb) => cb(null, "ig_cookies.txt")
});
const uploadIG = multer({ storage: storageIG });

app.post("/admin/upload-ig", requireAdmin, uploadIG.single("cookies"), (req, res) => {
    if (!req.file) return res.json({ error: "Tidak ada file diupload" });

    return res.json({
        message: "Instagram cookies berhasil diupload!",
        path: IG_COOKIE_PATH
    });
});

// =============================
// CEK STATUS COOKIES IG
// =============================
app.get("/admin/ig-cookie-status", requireAdmin, (req, res) => {
    const exists = fs.existsSync(IG_COOKIE_PATH);
    res.json({ exists });
});

// =============================
// IG DOWNLOADER API
// =============================
app.post("/api/ig", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.json({ error: "URL tidak boleh kosong" });

    const cookieArgs = fs.existsSync(IG_COOKIE_PATH)
        ? ["--cookies", IG_COOKIE_PATH]
        : [];

    try {
        const json = await runYtDlpJSON(["-j", ...cookieArgs, url]);

        let results = [];

        // Jika playlist (Reels multi)
        if (Array.isArray(json.entries)) {
            for (const e of json.entries) {
                const vid = e.formats?.find(f => f.ext === "mp4" && f.url);
                if (vid) results.push(vid.url);
            }
        } else {
            const vid = json.formats?.find(f => f.ext === "mp4" && f.url);
            if (vid) results.push(vid.url);
        }

        if (results.length === 0) {
            return res.json({ error: "Tidak dapat mengambil video IG. Coba upload cookies IG." });
        }

        return res.json({ video: results });

    } catch (e) {
        return res.json({ error: e.toString() });
    }
});

// =============================
// STATIC FILES (index.html)
// =============================
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =============================
// START SERVER
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
