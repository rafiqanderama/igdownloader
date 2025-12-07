const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const IG_COOKIES = "/data/instagram.txt";
const ADMIN_TOKEN = "goryto32";

if (!fs.existsSync("/data")) fs.mkdirSync("/data");

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, "/data"),
  filename: (_, __, cb) => cb(null, "instagram.txt")
});
const upload = multer({ storage });

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.post("/admin/upload-ig", auth, upload.single("cookies"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  return res.json({ ok: true });
});

// IG downloader
app.post("/api/ig", (req, res) => {
  const url = req.body.url;
  if (!url) return res.json({ error: "URL required" });

  const args = ["-j", url];
  if (fs.existsSync(IG_COOKIES)) {
    args.push("--cookies", IG_COOKIES);
  }

  execFile("/usr/local/bin/yt-dlp", args, (err, stdout) => {
    if (err) return res.json({ error: err.toString() });

    try {
      const data = JSON.parse(stdout);
      const best = data.formats.find(f => f.ext === "mp4");
      return res.json({ url: best.url });
    } catch (e) {
      return res.json({ error: e.toString() });
    }
  });
});

app.listen(3000, () => console.log("Server running"));
