/* === e-Rapor Cerdas - Dashboard Script === */

// !!! PENTING !!! GANTI DENGAN URL WEB APP BARU DARI DATABASE ADMIN v2 ANDA !!!
const GAS_URL = "https://script.google.com/macros/s/AKfycby-empDcPt5BndGZnjLNyTKt9wbMIP3iRtvoQELdWWoOvZnu2om_Uoh9Zsj5I0Wdq7ZLw/exec"; // <-- GANTI INI

// --- Variabel Global ---
let user = {};
let allKelasData = [];
let allSiswaData = [];
let allCpTpData = [];
let allAgamaData = [];
let currentFase = null;
let isMulokActive = false;

// --- Elemen Notifikasi ---
const notificationToast = document.getElementById('notification-toast');
const notificationMessage = document.getElementById('notification-toast-message');
const notificationClose = document.getElementById('notification-toast-close');

// --- Elemen Form Input Nilai ---
const formInputNilai = document.getElementById('form-input-nilai');
const selectKelas = document.getElementById('pilih-kelas');
const selectSiswa = document.getElementById('pilih-siswa');
const selectMapel = document.getElementById('pilih-mapel');
const selectAgama = document.getElementById('pilih-agama');
const selectCP = document.getElementById('pilih-cp');
const mulokIndicator = document.getElementById('mulok-indicator');
const deskripsiTercapaiInput = document.getElementById('deskripsi-tercapai-input');
const deskripsiBimbinganInput = document.getElementById('deskripsi-bimbingan-input');
const editDeskripsiBtn = document.getElementById('edit-deskripsi-btn');
const selectNilai = document.getElementById('pilih-nilai');
const simpanNilaiBtn = document.getElementById('simpan-nilai-btn');

// --- Elemen Halaman Data Siswa ---
const downloadTemplateBtn = document.getElementById('download-template-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const csvFileInput = document.getElementById('csv-file-input');
const siswaTableBody = document.getElementById('siswa-table-body');
const toggleSiswaListBtn = document.getElementById('toggle-siswa-list');
const siswaTableContainer = document.querySelector('.data-table-container');


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


// --- Fungsi Utama ---
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
                loadSiswaList();
            }
        });
    });

    // 4. MEMUAT DATA AWAL
    loadInitialData();

    // 5. LOGIKA HALAMAN DATA SISWA
    if (downloadTemplateBtn) { downloadTemplateBtn.addEventListener('click', handleDownloadTemplate); }
    if (importCsvBtn) { importCsvBtn.addEventListener('click', () => { csvFileInput.click(); }); }
    if (csvFileInput) { csvFileInput.addEventListener('change', handleImportCSV); }

    // 6. LOGIKA DROPDOWN BERTINGKAT
    if (selectKelas) {
        selectKelas.addEventListener('change', (e) => {
            const selectedKelasId = e.target.value;
            const selectedKelas = allKelasData.find(k => k.id_kelas === selectedKelasId);
            currentFase = selectedKelas ? selectedKelas.fase : null;
            loadSiswaDropdown(selectedKelasId);
            loadCpTpDropdown(selectMapel.value, currentFase, selectAgama.value);
            resetDeskripsi();
            resetMulok();
        });
    }
    if (selectMapel) {
        selectMapel.addEventListener('change', (e) => {
            const selectedMapelId = e.target.value;
            loadAgamaDropdown(allAgamaData); // Tampilkan semua agama
             selectAgama.disabled = !selectedMapelId; // Aktifkan jika mapel dipilih
            loadCpTpDropdown(selectedMapelId, currentFase, selectAgama.value);
            resetDeskripsi();
            resetMulok();
        });
    }
    if (selectAgama) {
        selectAgama.addEventListener('change', (e) => {
            loadCpTpDropdown(selectMapel.value, currentFase, e.target.value);
            resetDeskripsi();
            resetMulok();
        });
    }
    if (selectCP) {
        selectCP.addEventListener('change', (e) => {
            const selectedCpId = e.target.value;
             if (!isMulokActive) {
                displayCpDescription(selectedCpId);
                editDeskripsiBtn.disabled = !selectedCpId;
             }
        });
    }

    // 7. LOGIKA TOMBOL EDIT DESKRIPSI
    if (editDeskripsiBtn) {
        editDeskripsiBtn.addEventListener('click', () => {
            if(deskripsiTercapaiInput && deskripsiBimbinganInput) {
                deskripsiTercapaiInput.readOnly = false;
                deskripsiBimbinganInput.readOnly = false;
                editDeskripsiBtn.disabled = true;
                 showNotification("Deskripsi sekarang bisa diedit.", "info");
            }
        });
    }

    // 8. LOGIKA TOMBOL TAMPILKAN SEMUA SISWA
    if (toggleSiswaListBtn && siswaTableContainer) {
         toggleSiswaListBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isExpanded = siswaTableContainer.classList.toggle('is-expanded');
            toggleSiswaListBtn.innerText = isExpanded ? 'Sembunyikan' : 'Tampilkan Semua Siswa';
        });
     }

    // 9. LOGIKA TOMBOL SIMPAN NILAI
    if (simpanNilaiBtn && formInputNilai) {
         simpanNilaiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleSimpanNilai();
        });
    }

}); // --- AKHIR DOMContentLoaded ---


