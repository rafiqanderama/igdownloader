const API = "https://igdownloader.fly.dev";

async function downloadIG() {
    let url = document.getElementById("ig-url").value;
    let out = document.getElementById("ig-result");

    out.innerHTML = "Memproses...";

    let res = await fetch(API + "/api/download", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({url})
    });

    let data = await res.json();
    out.innerHTML = JSON.stringify(data, null, 2);
}

async function downloadTikTok() {
    let url = document.getElementById("tiktok-url").value;
    let out = document.getElementById("tiktok-result");

    out.innerHTML = "Memproses...";

    let res = await fetch(API + "/api/download", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({url})
    });

    let data = await res.json();
    out.innerHTML = JSON.stringify(data, null, 2);
}

async function downloadYTMP4() {
    let url = document.getElementById("yt-mp4-url").value;
    let out = document.getElementById("yt-mp4-result");

    out.innerHTML = "Memproses...";

    let res = await fetch(API + "/api/download", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({url, type: "mp4"})
    });

    let data = await res.json();
    out.innerHTML = JSON.stringify(data, null, 2);
}

async function downloadYTMP3() {
    let url = document.getElementById("yt-mp3-url").value;
    let out = document.getElementById("yt-mp3-result");

    out.innerHTML = "Memproses...";

    let res = await fetch(API + "/api/download", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({url, type: "mp3"})
    });

    let data = await res.json();
    out.innerHTML = JSON.stringify(data, null, 2);
}
