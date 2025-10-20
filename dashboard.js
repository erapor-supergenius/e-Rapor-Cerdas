/* === e-Rapor Cerdas - Dashboard Script === */

const GAS_URL = "https://script.google.com/macros/s/AKfycby-empDcPt5BndGZnjLNyTKt9wbMIP3iRtvoQELdWWoOvZnu2om_Uoh9Zsj5I0Wdq7ZLw/exec"; // <-- GANTI DENGAN URL BARU ANDA

// --- Variabel Global ---
let user = {};
let allKelasData = [];
let allSiswaData = [];
let allCpTpData = [];
let allAgamaData = [];
let currentFase = null;
let currentSelectedCpStatuses = {}; // <-- BARU: Untuk menyimpan status ceklis CP

// --- Elemen Notifikasi ---
const notificationToast = document.getElementById('notification-toast');
const notificationMessage = document.getElementById('notification-toast-message');
const notificationClose = document.getElementById('notification-toast-close');

// --- Elemen Form Input Nilai (DIPERBARUI) ---
const formInputNilai = document.getElementById('form-input-nilai');
const selectKelas = document.getElementById('pilih-kelas');
const selectSiswa = document.getElementById('pilih-siswa');
const selectMapel = document.getElementById('pilih-mapel');
const selectAgama = document.getElementById('pilih-agama');
const cpSelectionList = document.getElementById('cp-selection-list'); // <-- BARU: Div Checkbox
const finalDescriptionInput = document.getElementById('final-description-input'); // <-- BARU: Textarea Deskripsi Akhir
const nilaiAkhirInput = document.getElementById('nilai-akhir-input'); // <-- BARU: Input Nilai Angka
const simpanNilaiBtn = document.getElementById('simpan-nilai-btn');
// Hapus elemen lama yang tidak dipakai
// const selectCP = document.getElementById('pilih-cp');
// const mulokIndicator = document.getElementById('mulok-indicator');
// const deskripsiTercapaiInput = document.getElementById('deskripsi-tercapai-input');
// const deskripsiBimbinganInput = document.getElementById('deskripsi-bimbingan-input');
// const editDeskripsiBtn = document.getElementById('edit-deskripsi-btn');
// const selectNilai = document.getElementById('pilih-nilai');

