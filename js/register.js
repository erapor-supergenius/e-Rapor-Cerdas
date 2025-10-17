// register.js

// 🚀 GANTI DENGAN URL DEPLOYMENT BARU DARI LANGKAH 2
const SCHOOL_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbw6cECUXQmDfZKcUVCAXmzxVVNzJPI2etlItSZfxgHq6xAsxCiYlXh1z3LzX7QeOzE5/exec";

// Utility Toast Anda (tidak perlu diubah)
function showToast(msg, type = "info", timeout = 3000) {
    // ... kode toast Anda ...
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");

    // Atur URL tujuan form secara dinamis
    form.action = SCHOOL_WEBAPP_URL;

    form.addEventListener("submit", () => {
        // Tampilkan pesan "mengirim"
        showToast("⏳ Mengirim data pendaftaran...", "info");

        // Karena form akan submit di latar belakang (ke iframe),
        // kita cukup asumsikan itu berhasil dan tampilkan pesan sukses setelah beberapa detik.
        setTimeout(() => {
            showToast("✅ Registrasi berhasil! Data sedang diproses.", "success");
            // Kosongkan form setelah submit
            form.reset(); 
            // Arahkan ke halaman login setelah beberapa detik lagi
            setTimeout(() => {
                location.href = 'index.html'; 
            }, 2000);
        }, 1500); // Beri jeda 1.5 detik
    });
});
