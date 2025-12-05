async function apiPost(body) {
  try {
    const res = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

// helper for rendering
function showResult(el, contentHtml) {
  el.innerHTML = contentHtml;
}

// Instagram
document.getElementById("ig-btn").addEventListener("click", async () => {
  const url = document.getElementById("ig-url").value.trim();
  const out = document.getElementById("ig-result");
  showResult(out, "Memproses...");
  const data = await apiPost({ url });
  if (data && data.results && data.results.length) {
    // if multiple items show them
    const html = data.results.map((it, i) => {
      if (it.type === "video") return `<div>Video ${i+1}: <a href="${it.url}" target="_blank" rel="noreferrer">Download</a></div>`;
      if (it.type === "image") return `<div>Image ${i+1}: <a href="${it.url}" target="_blank" rel="noreferrer">Download</a></div>`;
      return `<div>Item ${i+1}: <a href="${it.url}" target="_blank">Download</a></div>`;
    }).join("");
    showResult(out, html);
  } else if (data.error) {
    showResult(out, `<div style="color:#ffc6c6">Error: ${data.error}</div>`);
  } else {
    showResult(out, "Tidak ada hasil.");
  }
});

// Tiktok
document.getElementById("tt-btn").addEventListener("click", async () => {
  const url = document.getElementById("tt-url").value.trim();
  const out = document.getElementById("tt-result");
  showResult(out, "Memproses...");
  const data = await apiPost({ url });
  if (data && data.results && data.results.length) {
    showResult(out, `<a href="${data.results[0].url}" target="_blank">Download TikTok</a>`);
  } else {
    showResult(out, `<div style="color:#ffc6c6">Error: ${(data && data.error) || "Tidak ada hasil"}</div>`);
  }
});

// YouTube MP4
document.getElementById("yt-mp4-btn").addEventListener("click", async () => {
  const url = document.getElementById("yt-mp4-url").value.trim();
  const out = document.getElementById("yt-mp4-result");
  showResult(out, "Memproses...");
  const data = await apiPost({ url, type: "mp4" });
  if (data && data.url) {
    showResult(out, `<a href="${data.url}" target="_blank">Download MP4 (${data.height || ""})</a>`);
  } else {
    showResult(out, `<div style="color:#ffc6c6">Error: ${(data && data.error) || "Tidak ada hasil"}</div>`);
  }
});

// YouTube MP3
document.getElementById("yt-mp3-btn").addEventListener("click", async () => {
  const url = document.getElementById("yt-mp3-url").value.trim();
  const out = document.getElementById("yt-mp3-result");
  showResult(out, "Memproses...");
  const data = await apiPost({ url, type: "mp3" });
  if (data && data.url) {
    showResult(out, `<a href="${data.url}" target="_blank">Download MP3</a>`);
  } else {
    showResult(out, `<div style="color:#ffc6c6">Error: ${(data && data.error) || "Tidak ada hasil"}</div>`);
  }
});
