const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));  // <-- penting: serve index.html

const YTDLP = "/usr/local/bin/yt-dlp";

// jalankan yt-dlp (JSON)
function getIG(url) {
  return new Promise((resolve, reject) => {
    execFile(
      YTDLP,
      ["-j", url],
      { maxBuffer: 1024 * 1024 * 20 },
      (err, stdout, stderr) => {
        if (err) return reject(stderr || err.toString());
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject("Instagram berubah atau URL salah.");
        }
      }
    );
  });
}

app.post("/api/ig", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.json({ error: "URL kosong" });

  try {
    const data = await getIG(url);

    const result = {
      title: data.title || "Instagram Content",
      thumbnail: data.thumbnail || "",
      items: []
    };

    if (data.entries) {
      data.entries.forEach(e => {
        const f = e.formats?.find(v => v.url);
        result.items.push({
          type: e.ext === "mp4" ? "video" : "photo",
          url: f.url
        });
      });
    } else {
      const f = data.formats?.find(v => v.url);
      result.items.push({
        type: data.ext === "mp4" ? "video" : "photo",
        url: f.url
      });
    }

    res.json(result);

  } catch (err) {
    res.json({ error: err.toString() });
  }
});

// serve halaman utama
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(3000, () => console.log("Server running on port 3000"));
