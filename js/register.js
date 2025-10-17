// register.js

// URL API dari SheetDB
const SHEETDB_URL = "https://sheetdb.io/api/v1/o0xdudvldgubu";

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

    const token = localStorage.getItem("erapor_token");
    if (!token) {
      showToast("Token sekolah belum terverifikasi. Silakan login token dulu.", "error");
      setTimeout(() => location.href = "index.html", 2000);
      return;
    }

    const nama = document.getElementById("nama").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!nama || !username || !password) {
      showToast("Lengkapi semua field wajib.", "error");
      return;
    }

    showToast("⏳ Mengirim data pendaftaran...", "info");

    try {
      // 👇 BAGIAN YANG DIPERBAIKI ADA DI SINI 👇
      const payload = {
        data: [{
          // Data ini harus cocok 100% dengan urutan dan nama header di Sheet
          username: username,
          password: password,
          nama_pengguna: nama,
          role: 'guru',
          status: 'aktif',
          id_guru: '', // ✅ DITAMBAHKAN (nilai kosong)
          last_login: '', // ✅ DITAMBAHKAN (nilai kosong)
          akses_terakhir: new Date().toISOString()
        }]
      };
      // -----------------------------------------

      const res = await fetch(SHEETDB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("✅ Registrasi berhasil! Anda akan dialihkan...", "success");
        setTimeout(() => location.href = "index.html", 2000);
      } else {
        const errorData = await res.json();
        console.error("Error dari SheetDB:", errorData);
        showToast("❌ Gagal: Format data salah. Periksa console (F12).", "error");
      }
    } catch (err) {
      console.error("Error koneksi:", err);
      showToast("🚫 Tidak dapat terhubung ke server. Periksa koneksi internet.", "error");
    }
  });
});

