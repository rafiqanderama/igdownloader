:root{--bg:#0e0f12;--card:#171820;--accent:#4cafef;--muted:#9aa0a6;color:#e6eef6}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial}
.wrap{max-width:860px;margin:28px auto;padding:20px}
header{text-align:center;color:var(--accent)}
h1{margin:6px 0;font-size:28px}
.tag{color:var(--muted);margin-top:0}
main{display:grid;grid-template-columns:1fr;gap:18px;margin-top:18px}
.card{background:var(--card);padding:18px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,0.4)}
.card small{color:var(--muted)}
input{width:100%;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);margin:8px 0;background:transparent;color:inherit;font-size:14px}
button{width:100%;background:var(--accent);color:#042034;padding:12px;border-radius:8px;border:none;font-weight:700;cursor:pointer}
.result{margin-top:10px;color:var(--muted);font-size:14px;word-break:break-word}
.result a{display:inline-block;padding:8px 12px;background:#0b8be3;color:white;border-radius:6px;text-decoration:none;margin-top:6px}
.small{font-size:14px}
.note{color:#c9d1d9;font-size:13px}
footer{text-align:center;color:var(--muted);margin-top:18px}
