// profil.js
const SCHOOL_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxZuarfaElKLcJ1Q-9mbV2R2klfRXGdT6A1NO6o6eYEn71OIZ21g8jiI4X8irQlnUQx/exec"; // ganti dengan URL WebApp Sekolah

document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("erapor_user");
  if (!user) {
    alert("Sesi Anda berakhir. Silakan login ulang.");
    location.href = "index.html";
    return;
  }

  const token = localStorage.getItem("erapor_token");
  const status = document.getElementById("status");

  // Load profil yang sudah tersimpan
  loadProfil();

  async function loadProfil() {
    try {
      const res = await fetch(`${SCHOOL_WEBAPP_URL}?action=getProfil&token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (json.success && json.data) {
        document.getElementById("nama_sekolah").value = json.data.nama_sekolah || "";
        document.getElementById("alamat").value = json.data.alamat || "";
        document.getElementById("kepala_sekolah").value = json.data.kepala_sekolah || "";
        document.getElementById("email").value = json.data.email || "";
        document.getElementById("telepon").value = json.data.telepon || "";
        document.getElementById("logo_url").value = json.data.logo_url || "";
      }
    } catch (err) {
      console.warn("Gagal memuat profil:", err);
    }
  }

  document.getElementById("saveBtn").addEventListener("click", async () => {
    const data = {
      action: "saveProfil",
      token,
      nama_sekolah: document.getElementById("nama_sekolah").value,
      alamat: document.getElementById("alamat").value,
      kepala_sekolah: document.getElementById("kepala_sekolah").value,
      email: document.getElementById("email").value,
      telepon: document.getElementById("telepon").value,
      logo_url: document.getElementById("logo_url").value
    };

    status.textContent = "⏳ Menyimpan data ke server...";
    try {
      const res = await fetch(SCHOOL_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        status.textContent = "✅ Profil sekolah berhasil disimpan.";
      } else {
        status.textContent = "❌ Gagal menyimpan profil: " + json.message;
      }
    } catch (err) {
      status.textContent = "🚫 Gagal terhubung ke server sekolah.";
      console.error(err);
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    location.href = "index.html";
  });

});






