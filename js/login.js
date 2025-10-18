// ==========================================
// E-RAPOR SEKOLAH - LOGIN SYSTEM (FINAL STABIL)
// ==========================================

// 🔗 URL DEPLOY (sesuaikan jika ada perubahan)
const PUSAT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbySsp-hz1mKiGME-1c7eLQiRHKEoK3cf4nmIunJatceBMPWIiis7U-5JEQlkYJTaUZCyQ/exec";
const SEKOLAH_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxZuarfaElKLcJ1Q-9mbV2R2klfRXGdT6A1NO6o6eYEn71OIZ21g8jiI4X8irQlnUQx/exec";

// 🧩 Fungsi notifikasi sederhana (Toast)
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

// ==========================================
// 🧭 LOGIKA UTAMA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const tokenContainer = document.getElementById("tokenFormContainer");
  const loginContainer = document.getElementById("loginFormContainer");
  const tokenForm = document.getElementById("tokenForm");
  const loginForm = document.getElementById("loginForm");

  // Fungsi bantu tampil form
  const showTokenForm = () => {
    tokenContainer.style.display = "block";
    loginContainer.style.display = "none";
  };
  const showLoginForm = () => {
    tokenContainer.style.display = "none";
    loginContainer.style.display = "block";
  };

  // Cek token & status halaman
  const savedToken = localStorage.getItem("erapor_token");
  const status = new URLSearchParams(window.location.search).get("status");

  if (!savedToken) showTokenForm();
  else showLoginForm();

  if (status === "registered") showLoginForm();

  // ==========================================
  // 🔑 VERIFIKASI TOKEN
  // ==========================================
  tokenForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tokenValue = document.getElementById("token").value.trim();
    const button = tokenForm.querySelector("button");

    if (!tokenValue) {
      showToast("Masukkan token sekolah terlebih dahulu.", "error");
      return;
    }

    button.disabled = true;
    button.textContent = "Memverifikasi...";

    try {
      const res = await fetch(`${PUSAT_WEBAPP_URL}?action=checkToken&token=${encodeURIComponent(tokenValue)}`, {
        method: "GET",
        mode: "cors", // ✅ penting untuk Apps Script
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        showToast("✅ Token sekolah berhasil diverifikasi!", "success");
        localStorage.setItem("erapor_token", tokenValue);
        showLoginForm();
      } else {
        showToast("❌ Token tidak valid atau sekolah belum terdaftar.", "error");
      }
    } catch (err) {
      console.error("Verifikasi token gagal:", err);
      showToast("🚫 Tidak dapat terhubung ke server pusat.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "Verifikasi Token";
    }
  });

  // ==========================================
  // 🔓 LOGIN USER
  // ==========================================
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const token = localStorage.getItem("erapor_token");

    if (!token) {
      showToast("Token sekolah belum diverifikasi. Masukkan token terlebih dahulu.", "error");
      showTokenForm();
      return;
    }

    if (!username || !password) {
      showToast("Masukkan username dan password.", "error");
      return;
    }

    showToast("⏳ Memeriksa kredensial...", "info");

    try {
      const res = await fetch(SEKOLAH_WEBAPP_URL, {
        method: "POST",
        mode: "cors", // ✅ penting untuk koneksi lintas domain
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loginUser",
          username,
          password,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        showToast("✅ Login berhasil! Mengarahkan ke dashboard...", "success");
        localStorage.setItem("user_info", JSON.stringify(data.user));
        setTimeout(() => (window.location.href = "dashboard.html"), 1000);
      } else {
        showToast("❌ " + data.message, "error");
      }
    } catch (err) {
      console.error("Kesalahan saat login:", err);
      showToast("🚫 Tidak dapat terhubung ke server sekolah.", "error");
    }
  });
});
