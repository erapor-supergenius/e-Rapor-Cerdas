/* === e-Rapor Cerdas - Dashboard Script === */

const GAS_URL = "https://script.google.com/macros/s/AKfycbygLQBaA65WkGaDwF5HSN0lVZC43Riw2SQ5OfNjiwao_ijF6xM911wmgO8ovLlLULc/exec"; // <-- GANTI DENGAN URL ANDA

// --- Variabel Global ---
let user = {}; 
let allSiswaData = []; // <-- (BARU) Variabel untuk menyimpan semua data siswa

// --- Elemen Notifikasi ---
const notificationToast = document.getElementById('notification-toast');
const notificationMessage = document.getElementById('notification-toast-message');
const notificationClose = document.getElementById('notification-toast-close');

// --- Elemen Dropdown (Input Nilai) ---
const selectKelas = document.getElementById('pilih-kelas');
const selectSiswa = document.getElementById('pilih-siswa');
const selectMapel = document.getElementById('pilih-mapel');
const selectCP = document.getElementById('pilih-cp');

// --- Elemen Halaman Data Siswa ---
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
    
    // 1. OTENTIKASI
    user.name = localStorage.getItem('userName');
    user.spreadsheetId = localStorage.getItem('spreadsheetId'); 
    user.username = localStorage.getItem('userUsername'); 
    if (!user.name || !user.spreadsheetId || !user.username) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        window.location.href = 'index.html';
        return; 
    }
    document.getElementById('welcome-message').innerText = `Selamat Datang, ${user.name}!`;

    
    // 2. LOGIKA LOGOUT
    document.getElementById('logout-button').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin logout?")) {
            localStorage.clear(); 
            window.location.href = 'index.html';
        }
    });


    // 3. LOGIKA NAVIGASI SIDEBAR
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

            if (targetPageId === 'page-data-siswa') {
                loadSiswaList(); // Muat tabel siswa saat pindah ke halaman siswa
            }
        });
    });

    // 4. MEMUAT DATA AWAL SAAT LOGIN
    loadInitialData();

    // 5. LOGIKA HALAMAN DATA SISWA (Import/Download)
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', handleDownloadTemplate);
    }
    if (importCsvBtn) {
        importCsvBtn.addEventListener('click', () => { csvFileInput.click(); });
    }
    if (csvFileInput) {
        csvFileInput.addEventListener('change', handleImportCSV);
    }

    // --- (BARU) LOGIKA DROPDOWN BERTINGKAT ---
    if (selectKelas) {
        // Tambahkan event listener ke dropdown 'Pilih Kelas'
        selectKelas.addEventListener('change', (e) => {
            const selectedKelasId = e.target.value;
            // Panggil fungsi untuk memfilter dan mengisi dropdown siswa
            loadSiswaDropdown(selectedKelasId);
        });
    }
    // (Kita akan tambahkan event listener untuk 'selectMapel' nanti)
    // --- AKHIR LOGIKA BARU ---

}); // --- AKHIR FUNGSI DOMContentLoaded ---


/**
 * Fungsi untuk memuat data awal (profil, kelas, mapel, DAN siswa)
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
        headers: { "Content-Type": "text-plain;charset=utf-8" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideNotification(); 
            
            // 1. Isi Nama Sekolah
            const namaSekolah = data.profil.nama_sekolah || "[Nama Sekolah Belum Diisi]";
            document.getElementById('sidebar-school-name').innerText = namaSekolah;
            
            // 2. Isi Dropdown Kelas
            loadKelasDropdown(data.kelas);
            
            // 3. Isi Dropdown Mapel
            loadMapelDropdown(data.mapel);
            
            // 4. (BARU) Simpan data siswa di variabel global
            allSiswaData = data.siswa || []; 
            
            // 5. Muat tabel di halaman Data Siswa (jika kita di sana)
            loadSiswaList(); // Panggil ini agar tabel terisi saat login

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
 * (BARU) Fungsi untuk mengisi dropdown 'Pilih Siswa' berdasarkan kelas
 */
function loadSiswaDropdown(selectedKelasId) {
    if (!selectSiswa) return;
    
    selectSiswa.innerHTML = ''; // Kosongkan dulu
    selectSiswa.disabled = true;

    if (!selectedKelasId) {
        selectSiswa.add(new Option("Pilih kelas dahulu...", ""));
        return;
    }
    
    // Filter data siswa global berdasarkan id_kelas yang dipilih
    const siswaDiKelas = allSiswaData.filter(siswa => siswa.id_kelas === selectedKelasId);

    if (siswaDiKelas.length > 0) {
        selectSiswa.add(new Option(`Pilih Siswa (${siswaDiKelas.length} siswa)...`, ""));
        siswaDiKelas.forEach(siswa => {
            // value = id_siswa, text = nama_siswa
            selectSiswa.add(new Option(siswa.nama_siswa, siswa.id_siswa));
        });
        selectSiswa.disabled = false; // Aktifkan dropdown
    } else {
        selectSiswa.add(new Option("Tidak ada siswa di kelas ini", ""));
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


// --- FUNGSI-FUNGSI IMPORT SISWA (TETAP SAMA) ---

function handleDownloadTemplate() {
    showNotification("Membuat template...", "info");
    const payload = {
        action: "handleSiswaActions",
        subAction: "getSiswaTemplate",
        spreadsheetId: user.spreadsheetId 
    };

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text-plain;charset=utf-8" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideNotification();
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

function handleImportCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    showNotification("Membaca file CSV...", "info");
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const data = parseCSV(text); 
        if (data.length === 0) {
            showNotification("File CSV kosong atau formatnya salah.", "error");
            return;
        }
        uploadSiswaData(data);
    };
    reader.readAsText(file);
    event.target.value = null;
}

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== ''); 
    if (lines.length < 2) return []; 
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '')); 
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

function uploadSiswaData(siswaDataArray) {
    showNotification(`Mengimpor ${siswaDataArray.length} data siswa...`, "info");
    const payload = {
        action: "handleSiswaActions",
        subAction: "importSiswa",
        spreadsheetId: user.spreadsheetId,
        data: siswaDataArray 
    };

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text-plain;charset=utf-8" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, "success");
            loadInitialData(); // (PENTING) Muat ulang semua data setelah impor sukses
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
 * (DIPERBARUI) Mengisi tabel siswa dari data variabel global
 */
function loadSiswaList() {
    if (!siswaTableBody) return; 
    
    if (allSiswaData.length > 0) {
        // Data sudah ada, kita hanya perlu memanggil data dari sheet 'siswa'
        // untuk data yang lebih lengkap (nisn, tgl lahir, dll)
        // Kita panggil fungsi fetch yang lama
        
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
            if (data.success && data.data.length > 0) {
                siswaTableBody.innerHTML = ''; // Kosongkan tabel
                data.data.forEach(siswa => {
                    const tr = document.createElement('tr');
                    let tglLahir = 'N/A';
                    if(siswa.tanggal_lahir) {
                         try {
                           tglLahir = new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID');
                         } catch(e) { tglLahir = siswa.tanggal_lahir; }
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
            } else if (data.success && data.data.length === 0) {
                siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data siswa. Silakan import.</td></tr>`;
            } else {
                 siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Gagal memuat data: ${data.message}</td></tr>`;
            }
        })
        .catch(error => {
             console.error("Error loading siswa list:", error);
             siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Terjadi kesalahan jaringan.</td></tr>`;
        });

    } else {
        // Jika allSiswaData masih kosong (sedang load awal)
        siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data siswa. Silakan import.</td></tr>`;
    }
}
