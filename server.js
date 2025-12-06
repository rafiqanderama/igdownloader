const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// === Serve static website (index.html, script.js, style.css) ===
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// === YT-DLP PATH ===
const YTDLP = "/usr/local/bin/yt-dlp";

// === RUN YT-DLP ===
function runYtDlp(url) {
  return new Promise((resolve, reject) => {
    execFile(
      YTDLP,
      ["-j", url],
      { maxBuffer: 1024 * 1024 * 20 },
      (err, stdout, stderr) => {
        if (err) return reject(stderr || err.toString());
        resolve(stdout.toString());
      }
    );
  });
}

// === IG DOWNLOADER ===
app.post("/api/ig", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.json({ error: "URL tidak boleh kosong" });

  try {
    const json = JSON.parse(await runYtDlp(url));

    let result = [];

    if (Array.isArray(json.entries)) {
      for (const e of json.entries) {
        const vid = e.formats?.find(f => f.ext === "mp4" && f.url);
        if (vid) result.push(vid.url);
      }
    } else {
      const vid = json.formats?.find(f => f.ext === "mp4" && f.url);
      if (vid) result.push(vid.url);
    }

    if (result.length === 0)
      return res.json({ error: "Tidak dapat mengambil video IG" });

    res.json({ video: result });

  } catch (e) {
    res.json({ error: e.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("IG Downloader running on port", PORT));
