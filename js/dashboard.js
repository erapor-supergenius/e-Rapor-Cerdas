/* === e-Rapor Cerdas - Dashboard Script === */

// PENTING: Salin URL GAS yang SAMA persis dari file script.js Anda
// Kita akan membutuhkannya untuk mengambil data nanti.
const GAS_URL = "https://script.google.com/macros/s/AKfycbygLQBaA65WkGaDwF5HSN0lVZC43Riw2SQ5OfNjiwao_ijF6xM911wmgO8ovLlLULc/exec"; // <-- GANTI DENGAN URL ANDA

// --- Variabel Global ---
let user = {}; // Untuk menyimpan data user yang login

// --- Fungsi Notifikasi Elegan ---
const notificationToast = document.getElementById('notification-toast');
const notificationMessage = document.getElementById('notification-toast-message');
const notificationClose = document.getElementById('notification-toast-close');

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
    notificationMessage.innerText = message;
    notificationToast.className = ''; // Reset kelas
    notificationToast.classList.add(type); // 'success', 'error', atau 'info'
    notificationToast.style.display = 'flex';

    // Sembunyikan otomatis setelah 5 detik
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Fungsi untuk menyembunyikan notifikasi
function hideNotification() {
    notificationToast.style.display = 'none';
}
// Event listener untuk tombol close notifikasi
if (notificationClose) {
    notificationClose.addEventListener('click', hideNotification);
}


// --- Fungsi Utama: Dijalankan saat Halaman Selesai Dimuat ---
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. OTENTIKASI & PENGECEKAN SESI ---
    user.name = localStorage.getItem('userName');
    user.spreadsheetId = localStorage.getItem('spreadsheetId'); // Kunci database sekolah
    user.username = localStorage.getItem('userUsername'); // id_guru

    if (!user.name || !user.spreadsheetId || !user.username) {
        alert("Sesi Anda telah berakhir atau Anda belum login. Silakan login kembali.");
        window.location.href = 'index.html';
        return; // Hentikan eksekusi script
    }
    
    // Sapa pengguna di header
    document.getElementById('welcome-message').innerText = `Selamat Datang, ${user.name}!`;

    
    // --- 2. LOGIKA TOMBOL LOGOUT ---
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (confirm("Apakah Anda yakin ingin logout?")) {
            localStorage.clear(); // Hapus semua data sesi
            window.location.href = 'index.html';
        }
    });


    // --- 3. LOGIKA NAVIGASI SIDEBAR (SPA) ---
    const navLinks = document.querySelectorAll('.nav-link');
    const contentPages = document.querySelectorAll('.content-page');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPageId = link.getAttribute('data-page');
            
            navLinks.forEach(nav => nav.classList.remove('active'));
            contentPages.forEach(page => page.classList.remove('active'));
            
            link.classList.add('active');
            document.getElementById(targetPageId).classList.add('active');

            // Jika mengklik menu "Profil Sekolah", panggil fungsi untuk ambil datanya
            if (targetPageId === 'page-profil-sekolah') {
                // loadProfilSekolah(); // (Fungsi ini akan kita buat nanti)
            }
        });
    });

    // --- 4. MEMUAT DATA AWAL SAAT LOGIN ---
    // Panggil fungsi untuk memuat data awal (misal: nama sekolah)
    loadInitialData();

});


/**
 * Fungsi untuk memuat data awal yang dibutuhkan dashboard
 * seperti nama sekolah, daftar kelas, daftar mapel, dll.
 */
function loadInitialData() {
    // Tampilkan notifikasi "Memuat data..."
    showNotification("Memuat data awal sekolah...", "info");

    // Kita akan buat fungsi 'serverGetProfilSekolah' di Code.gs nanti
    const payload = {
        action: "getProfilSekolah",
        spreadsheetId: user.spreadsheetId // Kirim ID database sekolah kita
    };

    // Panggil Google Apps Script
    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Jika berhasil, isi nama sekolah di sidebar
            const namaSekolah = data.profil.nama_sekolah || "[Nama Sekolah Belum Diisi]";
            document.getElementById('sidebar-school-name').innerText = namaSekolah;
            hideNotification(); // Sembunyikan notifikasi "memuat"
            
            // (Nanti kita juga akan mengisi dropdown kelas & mapel di sini)
            // loadKelas(data.kelas);
            // loadMapel(data.mapel);

        } else {
            // Jika gagal, tampilkan error
            showNotification("Gagal memuat profil sekolah: " + data.message, "error");
        }
    })
    .catch(error => {
        console.error("Error fetching initial data:", error);
        showNotification("Terjadi kesalahan jaringan saat memuat data.", "error");
    });
}
