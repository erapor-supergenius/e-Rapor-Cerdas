// login.js
const PUSAT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyphk9DRVrG1-t7kXFiUc1xf5hgY98vopB_Agppr112EKMf2d0VYpihujNEJz_u5QHg/exec";

function showMsg(text, type = "info") {
  const msg = document.getElementById("msg");
  msg.textContent = text;
  msg.className = "msg " + (type === "error" ? "error" : type === "success" ? "success" : "");
  msg.style.display = "block";
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = document.getElementById("token").value.trim();

  if (!token) {
    showMsg("Silakan masukkan token sekolah.", "error");
    return;
  }

  showMsg("Memeriksa token sekolah...");

  try {
    const res = await fetch(`${PUSAT_WEBAPP_URL}?action=checkToken&token=${encodeURIComponent(token)}`, {
      method: "GET",
      mode: "cors"
    });

    const json = await res.json();

    if (json.success) {
      showMsg("Token valid! Mengarahkan ke halaman pendaftaran...", "success");

      // Simpan token ke localStorage untuk halaman registrasi
      localStorage.setItem("erapor_token", token);
      localStorage.setItem("erapor_sekolah", json.sekolah || "");

      setTimeout(() => {
        location.href = "register.html";
      }, 1200);
    } else {
      showMsg("Token tidak valid atau belum terdaftar.", "error");
    }
  } catch (err) {
    console.error(err);
    showMsg("⚠️ Gagal menghubungi server pusat. Pastikan Apps Script sudah di-deploy.", "error");
  }
});

