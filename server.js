// server.js
const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());

// path untuk menyimpan cookies (pastikan ini path volume di fly.toml)
const COOKIES_DIR = process.env.COOKIES_DIR || "/data/cookies"; 
const COOKIE_PATH = path.join(COOKIES_DIR, "youtube.txt");

// pastikan folder ada
if (!fs.existsSync(COOKIES_DIR)) {
  try { fs.mkdirSync(COOKIES_DIR, { recursive: true }); } catch(e){ console.warn(e); }
}

const YTDLP = process.env.YTDLP_PATH || "/usr/local/bin/yt-dlp";

// helper menjalankan yt-dlp (mengembalikan stdout string)
function runYtDlpRaw(args) {
  return new Promise((resolve, reject) => {
    execFile(YTDLP, args, { maxBuffer: 1024 * 1024 * 30 }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || err || "").toString()));
      resolve(stdout.toString());
    });
  });
}

function runYtDlpJSON(args) {
  return new Promise((resolve, reject) => {
    execFile(YTDLP, args, { maxBuffer: 1024 * 1024 * 30 }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || err || "").toString()));
      try {
        const json = JSON.parse(stdout.toString());
        resolve(json);
      } catch (e) {
        reject(new Error("Failed to parse JSON: " + e.message));
      }
    });
  });
}

// DETEK PLATFORM sederhana
function detectPlatform(url = "") {
  const u = (url || "").toLowerCase();
  if (u.includes("instagram.com") || u.includes("instagr.am")) return "instagram";
  if (u.includes("tiktok.com") || u.includes("vt.tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  return "unknown";
}

// === Upload cookie (admin)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ""; // set di Fly secrets
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, COOKIES_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, "youtube.txt"); // selalu simpan sebagai youtube.txt
  }
});
const upload = multer({ storage });

function requireAdmin(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token = header.replace("Bearer ", "").trim();
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// endpoint upload cookies: POST /admin/upload (form-data file field name "cookies")
app.post("/admin/upload", requireAdmin, upload.single("cookies"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  // basic validation: file contains "youtube" or "SID" or typical cookies content
  const content = fs.readFileSync(path.join(COOKIES_DIR, "youtube.txt"), "utf8");
  if (content.length < 20) {
    return res.status(400).json({ error: "Uploaded file seems too small" });
  }
  return res.json({ ok: true, message: "Cookies uploaded" });
});

// optional: show whether cookie exists
app.get("/admin/cookie-status", requireAdmin, (req, res) => {
  const exists = fs.existsSync(COOKIE_PATH);
  let info = { exists };
  if (exists) {
    try {
      const stat = fs.statSync(COOKIE_PATH);
      info.size = stat.size;
      info.mtime = stat.mtime;
    } catch(e){}
  }
  res.json(info);
});

// API utama: POST /api/download { url, type }
// type: for youtube "mp3" or "mp4"
app.post("/api/download", async (req, res) => {
  const { url, type } = req.body;
  if (!url) return res.status(400).json({ error: "Missing url" });
  const platform = detectPlatform(url);

  // helper add cookie arg if cookie exists and platform is youtube
  const cookieArgIfAny = [];
  if (platform === "youtube" && fs.existsSync(COOKIE_PATH)) {
    cookieArgIfAny.push("--cookies", COOKIE_PATH);
  }

  try {
    if (platform === "instagram") {
      // JSON extraction, choose best mp4
      const args = ["-j", "--no-warnings", "--no-check-certificate", url];
      const data = await runYtDlpJSON(args);
      const results = [];
      if (Array.isArray(data.entries)) {
        for (const e of data.entries) {
          if (e.formats) {
            const best = e.formats.filter(f => f.ext === "mp4" && f.acodec !== "none").sort((a,b)=> (b.height||0)-(a.height||0))[0];
            if (best) results.push({ type: "video", url: best.url });
          } else if (e.url && e.ext === "jpg") {
            results.push({ type: "image", url: e.url });
          }
        }
      } else if (data.formats) {
        const best = data.formats.filter(f => f.ext === "mp4" && f.acodec !== "none").sort((a,b)=> (b.height||0)-(a.height||0))[0];
        if (best) results.push({ type: "video", url: best.url });
      } else if (data.url && data.ext === "jpg") {
        results.push({ type: "image", url: data.url });
      }
      return res.json({ platform: "instagram", results });
    }

    if (platform === "tiktok") {
      // use JSON
      const args = ["-j", "--no-warnings", "--no-check-certificate", url];
      const data = await runYtDlpJSON(args);
      let best = null;
      if (data && data.formats) {
        best = data.formats.find(f => f.vcodec !== "none" && f.acodec !== "none") || data.formats.reverse().find(f => f.ext === "mp4");
      }
      if (best) return res.json({ platform: "tiktok", results: [{ type: "video", url: best.url }] });
      return res.status(500).json({ error: "No format" });
    }

    if (platform === "youtube") {
      // MP3: get direct audio stream URL via -x --audio-format mp3 -g
      if (type === "mp3") {
        const args = ["-x", "--audio-format", "mp3", "-g", "--no-warnings", "--no-check-certificate", ...cookieArgIfAny, url];
        const out = await runYtDlpRaw(args);
        return res.json({ platform: "youtube", type: "mp3", url: out.trim() });
      }
      // MP4: use JSON extraction and choose best mp4
      if (type === "mp4") {
        // pass extractor-args to help player client
        const args = ["-j", "--no-warnings", "--no-check-certificate", "--extractor-args", "youtube:player_client=web", ...cookieArgIfAny, url];
        const data = await runYtDlpJSON(args);
        if (!data.formats) return res.status(500).json({ error: "No formats returned" });
        const best = data.formats.filter(f => f.ext === "mp4" && f.vcodec !== "none").sort((a,b)=> (b.height||0)-(a.height||0))[0];
        if (!best) return res.status(500).json({ error: "No suitable MP4 found" });
        return res.json({ platform: "youtube", type: "mp4", url: best.url, height: best.height });
      }
      return res.status(400).json({ error: "Specify type mp3 or mp4 for youtube" });
    }

    return res.status(400).json({ error: "Unsupported URL" });
  } catch (err) {
    console.error("ERR", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// serve admin upload page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// static frontend
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log("Server up on", PORT));