/**
 * Memuat data awal lengkap
 */
function loadInitialData() {
    showNotification("Memuat data awal sekolah...", "info");
    const payload = { action: "getInitialData", spreadsheetId: user.spreadsheetId };

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
    .then(response => {
        if (!response.ok) { // Cek jika status bukan 2xx
             throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
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
        } else {
            showNotification("Gagal memuat data awal: " + data.message, "error");
            console.error("Server returned error:", data.message);
        }
    })
    .catch(error => {
        console.error("Error fetching initial data:", error);
        showNotification(`Terjadi kesalahan jaringan: ${error.message}. Periksa console F12.`, "error");
    });
}

// --- Fungsi-fungsi Dropdown ---
function loadKelasDropdown(kelasArray) {
    if (!selectKelas) return;
    selectKelas.innerHTML = '';
    selectKelas.add(new Option("Pilih Kelas...", ""));
    if (kelasArray && kelasArray.length > 0) {
        kelasArray.forEach(kelas => {
            const displayText = `${kelas.nama_kelas} (Fase ${kelas.fase || '?'})`;
            selectKelas.add(new Option(displayText, kelas.id_kelas));
        });
        selectKelas.disabled = false;
    } else {
        selectKelas.add(new Option("Belum ada data kelas", ""));
        selectKelas.disabled = true;
    }
}
function loadSiswaDropdown(selectedKelasId) {
    if (!selectSiswa) return;
    selectSiswa.innerHTML = '';
    selectSiswa.disabled = true;
    if (!selectedKelasId) {
        selectSiswa.add(new Option("Pilih kelas dahulu...", ""));
        return;
    }
    const siswaDiKelas = allSiswaData.filter(siswa => siswa.id_kelas === selectedKelasId);
    if (siswaDiKelas.length > 0) {
        selectSiswa.add(new Option(`Pilih Siswa (${siswaDiKelas.length} siswa)...`, ""));
        siswaDiKelas.forEach(siswa => {
            selectSiswa.add(new Option(siswa.nama_siswa, siswa.id_siswa));
        });
        selectSiswa.disabled = false;
    } else {
        selectSiswa.add(new Option("Tidak ada siswa di kelas ini", ""));
    }
}
function loadMapelDropdown(mapelArray) {
    if (!selectMapel) return;
    selectMapel.innerHTML = '';
    selectMapel.add(new Option("Pilih Mata Pelajaran...", ""));
    if (mapelArray && mapelArray.length > 0) {
        mapelArray.forEach(mapel => {
            selectMapel.add(new Option(mapel.nama_mapel, mapel.id_mapel));
        });
         selectMapel.disabled = false;
    } else {
        selectMapel.add(new Option("Belum ada data mapel", ""));
        selectMapel.disabled = true;
    }
}
function loadAgamaDropdown(agamaArray) {
    if (!selectAgama) return;
    selectAgama.innerHTML = '';
    selectAgama.add(new Option("Pilih Agama...", ""));
    if (agamaArray && agamaArray.length > 0) {
        // Tambahkan "Semua" secara manual jika perlu untuk mapel umum
        selectAgama.add(new Option("Semua (Umum)", "Semua"));
        agamaArray.forEach(agama => {
            if (agama && agama.toLowerCase() !== 'semua') { // Hindari duplikat "Semua"
                 selectAgama.add(new Option(agama, agama));
            }
        });
         selectAgama.disabled = true; // Nonaktifkan sampai mapel dipilih
    } else {
        selectAgama.add(new Option("Tidak ada data agama", ""));
        selectAgama.disabled = true;
    }
}


