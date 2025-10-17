// register.js

// 🚀 Ganti URL Apps Script lama dengan URL API dari SheetDB
const SHEETDB_URL = "https://sheetdb.io/api/v1/ux7q4uxw2m2qr";

// 🔔 Utility Toast (Fungsi ini tidak perlu diubah)
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

    // Bagian ini tetap sama, untuk memastikan token sekolah ada
    const token = localStorage.getItem("erapor_token");
    if (!token) {
      showToast("Token sekolah belum terverifikasi. Silakan login token dulu.", "error");
      setTimeout(() => location.href = "index.html", 2000);
      return;
    }

    // Ambil data dari form
    const nama = document.getElementById("nama").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    // const email = document.getElementById("email").value.trim(); // Email tidak digunakan karena tidak ada di header sheet

    if (!nama || !username || !password) {
      showToast("Lengkapi semua field wajib.", "error");
      return;
    }

    showToast("⏳ Mengirim data pendaftaran...", "info");

    // 👇 BAGIAN UTAMA YANG DIUBAH 👇
    try {
      // 1. Siapkan data sesuai format SheetDB dan header Google Sheet Anda
      const payload = {
        data: [{
          // Kunci di sini HARUS SAMA PERSIS dengan header di Google Sheet
          username: username,
          password: password,
          nama_pengguna: nama, // 'nama' dari form diubah menjadi 'nama_pengguna'
          role: 'guru',      // Nilai default
          status: 'aktif',     // Nilai default
          akses_terakhir: new Date().toISOString() // Catat waktu pendaftaran
        }]
      };

      // 2. Kirim data menggunakan fetch ke URL SheetDB
      const res = await fetch(SHEETDB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 3. Cek apakah respons dari server berhasil (kode 2xx)
      if (res.ok) {
        showToast("✅ Registrasi berhasil. Anda akan dialihkan ke halaman login.", "success");
        setTimeout(() => location.href = "index.html", 2000); // Ganti ke login.html jika perlu
      } else {
        // Jika server memberikan respons error (misal: kolom tidak cocok)
        const errorData = await res.json();
        console.error("Error dari SheetDB:", errorData);
        showToast("❌ Gagal: Terjadi kesalahan di server. Cek console untuk detail.", "error");
      }
    } catch (err) {
      console.error("Error koneksi:", err);
      showToast("🚫 Tidak dapat terhubung ke server. Periksa koneksi internet Anda.", "error");
    }
  });
});
