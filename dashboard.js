/* === e-Rapor Cerdas - Dashboard Script === */

// PENTING: Salin URL GAS yang SAMA persis dari file script.js Anda
const GAS_URL = "https://script.google.com/macros/s/AKfycbygLQBaA65WkGaDwF5HSN0lVZC43Riw2SQ5OfNjiwao_ijF6xM911wmgO8ovLlLULc/exec"; // <-- GANTI DENGAN URL ANDA

// --- Variabel Global ---
let user = {}; // Untuk menyimpan data user yang login

// --- Elemen Notifikasi ---
const notificationToast = document.getElementById('notification-toast');
const notificationMessage = document.getElementById('notification-toast-message');
const notificationClose = document.getElementById('notification-toast-close');

// --- Elemen Dropdown (Input Nilai) ---
const selectKelas = document.getElementById('pilih-kelas');
const selectSiswa = document.getElementById('pilih-siswa');
const selectMapel = document.getElementById('pilih-mapel');
const selectCP = document.getElementById('pilih-cp');

// --- Elemen Halaman Data Siswa (BARU) ---
const downloadTemplateBtn = document.getElementById('download-template-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const csvFileInput = document.getElementById('csv-file-input');
const siswaTableBody = document.getElementById('siswa-table-body');


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

            // Jika mengklik menu "Data Siswa", panggil fungsi untuk ambil datanya
            if (targetPageId === 'page-data-siswa') {
                loadSiswaList(); // (Fungsi BARU untuk mengisi tabel)
            }
        });
    });

    // --- 4. MEMUAT DATA AWAL SAAT LOGIN ---
    loadInitialData();

    // --- 5. LOGIKA HALAMAN DATA SISWA (BARU) ---
    // Menghubungkan tombol-tombol baru
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', handleDownloadTemplate);
    }
    if (importCsvBtn) {
        importCsvBtn.addEventListener('click', () => {
            // Memicu input file yang tersembunyi
            csvFileInput.click(); 
        });
    }
    if (csvFileInput) {
        // Menjalankan import saat user memilih file
        csvFileInput.addEventListener('change', handleImportCSV);
    }

}); // --- AKHIR FUNGSI DOMContentLoaded ---


/**
 * Fungsi untuk memuat data awal (profil, kelas, mapel)
 */
function loadInitialData() {
    showNotification("Memuat data awal sekolah...", "info");

    const payload = {
        action: "getInitialData", 
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
            
            // 4. (BARU) Muat juga daftar siswa untuk tabel
            loadSiswaList();

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
    if (!selectKelas) return; 
    
    selectKelas.innerHTML = ''; 
    selectKelas.add(new Option("Pilih Kelas...", "")); 

    if (kelasArray && kelasArray.length > 0) {
        kelasArray.forEach(kelas => {
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
    if (!selectMapel) return; 
    
    selectMapel.innerHTML = ''; 
    selectMapel.add(new Option("Pilih Mata Pelajaran...", ""));

    if (mapelArray && mapelArray.length > 0) {
        mapelArray.forEach(mapel => {
            selectMapel.add(new Option(mapel.nama_mapel, mapel.id_mapel));
        });
    } else {
        selectMapel.add(new Option("Belum ada data mapel", ""));
        selectMapel.disabled = true;
    }
}


// --- FUNGSI-FUNGSI BARU UNTUK IMPORT SISWA ---

/**
 * (BARU) Menangani klik tombol "Download Template"
 */
function handleDownloadTemplate() {
    showNotification("Membuat template...", "info");
    
    const payload = {
        action: "handleSiswaActions",
        subAction: "getSiswaTemplate",
        spreadsheetId: user.spreadsheetId // Diperlukan untuk otentikasi
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
            // Trik untuk men-download teks sebagai file .csv
            const blob = new Blob([data.template], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) { 
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "template_siswa.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else {
            showNotification("Gagal membuat template: " + data.message, "error");
        }
    })
    .catch(error => {
        console.error("Error downloading template:", error);
        showNotification("Terjadi kesalahan jaringan.", "error");
    });
}


/**
 * (BARU) Menangani file .csv yang dipilih user
 */
function handleImportCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    showNotification("Membaca file CSV...", "info");
    
    // Gunakan FileReader untuk membaca file di browser
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const data = parseCSV(text); // Panggil fungsi parser kita

        if (data.length === 0) {
            showNotification("File CSV kosong atau formatnya salah.", "error");
            return;
        }

        // Kirim data yang sudah diparsing ke Google Apps Script
        uploadSiswaData(data);
    };
    reader.readAsText(file);
    
    // Reset input file agar bisa upload file yang sama lagi
    event.target.value = null;
}

/**
 * (BARU) Fungsi simpel untuk parsing CSV menjadi array of objects
 */
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== ''); // Pisah per baris, buang baris kosong
    if (lines.length < 2) return []; // Butuh minimal 1 header + 1 data

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '')); // Ambil header
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length === headers.length) {
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index];
            });
            data.push(obj);
        }
    }
    return data;
}


/**
 * (BARU) Mengirim data siswa yang sudah diparsing ke GAS
 */
function uploadSiswaData(siswaDataArray) {
    showNotification(`Mengimpor ${siswaDataArray.length} data siswa...`, "info");
    
    const payload = {
        action: "handleSiswaActions",
        subAction: "importSiswa",
        spreadsheetId: user.spreadsheetId,
        data: siswaDataArray // Kirim array data
    };

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, "success");
            loadSiswaList(); // Muat ulang tabel setelah berhasil impor
        } else {
            showNotification("Gagal mengimpor: " + data.message, "error");
        }
    })
    .catch(error => {
        console.error("Error importing data:", error);
        showNotification("Terjadi kesalahan jaringan saat impor.", "error");
    });
}


/**
 * (BARU) Mengambil daftar siswa dari GAS dan mengisi tabel
 */
function loadSiswaList() {
    if (!siswaTableBody) return; // Jangan jalankan jika tidak di halaman yg benar
    
    siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Memuat data siswa...</td></tr>`;

    const payload = {
        action: "handleSiswaActions",
        subAction: "getSiswaList",
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
            if (data.data.length > 0) {
                siswaTableBody.innerHTML = ''; // Kosongkan tabel
                data.data.forEach(siswa => {
                    const tr = document.createElement('tr');
                    
                    // Format tanggal (jika ada)
                    let tglLahir = 'N/A';
                    if(siswa.tanggal_lahir) {
                         try {
                           tglLahir = new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID');
                         } catch(e) {
                           tglLahir = siswa.tanggal_lahir; // Tampilkan apa adanya jika format salah
                         }
                    }

                    tr.innerHTML = `
                        <td>${siswa.nisn || 'N/A'}</td>
                        <td>${siswa.nama_siswa || 'N/A'}</td>
                        <td>${siswa.kelas || 'N/A'}</td>
                        <td>${tglLahir}</td>
                        <td><a href="#" class="edit-btn">Edit</a></td>
                    `;
                    siswaTableBody.appendChild(tr);
                });
            } else {
                siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data siswa. Silakan import.</td></tr>`;
            }
        } else {
            siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Gagal memuat data: ${data.message}</td></tr>`;
        }
    })
    .catch(error => {
        console.error("Error loading siswa list:", error);
        siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Terjadi kesalahan jaringan.</td></tr>`;
    });
}
