// URL DEPLOY AKTIF
const PUSAT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbySsp-hz1mKiGME-1c7eLQiRHKEoK3cf4nmIunJatceBMPWIiis7U-5JEQlkYJTaUZCyQ/exec";
const SEKOLAH_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxZuarfaElKLcJ1Q-9mbV2R2klfRXGdT6A1NO6o6eYEn71OIZ21g8jiI4X8irQlnUQx/exec";

document.addEventListener("DOMContentLoaded", () => {
  const tokenContainer = document.getElementById('tokenFormContainer');
  const loginContainer = document.getElementById('loginFormContainer');
  const tokenForm = document.getElementById('tokenForm');
  const loginForm = document.getElementById('loginForm');

  // Fungsi bantu
  const showTokenForm = () => {
    tokenContainer.style.display = 'block';
    loginContainer.style.display = 'none';
  };

  const showLoginForm = () => {
    tokenContainer.style.display = 'none';
    loginContainer.style.display = 'block';
  };

  // Logika awal halaman
  const savedToken = localStorage.getItem("erapor_token");
  const status = new URLSearchParams(window.location.search).get("status");

  if (!savedToken) {
    // Belum ada token: tampilkan form token
    showTokenForm();
  } else {
    // Sudah ada token, tampilkan login
    showLoginForm();
  }

  // Jika baru daftar, arahkan ke form login
  if (status === "registered") {
    showLoginForm();
  }

  // === Verifikasi Token ===
  tokenForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tokenValue = document.getElementById("token").value.trim();
    const button = tokenForm.querySelector("button");

    if (!tokenValue) return alert("Masukkan token sekolah terlebih dahulu.");

    button.disabled = true;
    button.textContent = "Memverifikasi...";

    try {
      const res = await fetch(`${PUSAT_WEBAPP_URL}?action=checkToken&token=${encodeURIComponent(tokenValue)}`);
      const data = await res.json();

      if (data.success) {
        alert("✅ Token sekolah berhasil diverifikasi!");
        localStorage.setItem("erapor_token", tokenValue);
        showLoginForm();
      } else {
        alert("❌ Token tidak valid atau sekolah belum terdaftar.");
      }
    } catch (err) {
      alert("🚫 Tidak dapat terhubung ke server pusat.");
    } finally {
      button.disabled = false;
      button.textContent = "Verifikasi Token";
    }
  });

  // === Login User ===
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const token = localStorage.getItem("erapor_token");

    if (!token) {
      alert("Token sekolah belum diverifikasi. Silakan masukkan token dulu.");
      showTokenForm();
      return;
    }

    try {
      const res = await fetch(SEKOLAH_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loginUser",
          username,
          password
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Login berhasil! Mengarahkan ke dashboard...");
        localStorage.setItem("user_info", JSON.stringify(data.user));
        window.location.href = "dashboard.html";
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      alert("🚫 Tidak dapat terhubung ke server sekolah.");
    }
  });
});
