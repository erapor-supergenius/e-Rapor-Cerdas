// ✅ URL WEB APP SEKOLAH (HASIL DEPLOY)
const SEKOLAH_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxZuarfaElKLcJ1Q-9mbV2R2klfRXGdT6A1NO6o6eYEn71OIZ21g8jiI4X8irQlnUQx/exec";

// ✅ Fungsi Toast untuk notifikasi
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
  setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, timeout);
}

// ✅ Fungsi ambil token otomatis dari server pusat
async function ambilTokenSekolah() {
  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbzrPTSjYFoADLSjqWUnv2N.../exec?action=getToken"); 
    // ↑ Ganti dengan URL pusat kamu jika berbeda
    const data = await response.json();
    if (data.success && data.token) {
      localStorage.setItem("erapor_token", data.token);
      return data.token;
    }
  } catch (err) {
    console.warn("Tidak bisa ambil token otomatis:", err);
  }
  return null;
}

// ✅ Handler saat halaman dimuat
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("registerForm");
  const submitButton = form.querySelector("button");

  // Otomatis ambil token kalau belum ada
  let token = localStorage.getItem("erapor_token");
  if (!token) token = await ambilTokenSekolah();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nama = document.getElementById("nama").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!nama || !username || !password) {
      showToast("Lengkapi semua data terlebih dahulu.", "error");
      return;
    }

    if (!token) {
      showToast("Token sekolah tidak ditemukan. Silakan verifikasi ulang.", "error");
      return;
    }

    showToast("⏳ Mengirim data pendaftaran...", "info");
    submitButton.disabled = true;

    try {
      const res = await fetch(SEKOLAH_WEBAPP_URL, {
        method: "POST",
        mode: "cors", // ✅ PENTING agar Apps Script izinkan dari domain luar
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registerUser",
          token,
          nama,
          username,
          password,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.success) {
        showToast("✅ Registrasi berhasil! Mengarahkan ke halaman login...", "success");
        setTimeout(() => location.href = "index.html?status=registered", 2000);
      } else {
        showToast("❌ Gagal: " + json.message, "error");
      }
    } catch (err) {
      console.error("Kesalahan fetch:", err);
      showToast("🚫 Tidak dapat terhubung ke server sekolah. Periksa koneksi atau izin deploy.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
