// js/register.js

// ⚠️ PASTIKAN URL INI ADALAH URL DEPLOYMENT BARU DARI E-RAPOR SEKOLAH
const SEKOLAH_WEBAPP_URL = "https://script.google.com/macros/s/AKfycby3WKiWVuKo56fk8FlXmJHMwvCHfcb9ljbfHPYA2an71p2STZwY35XL5WQXWmbZSrf_/exec";

// Utility Toast Anda (tidak perlu diubah)
function showToast(msg, type = "info", timeout = 3000) {
  const wrap = document.querySelector(".toast-wrap") || (() => {
    const w = document.createElement("div");
    w.className = "toast-wrap";
    document.body.appendChild(w);
    return w;
  })();

  const t = document.createElement("div");
  t.className = "toast " + (type === "success" ? "success" : type === "error" ? "error" : "");
  t.innerText = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.opacity = 0;
    setTimeout(() => t.remove(), 400);
  }, timeout);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const submitButton = form.querySelector('button');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Ambil token dari penyimpanan browser
    const token = localStorage.getItem("erapor_token");
    if (!token) {
      showToast("Token sekolah tidak ditemukan. Silakan verifikasi token terlebih dahulu.", "error");
      setTimeout(() => location.href = "index.html", 2000);
      return;
    }

    // 2. Ambil data dari form
    const nama = document.getElementById("nama").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!nama || !username || !password) {
      showToast("Lengkapi semua field wajib.", "error");
      return;
    }

    // 3. Kirim data ke server
    showToast("⏳ Memvalidasi data ke server...", "info");
    submitButton.disabled = true;
    submitButton.textContent = 'Memproses...';

    try {
      const res = await fetch(SEKOLAH_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registerUser",
          token: token, // Kirim token untuk validasi kuota
          nama: nama,
          username: username,
          password: password,
        }),
      });

      const json = await res.json();
      
      // 4. Tangani balasan dari server
      if (json.success) {
        showToast("✅ Registrasi berhasil! Mengarahkan ke halaman login...", "success");
        setTimeout(() => location.href = 'index.html?status=registered', 2000);
      } else {
        // Tampilkan pesan error spesifik dari server
        showToast("❌ Gagal: " + json.message, "error");
      }

    } catch (err) {
      console.error(err);
      showToast("🚫 Tidak dapat terhubung ke server sekolah. Periksa koneksi internet.", "error");
    } finally {
      // Kembalikan tombol ke keadaan semula
      submitButton.disabled = false;
      submitButton.textContent = 'Daftar Sekarang';
    }
  });
});
