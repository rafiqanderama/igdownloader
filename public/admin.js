async function uploadIG() {
    const token = document.getElementById("token").value.trim();
    const file = document.getElementById("file").files[0];

    if (!token || !file) {
        return showError("Token dan file harus diisi!");
    }

    const form = new FormData();
    form.append("cookies", file);

    try {
        const res = await fetch("/admin/upload-ig", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: form
        });

        let data;
        try {
            data = await res.json();
        } catch (e) {
            // Jika bukan JSON → tampilkan respon asli
            const text = await res.text();
            return showError("Server mengembalikan respon tidak valid: " + text);
        }

        if (!res.ok) {
            return showError(data.error || "Upload gagal");
        }

        showSuccess("Upload sukses!");

    } catch (err) {
        showError(err.toString());
    }
}

function showError(msg) {
    document.getElementById("status").innerHTML =
        `<span style="color:red">${msg}</span>`;
}

function showSuccess(msg) {
    document.getElementById("status").innerHTML =
        `<span style="color:lightgreen">${msg}</span>`;
}
