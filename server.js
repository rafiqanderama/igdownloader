const express = require("express");
const { execFile } = require("child_process");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static website from public/
app.use(express.static(path.join(__dirname, "public")));

// path to binary (downloaded in Dockerfile)
const YTDLP = process.env.YTDLP_PATH || "/usr/local/bin/yt-dlp";

function runYtDlpJson(url) {
  return new Promise((resolve, reject) => {
    execFile(YTDLP, ["-j", url], { maxBuffer: 1024 * 1024 * 30 }, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.toString());
      try {
        resolve(JSON.parse(stdout.toString()));
      } catch (e) {
        return reject("JSON parse error: " + e.message + " -- raw: " + stdout.toString().slice(0,1000));
      }
    });
  });
}

app.post("/api/ig", async (req, res) => {
  const url = req.body.url;
  if (!url) return res.status(400).json({ error: "URL tidak boleh kosong" });

  try {
    const data = await runYtDlpJson(url);
    let videos = [];

    if (Array.isArray(data.entries)) {
      for (const e of data.entries) {
        if (e && e.formats) {
          const f = e.formats.find(x => x.ext === "mp4" && x.url);
          if (f) videos.push({ url: f.url, info: e.title || null });
        }
      }
    } else {
      if (data.formats) {
        const f = data.formats.find(x => x.ext === "mp4" && x.url);
        if (f) videos.push({ url: f.url, info: data.title || null });
      }
    }

    if (videos.length === 0) return res.status(404).json({ error: "Video tidak ditemukan / perlu cookie" });
    return res.json({ results: videos });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

// fallback: make sure root returns index.html (static express already handles it)
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("IG Downloader running on port", PORT));