/**
 * Isi dropdown CP + Deteksi Mulok
 */
function loadCpTpDropdown(selectedMapelId, selectedFase, selectedAgama) {
    if (!selectCP || !allCpTpData) return; // Tambahkan cek allCpTpData
    selectCP.innerHTML = '';
    selectCP.disabled = true;
    resetDeskripsi();
    resetMulok();

    if (!selectedMapelId || !selectedFase || !selectedAgama) {
        selectCP.add(new Option("Pilih kelas, mapel & agama...", ""));
        return;
    }

    const cpTpFiltered = allCpTpData.filter(cp =>
        cp.id_mapel === selectedMapelId &&
        cp.fase === selectedFase &&
        (cp.agama === selectedAgama || cp.agama === "Semua" || !cp.agama) // Handle jika agama di CP null/kosong + Logika "Semua"
    );

    if (cpTpFiltered.length === 0) {
        isMulokActive = true;
        selectCP.style.display = 'none';
        if (mulokIndicator) mulokIndicator.style.display = 'inline';
        selectCP.add(new Option("Muatan Lokal Aktif", "MULOK"));
        selectCP.selectedIndex = 0; // Pilih opsi dummy (sebelumnya 1)
        if (deskripsiTercapaiInput) deskripsiTercapaiInput.readOnly = false;
        if (deskripsiBimbinganInput) deskripsiBimbinganInput.readOnly = false;
        if (editDeskripsiBtn) editDeskripsiBtn.disabled = true;
        showNotification("Tidak ada CP ditemukan. Input manual deskripsi Muatan Lokal diaktifkan.", "info");
    } else {
        isMulokActive = false;
        selectCP.style.display = 'block';
        if (mulokIndicator) mulokIndicator.style.display = 'none';
        selectCP.add(new Option(`Pilih Elemen CP (${cpTpFiltered.length} elemen)...`, ""));
        cpTpFiltered.forEach(cp => {
            const shortDesc = cp.deskripsi && cp.deskripsi.length > 70 ? cp.deskripsi.substring(0, 70) + "..." : cp.deskripsi;
            selectCP.add(new Option(shortDesc || '[Tanpa Deskripsi TP]', cp.id_cp_tp));
        });
        selectCP.disabled = false;
    }
}

/**
 * Tampilkan deskripsi di TEXTAREA
 */
function displayCpDescription(selectedCpId) {
    if (!deskripsiTercapaiInput || !deskripsiBimbinganInput || !editDeskripsiBtn) return;
    if (!selectedCpId || isMulokActive) {
       resetDeskripsi();
        return;
    }
    const selectedCpData = allCpTpData.find(cp => cp.id_cp_tp === selectedCpId);
    if (selectedCpData) {
        deskripsiTercapaiInput.value = selectedCpData.deskripsi_tercapai || '';
        deskripsiBimbinganInput.value = selectedCpData.deskripsi_perlu_bimbingan || '';
        deskripsiTercapaiInput.readOnly = true;
        deskripsiBimbinganInput.readOnly = true;
        editDeskripsiBtn.disabled = false;
    } else {
        resetDeskripsi();
    }
}

