// register.js
const SCHOOL_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyzlzth7xNg70L6H8Y8DBdl8rd_XCxWF4gB03V4hiowvShiPK6msSTyGkjyijpD7RU/exec"; // Ganti dengan URL Apps Script sekolah

// 🔔 Utility Toast
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("erapor_token");
    if (!token) {
      showToast("Token sekolah belum terverifikasi. Silakan login token dulu.", "error");
      setTimeout(() => location.href = "login.html", 2000);
      return;
    }

    const nama = document.getElementById("nama").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const email = document.getElementById("email").value.trim();

    if (!nama || !username || !password) {
      showToast("Lengkapi semua field wajib.", "error");
      return;
    }

    showToast("⏳ Mengirim data ke server...", "info");

    try {
      const res = await fetch(SCHOOL_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registerUser",
          token,
          nama,
          username,
          password,
          email
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✅ Registrasi berhasil. Silakan login.", "success");
        setTimeout(() => location.href = "index.html", 1500);
      } else {
        showToast("❌ Gagal: " + json.message, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("🚫 Tidak dapat terhubung ke server sekolah.", "error");
    }
  });

});






