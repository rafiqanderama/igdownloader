async function api(url, type){
  return await fetch("/api/download", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ url, type })
  }).then(r=>r.json());
}

async function downloadIG(){
  let url = document.getElementById("igUrl").value;
  let out = document.getElementById("igOut");
  out.textContent = "Loading...";
  out.textContent = JSON.stringify(await api(url), null, 2);
}

async function downloadTT(){
  let url = document.getElementById("ttUrl").value;
  let out = document.getElementById("ttOut");
  out.textContent = "Loading...";
  out.textContent = JSON.stringify(await api(url), null, 2);
}

async function downloadYT(type){
  let url = (type === "mp4")
    ? document.getElementById("ytmp4").value
    : document.getElementById("ytmp3").value;

  let out = (type === "mp4")
    ? document.getElementById("mp4Out")
    : document.getElementById("mp3Out");

  out.textContent = "Loading...";
  out.textContent = JSON.stringify(await api(url, type), null, 2);
}