// --- Elemen Halaman Data Siswa ---
const downloadTemplateBtn = document.getElementById('download-template-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const csvFileInput = document.getElementById('csv-file-input');
const siswaTableBody = document.getElementById('siswa-table-body');
const toggleSiswaListBtn = document.getElementById('toggle-siswa-list');
const siswaTableContainer = document.querySelector('.data-table-container');


// --- Fungsi Notifikasi Elegan ---
function showNotification(message, type = 'info') { /* ... kode sama ... */ }
function hideNotification() { /* ... kode sama ... */ }
if (notificationClose) { /* ... kode sama ... */ }

// --- Implementasi fungsi yg mungkin hilang
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

// --- Fungsi Utama ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. OTENTIKASI (Sama)
    user.name = localStorage.getItem('userName');
    user.spreadsheetId = localStorage.getItem('spreadsheetId');
    user.username = localStorage.getItem('userUsername');
    if (!user.name || !user.spreadsheetId || !user.username) { /* ... kode sama ... */ }
    document.getElementById('welcome-message').innerText = `Selamat Datang, ${user.name}!`;

    // 2. LOGIKA LOGOUT (Sama)
    document.getElementById('logout-button').addEventListener('click', (e) => { /* ... kode sama ... */ });

    // 3. LOGIKA NAVIGASI SIDEBAR (Sama)
    const navLinks = document.querySelectorAll('.nav-link');
    const contentPages = document.querySelectorAll('.content-page');
    navLinks.forEach(link => { /* ... kode sama ... */ });

    // 4. MEMUAT DATA AWAL (Sama)
    loadInitialData();

    // 5. LOGIKA HALAMAN DATA SISWA (Sama)
    if (downloadTemplateBtn) { /* ... kode sama ... */ }
    if (importCsvBtn) { /* ... kode sama ... */ }
    if (csvFileInput) { /* ... kode sama ... */ }

    // 6. LOGIKA DROPDOWN FILTER AWAL (Sama)
    if (selectKelas) {
        selectKelas.addEventListener('change', (e) => {
            const selectedKelasId = e.target.value;
            const selectedKelas = allKelasData.find(k => k.id_kelas === selectedKelasId);
            currentFase = selectedKelas ? selectedKelas.fase : null;
            loadSiswaDropdown(selectedKelasId);
            // Muat ulang daftar CP jika Mapel & Agama sudah dipilih
            loadCpCheckboxList(selectMapel.value, currentFase, selectAgama.value);
            resetFinalDescriptionAndGrade(); // Reset deskripsi & nilai akhir
        });
    }
    if (selectMapel) {
        selectMapel.addEventListener('change', (e) => {
            const selectedMapelId = e.target.value;
            loadAgamaDropdown(allAgamaData);
             selectAgama.disabled = !selectedMapelId;
            loadCpCheckboxList(selectedMapelId, currentFase, selectAgama.value);
             resetFinalDescriptionAndGrade();
        });
    }
    if (selectAgama) {
        selectAgama.addEventListener('change', (e) => {
            loadCpCheckboxList(selectMapel.value, currentFase, e.target.value);
             resetFinalDescriptionAndGrade();
        });
    }

    // 7. LOGIKA TOMBOL TAMPILKAN SEMUA SISWA (Sama)
    if (toggleSiswaListBtn && siswaTableContainer) { /* ... kode sama ... */ }

    // 8. LOGIKA TOMBOL SIMPAN NILAI (Event listener sama)
    if (simpanNilaiBtn && formInputNilai) {
         simpanNilaiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleSimpanNilai();
        });
    }

}); // --- AKHIR DOMContentLoaded ---


/**
 * Memuat data awal lengkap (Sama)
 */
function loadInitialData() {
    showNotification("Memuat data awal sekolah...", "info");
    const payload = { action: "getInitialData", spreadsheetId: user.spreadsheetId };

    fetch(GAS_URL, { /* ... kode fetch sama ... */ })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideNotification();
            const namaSekolah = data.profil.nama_sekolah || "[Nama Sekolah Belum Diisi]";
            document.getElementById('sidebar-school-name').innerText = namaSekolah;

            allKelasData = data.kelas || [];
            loadKelasDropdown(allKelasData);
            loadMapelDropdown(data.mapel);
            allAgamaData = data.agama || [];
            loadAgamaDropdown(allAgamaData);
            allSiswaData = data.siswa || [];
            allCpTpData = data.cptp || [];
            loadSiswaList();
        } else { /* ... kode error sama ... */ }
    })
    .catch(error => { /* ... kode catch sama ... */ });
}

// --- Fungsi-fungsi Dropdown Awal (Sama) ---
function loadKelasDropdown(kelasArray) { /* ... kode sama ... */ }
function loadSiswaDropdown(selectedKelasId) { /* ... kode sama ... */ }
function loadMapelDropdown(mapelArray) { /* ... kode sama ... */ }
function loadAgamaDropdown(agamaArray) { /* ... kode sama ... */ }


/**
 * (FUNGSI BARU/REVISI) Membuat daftar Checkbox CP
 */
