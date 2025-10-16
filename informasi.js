// informasi.js
document.addEventListener("DOMContentLoaded", () => {
  // Pastikan user sudah login
  const user = localStorage.getItem("erapor_user");
  if (!user) {
    alert("Sesi berakhir. Silakan login terlebih dahulu.");
    location.href = "login_guru.html";
    return;
  }

  console.log("Halaman Informasi Pengembang dimuat dengan sukses.");

  // Tampilkan nama sekolah di console (opsional)
  const sekolah = localStorage.getItem("erapor_sekolah") || "Sekolah Anda";
  console.log(`Informasi diakses oleh: ${sekolah}`);
});