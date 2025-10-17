// js/register.js

// ⚠️ GANTI DENGAN URL DEPLOY BARU DARI E-RAPOR SEKOLAH ANDA
const SEKOLAH_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbycM4PIbWzmAnr-36Mrp4xukfwJMrNACrrngZn4LPcPMTT6s8OgyF7SHP_xfefVRuwP/exec";

// Utility Toast Anda
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
    const tokenInput = document.getElementById("token");

    // Ambil token dari penyimpanan dan masukkan ke form tersembunyi
    const savedToken = localStorage.getItem("erapor_token");
    if (!savedToken) {
        showToast("Token sekolah tidak ditemukan!", "error");
        setTimeout(() => location.href = "index.html", 2000);
        return;
    }
    tokenInput.value = savedToken;

    // Atur URL tujuan form
    form.action = SEKOLAH_WEBAPP_URL;

    form.addEventListener("submit", () => {
        // Dengan metode ini, kita tidak bisa tahu pasti apakah registrasi berhasil
        // atau ditolak karena kuota penuh. Kita hanya bisa asumsikan berhasil.
        showToast("⏳ Mengirim data pendaftaran...", "info");

        setTimeout(() => {
            showToast("✅ Pendaftaran terkirim! Mengarahkan ke halaman login...", "success");
            setTimeout(() => {
                location.href = 'index.html?status=registered'; 
            }, 2000);
        }, 1500);
    });
});