function loadCpCheckboxList(selectedMapelId, selectedFase, selectedAgama) {
    if (!cpSelectionList || !allCpTpData) return;
    cpSelectionList.innerHTML = ''; // Kosongkan list
    currentSelectedCpStatuses = {}; // Reset status pilihan CP
    resetFinalDescriptionAndGrade(); // Reset deskripsi & nilai

    if (!selectedMapelId || !selectedFase || !selectedAgama) {
        cpSelectionList.innerHTML = `<p style="color: #6c757d;"><i>Pilih kelas, mapel, dan agama terlebih dahulu...</i></p>`;
        return;
    }

    const cpTpFiltered = allCpTpData.filter(cp =>
        cp.id_mapel === selectedMapelId &&
        cp.fase === selectedFase &&
        (cp.agama === selectedAgama || cp.agama === "Semua" || !cp.agama)
    );

    if (cpTpFiltered.length === 0) {
        // --- DETEKSI MULOK ---
        cpSelectionList.innerHTML = `<p style="color: #6c757d;"><i>Tidak ada CP ditemukan. Input manual deskripsi untuk Muatan Lokal diaktifkan di bawah.</i></p>`;
        // Langsung aktifkan textarea deskripsi untuk Mulok
        if(finalDescriptionInput) {
            finalDescriptionInput.readOnly = false;
            finalDescriptionInput.placeholder = "Masukkan deskripsi Muatan Lokal secara manual...";
        }
         // Aktifkan input nilai akhir juga
        if(nilaiAkhirInput) nilaiAkhirInput.disabled = false;
        // Tandai sebagai Mulok (meskipun tidak ada checkbox)
        currentSelectedCpStatuses['MULOK'] = { isMulok: true };
    } else {
        // --- BUAT CHECKBOX JIKA ADA CP ---
         if(finalDescriptionInput) {
             finalDescriptionInput.readOnly = true; // Kunci textarea deskripsi awal
             finalDescriptionInput.placeholder = "Deskripsi akan dibuat otomatis setelah memilih CP...";
         }
         if(nilaiAkhirInput) nilaiAkhirInput.disabled = false; // Aktifkan input nilai

        cpTpFiltered.forEach(cp => {
            const cpId = cp.id_cp_tp;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('cp-item');
            itemDiv.innerHTML = `
                <div class="cp-item-header">${cp.deskripsi || '[Tanpa Deskripsi TP]'}</div>
                <div class="cp-item-options">
                    <label>
                        <input type="checkbox" name="cp_status_${cpId}" value="Tercapai" data-cp-id="${cpId}" data-status="Tercapai"> Tercapai
                    </label>
                    <label>
                        <input type="checkbox" name="cp_status_${cpId}" value="Perlu Bimbingan" data-cp-id="${cpId}" data-status="Perlu Bimbingan"> Perlu Bimbingan
                    </label>
                </div>
            `;
            cpSelectionList.appendChild(itemDiv);

            // Tambahkan event listener ke checkbox
            const checkboxes = itemDiv.querySelectorAll(`input[name="cp_status_${cpId}"]`);
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    handleCpCheckboxChange(e.target, cpId, checkboxes);
                });
            });
        });
    }
}

/**
 * (BARU) Menangani perubahan pada checkbox CP
 */
function handleCpCheckboxChange(changedCheckbox, cpId, allCheckboxesForThisCp) {
    const status = changedCheckbox.dataset.status;
    const isChecked = changedCheckbox.checked;

    // Logika: Hanya satu status per CP (Tercapai ATAU Perlu Bimbingan)
    if (isChecked) {
        allCheckboxesForThisCp.forEach(cb => {
            if (cb !== changedCheckbox) {
                cb.checked = false; // Hapus ceklis pada opsi lain
            }
        });
        // Simpan status yang terpilih
        currentSelectedCpStatuses[cpId] = status;
    } else {
        // Jika ceklis dihapus, hapus status dari penyimpanan
        delete currentSelectedCpStatuses[cpId];
    }

    // Generate ulang deskripsi akhir
    generateFinalDescription();
}

/**
 * (BARU) Membuat Deskripsi Naratif Akhir
 */