// Reset deskripsi & status edit
function resetDeskripsi() {
     if (deskripsiTercapaiInput) {
        deskripsiTercapaiInput.value = '';
        deskripsiTercapaiInput.readOnly = true;
        deskripsiTercapaiInput.placeholder = "Pilih CP atau input manual untuk Mulok..."; // Kembalikan placeholder
     }
     if (deskripsiBimbinganInput) {
         deskripsiBimbinganInput.value = '';
         deskripsiBimbinganInput.readOnly = true;
         deskripsiBimbinganInput.placeholder = "Pilih CP atau input manual untuk Mulok..."; // Kembalikan placeholder

     }
     if (editDeskripsiBtn) {
         editDeskripsiBtn.disabled = true;
     }
}
// Reset status Mulok
function resetMulok() {
    isMulokActive = false;
    if (selectCP) selectCP.style.display = 'block';
    if (mulokIndicator) mulokIndicator.style.display = 'none';
     // Pastikan textarea terkunci lagi jika Mulok direset
    if (!isMulokActive) {
        if(deskripsiTercapaiInput) deskripsiTercapaiInput.readOnly = true;
        if(deskripsiBimbinganInput) deskripsiBimbinganInput.readOnly = true;
    }
}


// --- Fungsi-fungsi Halaman Data Siswa ---
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
        headers: { "Content-Type": "text/plain;charset=utf-8" }
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
        showNotification("Terjadi kesalahan jaringan saat download.", "error");
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
    event.target.value = null; // Reset input file
}
function parseCSV(text) {
    const lines = text.split(/[\r\n]+/).filter(line => line.trim() !== ''); // Handle Windows/Unix line endings
    if (lines.length < 2) return [];
    // Handle quotes in headers and values carefully
    const parseLine = (line) => {
        const values = [];
        let currentVal = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') { // Handle escaped quote ""
                    currentVal += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal.trim());
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        values.push(currentVal.trim()); // Add last value
        return values;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase()); // Lowercase headers for consistency
    const data = [];
    const expectedHeaders = [ "nisn", "nis", "nama_siswa", "tempat_lahir", "tanggal_lahir",
    "jenis_kelamin", "agama", "kelas", "fase", "tahun_ajaran_masuk", "nama_ayah",
    "pekerjaan_ayah", "nama_ibu", "pekerjaan_ibu", "alamat_siswa", "asal_sekolah",
    "nama_wali", "alamat_orang_tua"]; // Definisikan header yang diharapkan

    // Validasi header dasar
    if (headers.length < expectedHeaders.length || !expectedHeaders.every(h => headers.includes(h))) {
         console.warn("CSV headers do not match expected headers. Expected:", expectedHeaders, "Got:", headers);
         // Mungkin beri notifikasi ke user
         // showNotification("Header CSV tidak sesuai template.", "warning");
         // return []; // Atau coba proses dengan header yang ada? Tergantung kebutuhan.
    }


    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        if (values.length === headers.length) { // Pastikan jumlah kolom cocok
            let obj = {};
            headers.forEach((header, index) => {
                 // Hanya ambil header yang kita kenal
                if (expectedHeaders.includes(header)) {
                    obj[header] = values[index];
                }
            });
             // Pastikan objek tidak kosong setelah filtering header
             if (Object.keys(obj).length > 0) {
                 data.push(obj);
             }
        } else {
            console.warn(`Skipping line ${i + 1} due to column mismatch. Expected ${headers.length}, got ${values.length}. Line: ${lines[i]}`);
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
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, "success");
            loadInitialData(); // Muat ulang semua data
        } else {
            showNotification("Gagal mengimpor: " + data.message, "error");
        }
    })
    .catch(error => {
        console.error("Error importing data:", error);
        showNotification("Terjadi kesalahan jaringan saat impor.", "error");
    });
}
function loadSiswaList() {
    if (!siswaTableBody) return;

    if (toggleSiswaListBtn) toggleSiswaListBtn.style.display = 'none';
    if (siswaTableContainer) siswaTableContainer.classList.remove('is-expanded');
    if (toggleSiswaListBtn) toggleSiswaListBtn.innerText = 'Tampilkan Semua Siswa';

    if (allSiswaData && allSiswaData.length > 0) {
        siswaTableBody.innerHTML = '';
        allSiswaData.forEach(siswa => {
            const tr = document.createElement('tr');
            let tglLahir = 'N/A';
            if(siswa.tanggal_lahir) {
                 try {
                     // Cek tipe data sebelum parse
                     const tglValue = siswa.tanggal_lahir;
                     let dateObj;
                     if (tglValue instanceof Date) {
                         dateObj = tglValue;
                     } else if (typeof tglValue === 'string' || typeof tglValue === 'number') {
                         dateObj = new Date(tglValue);
                     }
                     // Cek apakah hasil parsing valid
                     if (dateObj && !isNaN(dateObj.getTime())) {
                        tglLahir = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                     } else {
                         tglLahir = tglValue; // Tampilkan string asli jika parsing gagal
                     }
                 } catch(e) {
                     console.warn("Error parsing date:", siswa.tanggal_lahir, e);
                     tglLahir = siswa.tanggal_lahir; // Fallback ke nilai asli
                 }
            }
            tr.innerHTML = `
                <td>${siswa.nisn || 'N/A'}</td>
                <td>${siswa.nama_siswa || 'N/A'}</td>
                <td>${siswa.kelas || 'N/A'}</td>
                <td>${tglLahir}</td>
                <td><a href="#" class="edit-btn" data-siswa-id="${siswa.id_siswa}">Edit</a></td>
            `;
            siswaTableBody.appendChild(tr);
        });

        if (allSiswaData.length > 3 && toggleSiswaListBtn) {
            toggleSiswaListBtn.style.display = 'block';
        }
    } else {
        siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data siswa. Silakan import.</td></tr>`;
    }
}


/**
 * Simpan Nilai (handle Mulok)
 */
function handleSimpanNilai() {
    const id_kelas = selectKelas.value;
    const id_siswa = selectSiswa.value;
    const id_mapel = selectMapel.value;
    let id_cp_tp = selectCP.value; // Ambil nilai asli
    const nilai = selectNilai.value;
    const desc_tercapai_edited = deskripsiTercapaiInput.value;
    const desc_bimbingan_edited = deskripsiBimbinganInput.value;

    if (!id_kelas || !id_siswa || !id_mapel || !nilai) {
        showNotification("Pilihan Kelas, Siswa, Mapel, dan Nilai wajib diisi!", "warning");
        return;
    }
    if (!isMulokActive && !id_cp_tp) {
         showNotification("Pilih Elemen CP / TP terlebih dahulu.", "warning");
         return;
    }
    if (isMulokActive && (!desc_tercapai_edited || !desc_bimbingan_edited)) {
         showNotification("Untuk Muatan Lokal, kedua deskripsi wajib diisi manual.", "warning");
         return;
    }

    showNotification("Menyimpan nilai...", "info");
    simpanNilaiBtn.disabled = true;

    // Set id_cp_tp ke null jika Mulok
    if (isMulokActive || id_cp_tp === "MULOK") { // Periksa juga string "MULOK"
        id_cp_tp = null;
    }

    const payload = {
        action: "saveNilaiCp", spreadsheetId: user.spreadsheetId,
        id_kelas, id_siswa, id_mapel, id_cp_tp, nilai,
        deskripsi_tercapai: desc_tercapai_edited,
        deskripsi_perlu_bimbingan: desc_bimbingan_edited
    };

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification(data.message, "success");
            // Reset form
            selectCP.selectedIndex = 0;
            selectNilai.selectedIndex = 0;
            resetDeskripsi();
            if (isMulokActive) {
                 resetMulok();
                 loadCpTpDropdown(selectMapel.value, currentFase, selectAgama.value);
            }
        } else {
             showNotification("Gagal menyimpan: " + data.message, "error");
             console.error("Server save error:", data.message);
        }
    })
    .catch(error => {
        console.error("Error saving nilai:", error);
        showNotification(`Terjadi kesalahan jaringan saat menyimpan: ${error.message}. Periksa console.`, "error");
    })
    .finally(() => {
        simpanNilaiBtn.disabled = false;
    });
}
