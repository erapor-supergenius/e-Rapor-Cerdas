// js/auth.js

// 1. Periksa "tiket masuk" (user_info) di penyimpanan browser
const userInfo = localStorage.getItem('user_info');

if (!userInfo) {
    // 2. JIKA TIDAK ADA TIKET:
    //    Tampilkan pesan dan tendang pengguna kembali ke halaman login.
    alert("Akses ditolak. Silakan login terlebih dahulu.");
    window.location.href = 'index.html';

} else {
    // 3. JIKA ADA TIKET:
    //    Pengguna diizinkan tetap di halaman ini.
    //    Kita akan menambahkan fungsi untuk menampilkan data pengguna dan tombol logout.

    // Kode ini akan berjalan setelah seluruh halaman HTML selesai dimuat
    document.addEventListener('DOMContentLoaded', () => {
        
        // Ambil data pengguna dari tiket
        const currentUser = JSON.parse(userInfo);

        // Cari elemen untuk menampilkan nama dan tampilkan di halaman
        const namaPenggunaElem = document.getElementById('nama-pengguna');
        if (namaPenggunaElem) {
            // "currentUser.nama" berasal dari data yang kita simpan saat login
            namaPenggunaElem.textContent = currentUser.nama || currentUser.username;
        }

        // Cari tombol logout dan tambahkan fungsi saat diklik
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                // Tampilkan konfirmasi sebelum logout
                if (confirm("Apakah Anda yakin ingin logout?")) {
                    // Hapus semua "tiket" dari penyimpanan browser
                    localStorage.removeItem('user_info');
                    localStorage.removeItem('erapor_token');
                    
                    alert("Anda telah berhasil logout.");
                    window.location.href = 'index.html';
                }
            });
        }
    });
}