function generateFinalDescription() {
    if (!finalDescriptionInput || !allCpTpData) return;

    let deskripsiTercapaiList = [];
    let deskripsiBimbinganList = [];

    // Cek apakah ini Mulok (tidak ada CP yang dipilih secara spesifik)
    if (currentSelectedCpStatuses['MULOK'] && currentSelectedCpStatuses['MULOK'].isMulok) {
        finalDescriptionInput.readOnly = false; // Pastikan bisa diedit
        finalDescriptionInput.placeholder = "Masukkan deskripsi Muatan Lokal secara manual...";
        // Jangan generate deskripsi otomatis untuk Mulok
        // Biarkan user mengetik manual
        return;
    }


    // Kumpulkan deskripsi berdasarkan status yang dipilih
    for (const cpId in currentSelectedCpStatuses) {
        const status = currentSelectedCpStatuses[cpId];
        const cpData = allCpTpData.find(cp => cp.id_cp_tp === cpId);
        if (cpData) {
            if (status === "Tercapai" && cpData.deskripsi_tercapai) {
                deskripsiTercapaiList.push(cpData.deskripsi_tercapai);
            } else if (status === "Perlu Bimbingan" && cpData.deskripsi_perlu_bimbingan) {
                deskripsiBimbinganList.push(cpData.deskripsi_perlu_bimbingan);
            }
        }
    }

    // --- Rangkai Kalimat Deskripsi ---
    let finalDescription = "";
    const namaSiswa = selectSiswa.options[selectSiswa.selectedIndex]?.text || "Ananda"; // Ambil nama siswa jika ada

    // Kalimat Pembuka (Contoh sederhana, nanti bisa pakai dropdown)
    const pembukaTercapai = `Ananda ${namaSiswa} menunjukkan penguasaan yang baik dalam hal `;
    const pembukaBimbingan = `Namun, Ananda ${namaSiswa} masih memerlukan bimbingan lebih lanjut dalam hal `;

    if (deskripsiTercapaiList.length > 0) {
        finalDescription += pembukaTercapai + deskripsiTercapaiList.join(', ') + ". ";
    }

    if (deskripsiBimbinganList.length > 0) {
        finalDescription += pembukaBimbingan + deskripsiBimbinganList.join(', ') + ".";
    }

    if (finalDescription === "") {
        finalDescription = "Belum ada capaian yang dipilih.";
         finalDescriptionInput.readOnly = true; // Kunci jika kosong
    } else {
        finalDescriptionInput.readOnly = false; // Buat bisa diedit
    }

    finalDescriptionInput.value = finalDescription.trim(); // Masukkan ke textarea
    finalDescriptionInput.placeholder = "Deskripsi rapor..."; // Ganti placeholder
}

/**
 * (BARU) Reset deskripsi akhir dan nilai
 */
 function resetFinalDescriptionAndGrade() {
    if(finalDescriptionInput) {
        finalDescriptionInput.value = '';
        finalDescriptionInput.readOnly = true;
        finalDescriptionInput.placeholder = "Deskripsi akan dibuat otomatis setelah memilih CP...";
    }
    if(nilaiAkhirInput) {
        nilaiAkhirInput.value = '';
        nilaiAkhirInput.disabled = true; // Nonaktifkan sampai CP/Mulok muncul
    }
     currentSelectedCpStatuses = {}; // Kosongkan status CP
 }


// --- Fungsi-fungsi Halaman Data Siswa ---
// (Tidak ada perubahan di sini)
function handleDownloadTemplate() { /* ... kode sama ... */ }
function handleImportCSV(event) { /* ... kode sama ... */ }
function parseCSV(text) { /* ... kode sama ... */ }
function uploadSiswaData(siswaDataArray) { /* ... kode sama ... */ }
function loadSiswaList() { /* ... kode sama ... */ }


/**
 * (DIPERBARUI) Simpan Nilai & Deskripsi Akhir (Tahap 1 - Belum simpan status CP)
 */
