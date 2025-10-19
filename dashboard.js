/* === e-Rapor Cerdas - Dashboard Script === */

// PENTING: Salin URL GAS yang SAMA persis dari file script.js Anda
const GAS_URL = "https://script.google.com/macros/s/AKfycbygLQBaA65WkGaDwF5HSN0lVZC43Riw2SQ5OfNjiwao_ijF6xM911wmgO8ovLlLULc/exec"; // <-- GANTI DENGAN URL ANDA

// --- Variabel Global ---
let user = {}; // Untuk menyimpan data user yang login

// --- Elemen Notifikasi ---
const notificationToast = document.getElementById('notification-toast');
const notificationMessage = document.getElementById('notification-toast-message');
const notificationClose = document.getElementById('notification-toast-close');

// --- Elemen Dropdown ---
const selectKelas = document.getElementById('pilih-kelas');
const selectSiswa = document.getElementById('pilih-siswa');
const selectMapel = document.getElementById('pilih-mapel');
const selectCP = document.getElementById('pilih-cp');


// --- Fungsi Notifikasi Elegan ---
function showNotification(message, type = 'info') {
    notificationMessage.innerText = message;
    notificationToast.className = ''; 
    notificationToast.classList.add(type); 
    notificationToast.style.display = 'flex';

    setTimeout(() => { hideNotification(); }, 5000);
}
function hideNotification() {
    notificationToast.style.display = 'none';
}
if (notificationClose) {
    notificationClose.addEventListener('click', hideNotification);
}


// --- Fungsi Utama: Dijalankan saat Halaman Selesai Dimuat ---
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. OTENTIKASI & PENGECEKAN SESI ---
    user.name = localStorage.getItem('userName');
    user.spreadsheetId = localStorage.getItem('spreadsheetId'); 
    user.username = localStorage.getItem('userUsername'); 

    if (!user.name || !user.spreadsheetId || !user.username) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        window.location.href = 'index.html';
        return; 
    }
    
    document.getElementById('welcome-message').innerText = `Selamat Datang, ${user.name}!`;

    
    // --- 2. LOGIKA TOMBOL LOGOUT ---
    document.getElementById('logout-button').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin logout?")) {
            localStorage.clear(); 
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
    loadInitialData();
});


/**
 * Fungsi untuk memuat data awal (profil, kelas, mapel)
 */
function loadInitialData() {
    showNotification("Memuat data awal sekolah...", "info");

    const payload = {
        action: "getInitialData", // Diubah dari getProfilSekolah
        spreadsheetId: user.spreadsheetId 
    };

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideNotification(); 
            
            // 1. Isi Nama Sekolah di Sidebar
            const namaSekolah = data.profil.nama_sekolah || "[Nama Sekolah Belum Diisi]";
            document.getElementById('sidebar-school-name').innerText = namaSekolah;
            
            // 2. Isi Dropdown Kelas
            loadKelasDropdown(data.kelas);
            
            // 3. Isi Dropdown Mapel
            loadMapelDropdown(data.mapel);
            
            // (Kita akan buat fungsi untuk mengisi dashboard home nanti)
            // loadHomeDashboard(data); 

        } else {
            showNotification("Gagal memuat data awal: " + data.message, "error");
        }
    })
    .catch(error => {
        console.error("Error fetching initial data:", error);
        showNotification("Terjadi kesalahan jaringan saat memuat data.", "error");
    });
}

/**
 * Fungsi untuk mengisi dropdown 'Pilih Kelas'
 */
function loadKelasDropdown(kelasArray) {
    if (!selectKelas) return; // Cek jika elemen ada
    
    selectKelas.innerHTML = ''; // Kosongkan opsi "Memuat..."
    selectKelas.add(new Option("Pilih Kelas...", "")); // Tambah opsi default

    if (kelasArray && kelasArray.length > 0) {
        kelasArray.forEach(kelas => {
            // value = id_kelas, text = nama_kelas
            selectKelas.add(new Option(kelas.nama_kelas, kelas.id_kelas));
        });
    } else {
        selectKelas.add(new Option("Belum ada data kelas", ""));
        selectKelas.disabled = true;
    }
}

/**
 * Fungsi untuk mengisi dropdown 'Pilih Mapel'
 */
function loadMapelDropdown(mapelArray) {
    if (!selectMapel) return; // Cek jika elemen ada
    
    selectMapel.innerHTML = ''; // Kosongkan opsi "Memuat..."
    selectMapel.add(new Option("Pilih Mata Pelajaran...", ""));

    if (mapelArray && mapelArray.length > 0) {
        mapelArray.forEach(mapel => {
            // value = id_mapel, text = nama_mapel
            selectMapel.add(new Option(mapel.nama_mapel, mapel.id_mapel));
        });
    } else {
        selectMapel.add(new Option("Belum ada data mapel", ""));
        selectMapel.disabled = true;
    }
}
