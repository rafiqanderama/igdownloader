// =========================
// SERVER.JS FINAL VERSION
// =========================

const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());

// === Paths ===
const COOKIES_DIR = process.env.COOKIES_DIR || "/data/cookies";
const COOKIE_PATH = path.join(COOKIES_DIR, "youtube.txt");
const YTDLP = process.env.YTDLP_PATH || "/usr/local/bin/yt-dlp";

// Ensure directory exists
if (!fs.existsSync(COOKIES_DIR)) {
  fs.mkdirSync(COOKIES_DIR, { recursive: true });
}

// === Helper: run yt-dlp raw
function runYtDlpRaw(args) {
  return new Promise((resolve, reject) => {
    execFile(YTDLP, args, { maxBuffer: 1024 * 1024 * 30 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.toString()));
      resolve(stdout.toString());
    });
  });
}

// === Helper: run yt-dlp JSON
function runYtDlpJSON(args) {
  return new Promise((resolve, reject) => {
    execFile(YTDLP, args, { maxBuffer: 1024 * 1024 * 30 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.toString()));
      try {
        resolve(JSON.parse(stdout.toString()));
      } catch (e) {
        return reject(new Error("JSON parse error: " + e.message));
      }
    });
  });
}

// Detect platform
function detect(url) {
  url = url.toLowerCase();
  if (url.includes("instagram.com")) return "ig";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("youtu.be") || url.includes("youtube.com")) return "yt";
  return "unknown";
}

// ===============================
// ADMIN — Upload Cookies
// ===============================

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

// Multer config
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, COOKIES_DIR),
  filename: (_, __, cb) => cb(null, "youtube.txt")
});

const upload = multer({ storage });

// Middleware check admin token
function requireAdmin(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token = header.replace("Bearer ", "").trim();

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.post("/admin/upload", requireAdmin, upload.single("cookies"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  return res.json({ ok: true, message: "Cookie uploaded successfully" });
});

app.get("/admin/cookie-status", requireAdmin, (req, res) => {
  const exists = fs.existsSync(COOKIE_PATH);
  return res.json({ exists });
});

// ===============================
// API Downloader
// ===============================

app.post("/api/download", async (req, res) => {
  const { url, type } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  const platform = detect(url);
  const cookieArgs = fs.existsSync(COOKIE_PATH) ? ["--cookies", COOKIE_PATH] : [];

  try {
    // IG
    if (platform === "ig") {
      const json = await runYtDlpJSON(["-j", url]);
      const results = [];

      if (Array.isArray(json.entries)) {
        for (const e of json.entries) {
          if (e.formats) {
            const best = e.formats.find(f => f.ext === "mp4" && f.acodec !== "none");
            if (best) results.push({ type: "video", url: best.url });
          }
        }
      } else if (json.formats) {
        const best = json.formats.find(f => f.ext === "mp4");
        if (best) results.push({ type: "video", url: best.url });
      }

      return res.json({ platform: "instagram", results });
    }

    // TikTok
    if (platform === "tiktok") {
      const json = await runYtDlpJSON(["-j", url]);
      const best = json.formats.find(f => f.acodec !== "none");
      return res.json({ platform: "tiktok", results: [{ url: best.url }] });
    }

    // YouTube MP3
    if (platform === "yt" && type === "mp3") {
      const out = await runYtDlpRaw(["-x", "--audio-format", "mp3", "-g", ...cookieArgs, url]);
      return res.json({ platform: "youtube", url: out.trim() });
    }

    // YouTube MP4
    if (platform === "yt" && type === "mp4") {
      const json = await runYtDlpJSON(["-j", "--extractor-args", "youtube:player_client=web", ...cookieArgs, url]);
      const best = json.formats.find(f => f.ext === "mp4" && f.acodec !== "none");
      return res.json({ platform: "youtube", url: best.url });
    }

    return res.status(400).json({ error: "Unsupported URL or missing type" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ===============================
// PUBLIC FILES
// ===============================
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
});