function handleSimpanNilai() {
    const id_kelas = selectKelas.value;
    const id_siswa = selectSiswa.value;
    const id_mapel = selectMapel.value;
    const nilai_akhir = nilaiAkhirInput.value;
    const deskripsi_rapor = finalDescriptionInput.value; // Ambil deskripsi final

    // Validasi
    if (!id_kelas || !id_siswa || !id_mapel) {
        showNotification("Pilihan Kelas, Siswa, dan Mapel wajib diisi!", "warning");
        return;
    }
    if (nilai_akhir === "" || nilai_akhir < 0 || nilai_akhir > 100) {
         showNotification("Nilai Akhir harus berupa angka antara 0 dan 100.", "warning");
         return;
    }
     if (!deskripsi_rapor && !currentSelectedCpStatuses['MULOK']) { // Deskripsi kosong tapi bukan mulok?
         if (!confirm("Deskripsi rapor kosong. Yakin ingin menyimpan?")) {
             return;
         }
     }
      if (currentSelectedCpStatuses['MULOK'] && !deskripsi_rapor) { // Mulok tapi deskripsi kosong?
           showNotification("Untuk Muatan Lokal, deskripsi wajib diisi.", "warning");
           return;
      }


    showNotification("Menyimpan nilai akhir & deskripsi...", "info");
    simpanNilaiBtn.disabled = true;

    // --- PAYLOAD SEMENTARA (TAHAP 1) ---
    // Kita kirim data rekap, belum detail status CP per item
    // Kita bisa gunakan 'id_cp_tp' = null atau 'REKAP' untuk menandai ini
    const payload = {
        action: "saveNilaiCp", // Tetap pakai action ini, backend akan diubah
        spreadsheetId: user.spreadsheetId,
        id_kelas: id_kelas,
        id_siswa: id_siswa,
        id_mapel: id_mapel,
        id_cp_tp: Object.keys(currentSelectedCpStatuses).length > 0 ? (currentSelectedCpStatuses['MULOK'] ? `MULOK-${id_mapel}` : 'REKAP') : null, // Tandai sebagai rekap/mulok jika ada pilihan CP, atau null jika tidak ada
        nilai: nilai_akhir, // Kirim nilai akhir di kolom 'nilai'
        // Kirim deskripsi final ke kolom yang sesuai di backend
        deskripsi_tercapai: deskripsi_rapor, // Gunakan kolom ini untuk deskripsi final
        deskripsi_perlu_bimbingan: "" // Kosongkan kolom kedua
    };
    // --- AKHIR PAYLOAD SEMENTARA ---

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, "success");
            // Reset form (opsional)
             resetFinalDescriptionAndGrade();
             cpSelectionList.innerHTML = '<p style="color: #6c757d;"><i>Pilih kelas, mapel, dan agama terlebih dahulu...</i></p>'; // Kosongkan list CP
        } else {
             showNotification("Gagal menyimpan: " + data.message, "error");
        }
    })
    .catch(error => {
        console.error("Error saving nilai:", error);
        showNotification("Terjadi kesalahan jaringan saat menyimpan.", "error");
    })
    .finally(() => {
        simpanNilaiBtn.disabled = false;
    });
}

// Implementasi fungsi yang mungkin hilang
document.getElementById('logout-button').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm("Apakah Anda yakin ingin logout?")) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
});
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPageId = link.getAttribute('data-page');
        navLinks.forEach(nav => nav.classList.remove('active'));
        contentPages.forEach(page => page.classList.remove('active'));
        link.classList.add('active');
        document.getElementById(targetPageId).classList.add('active');
        if (targetPageId === 'page-data-siswa') {
            loadSiswaList();
        }
    });
});
if (downloadTemplateBtn) { downloadTemplateBtn.addEventListener('click', handleDownloadTemplate); }
if (importCsvBtn) { importCsvBtn.addEventListener('click', () => { csvFileInput.click(); }); }
if (csvFileInput) { csvFileInput.addEventListener('change', handleImportCSV); }
if (toggleSiswaListBtn && siswaTableContainer) {
     toggleSiswaListBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isExpanded = siswaTableContainer.classList.toggle('is-expanded');
        toggleSiswaListBtn.innerText = isExpanded ? 'Sembunyikan' : 'Tampilkan Semua Siswa';
    });
 }
 if (simpanNilaiBtn && formInputNilai) {
     simpanNilaiBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleSimpanNilai();
    });
}
