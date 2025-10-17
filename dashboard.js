// dashboard.js

const SCHOOL_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxf0mhlmgh-6rTr_iHugLpRjt_6dxJ0eiEHVV0AZOLVmmr-H7w7AWCQJSnumQM-lbP1/exec"; // URL backend sekolah

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("erapor_user") || "null");
  if (!user) {
    alert("Sesi berakhir. Silakan login kembali.");
    location.href = "login_guru.html";
    return;
  }

  const token = localStorage.getItem("erapor_token");
  const generateBtn = document.getElementById("generateBtn");
  const output = document.getElementById("output");

  generateBtn.addEventListener("click", async () => {
    const mapel = document.getElementById("mapel").value.trim();
    const fase = document.getElementById("fase").value;
    const elemen = document.getElementById("elemen").value.trim();
    const kataKunci = document.getElementById("kataKunci").value.trim();
    const gayaBahasa = document.getElementById("gayaBahasa").value;

    if (!mapel || !elemen || !kataKunci) {
      output.textContent = "⚠️ Lengkapi semua kolom terlebih dahulu.";
      return;
    }

    output.textContent = "⏳ Sedang memproses deskripsi AI...";

    try {
      const res = await fetch(SCHOOL_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateDeskripsiAI",
          token,
          mapel,
          fase,
          elemen,
          kataKunci,
          tingkatDetail: "tinggi",
          gayaBahasa,
          konteksSekolah: localStorage.getItem("erapor_sekolah") || "",
        }),
      });

      const json = await res.json();
      if (json.success) {
        output.textContent = json.deskripsi || "(Tidak ada hasil AI)";
      } else {
        output.textContent = `❌ Gagal: ${json.message}`;
      }
    } catch (err) {
      console.error(err);
      output.textContent = "🚫 Gagal terhubung ke server sekolah.";
    }
  });

  // tombol logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    location.href = "index.html";
  });

});

