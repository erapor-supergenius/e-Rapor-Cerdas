// js/register.js

// ⚠️ GANTI DENGAN URL BARU DARI LANGKAH 1 DI ATAS
const SEKOLAH_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxZuarfaElKLcJ1Q-9mbV2R2klfRXGdT6A1NO6o6eYEn71OIZ21g8jiI4X8irQlnUQx/exec";

// Utility Toast Anda (tidak perlu diubah)
function showToast(msg, type = "info", timeout = 3000) {
    const wrap = document.querySelector(".toast-wrap") || (() => {
        const w = document.createElement("div"); w.className = "toast-wrap"; document.body.appendChild(w); return w;
    })();
    const t = document.createElement("div");
    t.className = "toast " + (type === "success" ? "success" : type === "error" ? "error" : "");
    t.innerText = msg; wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, timeout);
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const submitButton = form.querySelector('button');

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // Mencegah form refresh, karena kita pakai fetch

        const token = localStorage.getItem("erapor_token");
        if (!token) {
            showToast("Token sekolah tidak ditemukan. Silakan verifikasi dulu.", "error");
            return;
        }

        const nama = document.getElementById("nama").value.trim();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (!nama || !username || !password) {
            showToast("Lengkapi semua field wajib.", "error");
            return;
        }

        showToast("⏳ Mengirim data pendaftaran...", "info");
        submitButton.disabled = true;

        try {
            // Mengirim data dalam format JSON menggunakan fetch
            const res = await fetch(SEKOLAH_WEBAPP_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "registerUser",
                    token: token,
                    nama: nama,
                    username: username,
                    password: password,
                }),
            });

            const json = await res.json();
            
            if (json.success) {
                showToast("✅ Registrasi berhasil! Mengarahkan ke halaman login...", "success");
                setTimeout(() => location.href = 'index.html?status=registered', 2000);
            } else {
                // Tampilkan pesan error spesifik dari server (misal: kuota penuh)
                showToast("❌ Gagal: " + json.message, "error");
            }

        } catch (err) {
            console.error(err);
            showToast("🚫 Tidak dapat terhubung ke server sekolah. Periksa koneksi.", "error");
        } finally {
            submitButton.disabled = false;
        }
    });
});

