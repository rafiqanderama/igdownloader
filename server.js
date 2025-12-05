const express = require("express");
const cors = require("cors");
const { execFile, exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// static files (frontend)
app.use(express.static(path.join(__dirname, "public")));

const YTDLP = "/usr/local/bin/yt-dlp";

// helper to check yt-dlp
function ensureYtDlp() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(YTDLP)) return resolve(true);
    // fallback: try which
    exec("which yt-dlp || true", (err, stdout) => {
      if (stdout && stdout.trim()) return resolve(true);
      return reject(new Error("yt-dlp not found on system"));
    });
  });
}

function runYtDlpJSON(url, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const args = ["-j", "--no-warnings", "--no-check-certificate", ...extraArgs, url];
    execFile(YTDLP, args, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || err.message).toString()));
      try {
        const json = JSON.parse(stdout);
        resolve(json);
      } catch (e) {
        reject(new Error("Failed to parse yt-dlp JSON: " + e.message));
      }
    });
  });
}

function runYtDlpGet(url, args = []) {
  return new Promise((resolve, reject) => {
    const full = [...args, url];
    execFile(YTDLP, full, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || err.message).toString()));
      resolve(stdout.toString());
    });
  });
}

function detectPlatform(url) {
  if (!url || typeof url !== "string") return "unknown";
  const u = url.toLowerCase();
  if (u.includes("instagram.com") || u.includes("instagr.am")) return "instagram";
  if (u.includes("tiktok.com") || u.includes("vt.tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  return "unknown";
}

app.post("/api/download", async (req, res) => {
  const { url, type } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  const platform = detectPlatform(url);

  try {
    await ensureYtDlp();
  } catch (e) {
    return res.status(500).json({ error: "yt-dlp not installed on server" });
  }

  try {
    // INSTAGRAM
    if (platform === "instagram") {
      const data = await runYtDlpJSON(url);
      const results = [];

      if (Array.isArray(data.entries)) {
        for (const entry of data.entries) {
          if (entry.formats) {
            const best = entry.formats
              .filter(f => f.ext === "mp4" && f.acodec !== "none")
              .sort((a, b) => (b.height || 0) - (a.height || 0))[0];
            if (best) results.push({ type: "video", url: best.url, height: best.height, ext: best.ext });
          } else if (entry.url && entry.ext === "jpg") {
            results.push({ type: "image", url: entry.url });
          }
        }
      } else if (data.formats) {
        const best = data.formats
          .filter(f => f.ext === "mp4" && f.acodec !== "none")
          .sort((a, b) => (b.height || 0) - (a.height || 0))[0];
        if (best) results.push({ type: "video", url: best.url, height: best.height, ext: best.ext });
      } else if (data.url && data.ext === "jpg") {
        results.push({ type: "image", url: data.url });
      }

      return res.json({ platform: "instagram", results });
    }

    // TIKTOK
    if (platform === "tiktok") {
      // try to get best format with audio
      const data = await runYtDlpJSON(url, ["--no-check-certificate"]);
      let best = null;
      if (data && data.formats) {
        best = data.formats.find(f => f.vcodec !== "none" && f.acodec !== "none");
        if (!best) best = data.formats.reverse().find(f => f.ext === "mp4");
      }
      if (best) return res.json({ platform: "tiktok", results: [{ type: "video", url: best.url }] });
      return res.status(500).json({ error: "No downloadable TikTok format found" });
    }

    // YOUTUBE MP3 (type === "mp3")
    if (platform === "youtube" && type === "mp3") {
      // -x extract audio; -g print direct URL to audio stream
      // use --no-warnings --no-check-certificate
      const out = await runYtDlpGet(url, ["-x", "--audio-format", "mp3", "-g", "--no-warnings", "--no-check-certificate"]);
      return res.json({ platform: "youtube", type: "mp3", url: out.trim() });
    }

    // YOUTUBE MP4
    if (platform === "youtube" && type === "mp4") {
      // get json then pick best mp4
      // pass extractor-args to help signature if needed
      const data = await runYtDlpJSON(url, ["--extractor-args", "youtube:player_client=web"]);
      if (!data.formats) return res.status(500).json({ error: "No formats returned" });
      const best = data.formats
        .filter(f => f.ext === "mp4" && f.vcodec !== "none")
        .sort((a, b) => (b.height || 0) - (a.height || 0))[0];
      if (!best) return res.status(500).json({ error: "No suitable MP4 format found" });
      return res.json({ platform: "youtube", type: "mp4", url: best.url, height: best.height });
    }

    return res.status(400).json({ error: "Unsupported or unknown URL" });
  } catch (err) {
    console.error("yt-dlp error:", err);
    // try to return better message
    return res.status(500).json({ error: (err && err.message) ? err.message : String(err) });
  }
});

// fallback to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server listening on port", PORT));
