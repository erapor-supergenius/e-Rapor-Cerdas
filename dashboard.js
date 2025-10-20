/* === e-Rapor Cerdas - Dashboard Script (Versi Final Lengkap) === */

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
let currentSelectedCpStatuses = {}; // Menyimpan status { cpId: "Tercapai" / "Perlu Bimbingan" }

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
const cpSelectionList = document.getElementById('cp-selection-list'); // Div untuk checkbox CP
const mulokIndicator = document.getElementById('mulok-indicator'); // Span indikator Mulok
const finalDescriptionInput = document.getElementById('final-description-input'); // Textarea deskripsi final
const nilaiAkhirInput = document.getElementById('nilai-akhir-input'); // Input nilai angka
const simpanNilaiBtn = document.getElementById('simpan-nilai-btn');
// Tombol edit deskripsi (opsional, textarea sudah bisa diedit)
const editDeskripsiBtn = document.getElementById('edit-deskripsi-btn'); // Mungkin tidak diperlukan lagi jika textarea selalu editable setelah ada CP

// --- Elemen Halaman Data Siswa ---
const downloadTemplateBtn = document.getElementById('download-template-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const csvFileInput = document.getElementById('csv-file-input');
const siswaTableBody = document.getElementById('siswa-table-body');
const toggleSiswaListBtn = document.getElementById('toggle-siswa-list');
const siswaTableContainer = document.querySelector('.data-table-container');


// --- Fungsi Notifikasi Elegan ---
function showNotification(message, type = 'info') {
    if (!notificationToast || !notificationMessage) {
        console.warn("Elemen notifikasi tidak ditemukan.");
        return;
    }
    notificationMessage.innerText = message;
    notificationToast.className = 'notification-toast'; // Reset class
    notificationToast.classList.add(type);
    notificationToast.style.display = 'flex';
    if (notificationToast.timer) clearTimeout(notificationToast.timer); // Hapus timer lama
    notificationToast.timer = setTimeout(() => { hideNotification(); }, 5000);
}
function hideNotification() {
    if (!notificationToast) return;
    notificationToast.style.display = 'none';
     if (notificationToast.timer) clearTimeout(notificationToast.timer);
     notificationToast.timer = null;
}
if (notificationClose) {
    notificationClose.addEventListener('click', hideNotification);
} else {
    console.warn("Elemen notification-toast-close tidak ditemukan.");
}


// --- Fungsi Utama (DOMContentLoaded) ---
document.addEventListener("DOMContentLoaded", () => {
    try {
        // 1. OTENTIKASI
        user.name = localStorage.getItem('userName');
        user.spreadsheetId = localStorage.getItem('spreadsheetId');
        user.username = localStorage.getItem('userUsername');
        const welcomeMsgEl = document.getElementById('welcome-message');

        if (!user.name || !user.spreadsheetId || !user.username) {
            alert("Sesi Anda telah berakhir. Silakan login kembali.");
            window.location.href = 'index.html';
            return;
        }
        if (welcomeMsgEl) welcomeMsgEl.innerText = `Selamat Datang, ${user.name}!`;
        else console.error("Elemen #welcome-message tidak ditemukan.");

        // 2. LOGIKA LOGOUT
        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm("Apakah Anda yakin ingin logout?")) {
                    localStorage.clear();
                    window.location.href = 'index.html';
                }
            });
        } else console.error("Elemen #logout-button tidak ditemukan.");

        // 3. LOGIKA NAVIGASI SIDEBAR
        const navLinks = document.querySelectorAll('.nav-link');
        const contentPages = document.querySelectorAll('.content-page');
        if (navLinks.length > 0 && contentPages.length > 0) {
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetPageId = link.getAttribute('data-page');
                    if (!targetPageId) {
                        console.warn("Link navigasi tidak punya 'data-page':", link);
                        return;
                    }
                    navLinks.forEach(nav => nav.classList.remove('active'));
                    contentPages.forEach(page => page.classList.remove('active'));
                    link.classList.add('active');
                    const targetPage = document.getElementById(targetPageId);
                    if (targetPage) {
                        targetPage.classList.add('active');
                        if (targetPageId === 'page-data-siswa') {
                            loadSiswaList(); // Muat data tabel siswa saat halaman aktif
                        }
                    } else {
                        console.error(`Target page #${targetPageId} tidak ditemukan.`);
                        showNotification(`Halaman ${targetPageId} tidak ditemukan!`, "error");
                    }
                });
            });
             // Aktifkan halaman default (Dashboard) saat load
             const defaultLink = document.querySelector('.nav-link[data-page="page-home"]');
             const defaultPage = document.getElementById('page-home');
             if (defaultLink && defaultPage) {
                 navLinks.forEach(nav => nav.classList.remove('active'));
                 contentPages.forEach(page => page.classList.remove('active'));
                 defaultLink.classList.add('active');
                 defaultPage.classList.add('active');
             }

        } else console.error("Elemen .nav-link atau .content-page tidak ditemukan.");

        // 4. MEMUAT DATA AWAL
        loadInitialData();

        // 5. LOGIKA HALAMAN DATA SISWA
        if (downloadTemplateBtn) downloadTemplateBtn.addEventListener('click', handleDownloadTemplate);
        else console.warn("Elemen #download-template-btn tidak ditemukan.");
        if (importCsvBtn && csvFileInput) importCsvBtn.addEventListener('click', () => csvFileInput.click());
        else console.warn("Elemen #import-csv-btn atau #csv-file-input tidak ditemukan.");
        if (csvFileInput) csvFileInput.addEventListener('change', handleImportCSV);
        else console.warn("Elemen #csv-file-input tidak ditemukan.");

        // 6. LOGIKA DROPDOWN FILTER INPUT NILAI
        if (selectKelas) {
            selectKelas.addEventListener('change', (e) => {
                const selectedKelasId = e.target.value;
                const selectedKelas = allKelasData.find(k => k.id_kelas === selectedKelasId);
                currentFase = selectedKelas ? selectedKelas.fase : null;
                loadSiswaDropdown(selectedKelasId);
                loadCpCheckboxList(selectMapel ? selectMapel.value : null, currentFase, selectAgama ? selectAgama.value : null);
                resetFinalDescriptionAndGrade();
                resetMulok();
            });
        } else console.warn("Elemen #pilih-kelas tidak ditemukan.");

        if (selectMapel) {
            selectMapel.addEventListener('change', (e) => {
                const selectedMapelId = e.target.value;
                loadAgamaDropdown(allAgamaData);
                if (selectAgama) selectAgama.disabled = !selectedMapelId;
                loadCpCheckboxList(selectedMapelId, currentFase, selectAgama ? selectAgama.value : null);
                resetFinalDescriptionAndGrade();
                resetMulok();
            });
        } else console.warn("Elemen #pilih-mapel tidak ditemukan.");

        if (selectAgama) {
            selectAgama.addEventListener('change', (e) => {
                loadCpCheckboxList(selectMapel ? selectMapel.value : null, currentFase, e.target.value);
                resetFinalDescriptionAndGrade();
                resetMulok();
            });
        } else console.warn("Elemen #pilih-agama tidak ditemukan.");

        // Event listener untuk checkbox CP dibuat di dalam loadCpCheckboxList

        // 7. LOGIKA TOMBOL EDIT DESKRIPSI (Sekarang hanya untuk mengaktifkan textarea jika dinonaktifkan)
        if (editDeskripsiBtn && finalDescriptionInput) {
             editDeskripsiBtn.addEventListener('click', () => {
                 finalDescriptionInput.readOnly = false;
                 editDeskripsiBtn.disabled = true; // Nonaktifkan setelah diklik
                 showNotification("Deskripsi rapor sekarang bisa diedit manual.", "info");
                 finalDescriptionInput.focus(); // Fokus ke textarea
             });
        } else {
             // console.warn("Elemen #edit-deskripsi-btn atau #final-description-input tidak ditemukan.");
             // Tombol edit mungkin tidak terlalu krusial lagi
        }


        // 8. LOGIKA TOMBOL TAMPILKAN SEMUA SISWA
        if (toggleSiswaListBtn && siswaTableContainer) {
             toggleSiswaListBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isExpanded = siswaTableContainer.classList.toggle('is-expanded');
                toggleSiswaListBtn.innerText = isExpanded ? 'Sembunyikan' : 'Tampilkan Semua Siswa';
            });
         } else console.warn("Elemen #toggle-siswa-list atau .data-table-container tidak ditemukan.");

        // 9. LOGIKA TOMBOL SIMPAN NILAI
        if (simpanNilaiBtn && formInputNilai) {
             simpanNilaiBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Mencegah submit form HTML standar
                handleSimpanNilai();
            });
        } else console.error("Elemen #simpan-nilai-btn atau #form-input-nilai tidak ditemukan.");

    } catch (error) {
        console.error("Error kritikal saat inisialisasi dashboard:", error);
        showNotification("Gagal memuat dashboard: " + error.message, "error");
        // Mungkin tampilkan pesan error yang lebih jelas di body
        document.body.innerHTML = `<div style="padding: 20px; text-align: center; color: red;"><h1>Terjadi Kesalahan</h1><p>Gagal memuat dashboard. Silakan coba refresh halaman atau hubungi administrator.</p><pre>${error.stack}</pre></div>`;
    }
}); // --- AKHIR DOMContentLoaded ---


/**
 * Memuat data awal lengkap dari Backend
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
        if (!response.ok) throw new Error(`Server merespon dengan status ${response.status}`);
        return response.json();
    })
    .then(data => {
        hideNotification(); // Sembunyikan notif loading
        if (data.success) {
            const sidebarSchoolName = document.getElementById('sidebar-school-name');
            if (sidebarSchoolName) sidebarSchoolName.innerText = data.profil.nama_sekolah || "[Nama Sekolah Belum Diisi]";

            allKelasData = data.kelas || [];
            loadKelasDropdown(allKelasData);

            loadMapelDropdown(data.mapel); // Muat mapel dulu

            allAgamaData = data.agama || [];
            loadAgamaDropdown(allAgamaData); // Baru muat agama

            allSiswaData = data.siswa || [];
            allCpTpData = data.cptp || [];

            // Muat daftar siswa jika halaman data siswa aktif saat ini
            const activePage = document.querySelector('.content-page.active');
            if (activePage && activePage.id === 'page-data-siswa') {
                loadSiswaList();
            }
             // Aktifkan dropdown pertama (Kelas) jika ada data
             if (selectKelas && allKelasData.length > 0) selectKelas.disabled = false;
             if (selectMapel && data.mapel && data.mapel.length > 0) selectMapel.disabled = false;

        } else {
            showNotification("Gagal memuat data awal: " + (data.message || "Error tidak diketahui"), "error");
            console.error("Server returned error:", data.message);
        }
    })
    .catch(error => {
        hideNotification(); // Sembunyikan notif loading
        console.error("Error fetching initial data:", error);
        showNotification(`Kesalahan jaringan saat memuat data: ${error.message}. Periksa console (F12).`, "error");
        // Nonaktifkan semua dropdown jika load awal gagal
        if (selectKelas) selectKelas.disabled = true;
        if (selectMapel) selectMapel.disabled = true;
        if (selectAgama) selectAgama.disabled = true;
        if (selectSiswa) selectSiswa.disabled = true;
    });
}

// --- Fungsi-fungsi Pengisian Dropdown ---
function loadKelasDropdown(kelasArray) {
    if (!selectKelas) return;
    selectKelas.innerHTML = '';
    selectKelas.add(new Option("Pilih Kelas...", ""));
    if (kelasArray && kelasArray.length > 0) {
        kelasArray.forEach(kelas => {
            const displayText = `${kelas.nama_kelas} (Fase ${kelas.fase || '?'})`;
            selectKelas.add(new Option(displayText, kelas.id_kelas));
        });
        selectKelas.disabled = false; // Aktifkan jika ada data
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
         selectMapel.disabled = false; // Aktifkan jika ada data
    } else {
        selectMapel.add(new Option("Belum ada data mapel", ""));
        selectMapel.disabled = true;
    }
}

function loadAgamaDropdown(agamaArray) {
    if (!selectAgama) return;
    selectAgama.innerHTML = '';
    selectAgama.add(new Option("Pilih Agama...", ""));
    let hasAgama = false;
    if (agamaArray && agamaArray.length > 0) {
        // Tambahkan "Semua" secara eksplisit
        selectAgama.add(new Option("Semua (Umum)", "Semua"));
        hasAgama = true; // Anggap "Semua" sudah cukup
        agamaArray.forEach(agama => {
            if (agama && agama.toLowerCase() !== 'semua') {
                 selectAgama.add(new Option(agama, agama));
                 hasAgama = true;
            }
        });
    }
    if (!hasAgama) {
        selectAgama.add(new Option("Tidak ada data agama", ""));
        selectAgama.disabled = true;
    } else {
        // Tetap nonaktif sampai mapel dipilih
        selectAgama.disabled = !selectMapel || !selectMapel.value;
    }
}


/**
 * Membuat daftar Checkbox CP + Deteksi Mulok
 */
function loadCpCheckboxList(selectedMapelId, selectedFase, selectedAgama) {
    if (!cpSelectionList || !allCpTpData) {
        console.warn("Elemen #cp-selection-list atau data CP belum siap.");
        return;
    }
    cpSelectionList.innerHTML = '';
    currentSelectedCpStatuses = {};
    resetFinalDescriptionAndGrade();
    resetMulok(); // Reset status Mulok setiap kali filter berubah

    if (!selectedMapelId || !selectedFase || !selectedAgama) {
        cpSelectionList.innerHTML = `<p style="color: #6c757d;"><i>Pilih kelas, mapel, dan agama terlebih dahulu...</i></p>`;
        return;
    }

    const cpTpFiltered = allCpTpData.filter(cp =>
        cp.id_mapel === selectedMapelId &&
        cp.fase === selectedFase &&
        (cp.agama === selectedAgama || cp.agama === "Semua" || !cp.agama) // Handle agama null/kosong + "Semua"
    );

    if (cpTpFiltered.length === 0) {
        // --- MULOK ---
        isMulokActive = true;
        cpSelectionList.innerHTML = `<p style="color: #6c757d;"><i>Tidak ada CP ditemukan. Input manual deskripsi untuk Muatan Lokal diaktifkan di bawah.</i></p>`;
        if (mulokIndicator) mulokIndicator.style.display = 'inline'; // Tampilkan "(Muatan Lokal)"

        if(finalDescriptionInput) {
            finalDescriptionInput.readOnly = false; // Aktifkan textarea
            finalDescriptionInput.placeholder = "Masukkan deskripsi Muatan Lokal secara manual...";
        }
        if(nilaiAkhirInput) nilaiAkhirInput.disabled = false; // Aktifkan input nilai
        currentSelectedCpStatuses['MULOK'] = { isMulok: true }; // Tandai Mulok

    } else {
        // --- ADA CP ---
        isMulokActive = false;
        if (mulokIndicator) mulokIndicator.style.display = 'none'; // Sembunyikan indikator Mulok

        if(finalDescriptionInput) {
             finalDescriptionInput.readOnly = true; // Kunci textarea awal
             finalDescriptionInput.placeholder = "Deskripsi akan dibuat otomatis setelah memilih CP...";
        }
        if(nilaiAkhirInput) nilaiAkhirInput.disabled = false; // Aktifkan input nilai

        cpTpFiltered.forEach(cp => {
            const cpId = cp.id_cp_tp;
            if (!cpId) return; // Lewati jika ID CP tidak valid
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('cp-item');
            // Pastikan ID unik untuk checkbox dan label
            const tercapaiId = `cp_${cpId}_tercapai`;
            const bimbinganId = `cp_${cpId}_bimbingan`;

            itemDiv.innerHTML = `
                <div class="cp-item-header">${cp.deskripsi || '[Tanpa Deskripsi TP]'}</div>
                <div class="cp-item-options">
                    <label for="${tercapaiId}">
                        <input type="checkbox" id="${tercapaiId}" name="cp_status_${cpId}" value="Tercapai" data-cp-id="${cpId}" data-status="Tercapai"> Tercapai
                    </label>
                    <label for="${bimbinganId}">
                        <input type="checkbox" id="${bimbinganId}" name="cp_status_${cpId}" value="Perlu Bimbingan" data-cp-id="${cpId}" data-status="Perlu Bimbingan"> Perlu Bimbingan
                    </label>
                </div>
            `;
            cpSelectionList.appendChild(itemDiv);

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
 * Menangani perubahan pada checkbox CP
 */
function handleCpCheckboxChange(changedCheckbox, cpId, allCheckboxesForThisCp) {
    const status = changedCheckbox.dataset.status;
    const isChecked = changedCheckbox.checked;

    if (isChecked) {
        allCheckboxesForThisCp.forEach(cb => {
            if (cb !== changedCheckbox) cb.checked = false;
        });
        currentSelectedCpStatuses[cpId] = status;
    } else {
        delete currentSelectedCpStatuses[cpId];
    }
    generateFinalDescription(); // Regenerate deskripsi setiap ada perubahan
}

/**
 * Membuat Deskripsi Naratif Akhir
 */
function generateFinalDescription() {
    if (!finalDescriptionInput || !allCpTpData) return;

    let deskripsiTercapaiList = [];
    let deskripsiBimbinganList = [];
    let isAnyCpSelected = false; // Flag jika ada CP yang diceklis

    // Jangan generate jika Mulok aktif
    if (isMulokActive) {
        finalDescriptionInput.readOnly = false;
        finalDescriptionInput.placeholder = "Masukkan deskripsi Muatan Lokal secara manual...";
        // Jangan hapus isi textarea jika user sudah mengetik untuk Mulok
        return;
    }

    // Kumpulkan deskripsi dari CP yang diceklis
    for (const cpId in currentSelectedCpStatuses) {
         if (cpId === 'MULOK') continue; // Lewati flag Mulok
        isAnyCpSelected = true; // Tandai ada CP yg dipilih
        const status = currentSelectedCpStatuses[cpId];
        const cpData = allCpTpData.find(cp => cp.id_cp_tp === cpId);
        if (cpData) {
            if (status === "Tercapai" && cpData.deskripsi_tercapai) {
                // Ambil bagian awal deskripsi (lebih singkat)
                let descPart = cpData.deskripsi_tercapai.split(/[.,;!?]/)[0].trim().toLowerCase();
                if (descPart) deskripsiTercapaiList.push(descPart);
            } else if (status === "Perlu Bimbingan" && cpData.deskripsi_perlu_bimbingan) {
                let descPart = cpData.deskripsi_perlu_bimbingan.split(/[.,;!?]/)[0].trim().toLowerCase();
                if (descPart) deskripsiBimbinganList.push(descPart);
            }
        }
    }

    let finalDescription = "";
    const siswaSelectedIndex = selectSiswa ? selectSiswa.selectedIndex : -1;
    const namaSiswa = siswaSelectedIndex > 0 && selectSiswa.options.length > siswaSelectedIndex
                    ? selectSiswa.options[siswaSelectedIndex].text
                    : "Ananda";

    // Contoh kalimat pembuka (bisa dibuat lebih dinamis nanti)
    const pembukaTercapai = `Ananda ${namaSiswa} menunjukkan penguasaan yang baik dalam `;
    const pembukaBimbingan = `Namun, ${namaSiswa} masih memerlukan bimbingan dalam `;
    const pembukaHanyaBimbingan = `Ananda ${namaSiswa} perlu meningkatkan pemahaman dalam `;

    if (deskripsiTercapaiList.length > 0) {
        finalDescription += pembukaTercapai + deskripsiTercapaiList.join(', ') + ". ";
    }

    if (deskripsiBimbinganList.length > 0) {
        if (finalDescription !== "") { // Jika sudah ada bagian Tercapai
            finalDescription += pembukaBimbingan + deskripsiBimbinganList.join(', ') + ".";
        } else { // Jika hanya Perlu Bimbingan
            finalDescription += pembukaHanyaBimbingan + deskripsiBimbinganList.join(', ') + ".";
        }
    }

    finalDescriptionInput.value = finalDescription.trim(); // Masukkan ke textarea

    // Atur status readonly dan placeholder
    if (!isAnyCpSelected) {
        finalDescriptionInput.placeholder = "Pilih status capaian pada CP di atas...";
        finalDescriptionInput.readOnly = true;
         if (editDeskripsiBtn) editDeskripsiBtn.disabled = true;
    } else {
        finalDescriptionInput.placeholder = "Deskripsi rapor...";
        finalDescriptionInput.readOnly = false; // Buat bisa diedit
         if (editDeskripsiBtn) editDeskripsiBtn.disabled = false; // Aktifkan tombol edit
    }
}

/**
 * Reset deskripsi akhir dan nilai
 */
 function resetFinalDescriptionAndGrade() {
    if(finalDescriptionInput) {
        finalDescriptionInput.value = '';
        finalDescriptionInput.readOnly = true;
        finalDescriptionInput.placeholder = "Deskripsi akan dibuat otomatis setelah memilih CP...";
    }
    if(nilaiAkhirInput) {
        nilaiAkhirInput.value = '';
        nilaiAkhirInput.disabled = true; // Nonaktifkan sampai ada CP/Mulok
    }
    currentSelectedCpStatuses = {}; // Kosongkan status CP
    if (editDeskripsiBtn) editDeskripsiBtn.disabled = true; // Nonaktifkan tombol edit
 }

/**
 * Reset status Mulok
 */
function resetMulok() {
    isMulokActive = false;
    // Tampilkan kembali dropdown CP lama (jika ada) dan sembunyikan indikator Mulok
    // const selectCPElement = document.getElementById('pilih-cp'); // Dropdown lama mungkin sudah dihapus
    // if (selectCPElement) selectCPElement.style.display = 'block';
    if (mulokIndicator) mulokIndicator.style.display = 'none';

    // Pastikan textarea deskripsi final terkunci lagi jika bukan Mulok
    if (!isMulokActive && finalDescriptionInput) {
        finalDescriptionInput.readOnly = true;
        finalDescriptionInput.placeholder = "Deskripsi akan dibuat otomatis setelah memilih CP...";
    }
}


// --- Fungsi-fungsi Halaman Data Siswa ---
function handleDownloadTemplate() {
    showNotification("Membuat template...", "info");
    const payload = { action: "handleSiswaActions", subAction: "getSiswaTemplate", spreadsheetId: user.spreadsheetId };
    fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } })
    .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
    .then(data => {
        if (data.success) {
            hideNotification();
            const blob = new Blob([data.template], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "template_siswa.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Bersihkan memori
        } else {
            showNotification("Gagal membuat template: " + (data.message || "Error tidak diketahui"), "error");
        }
    })
    .catch(error => {
        hideNotification();
        console.error("Error downloading template:", error);
        showNotification("Kesalahan jaringan saat download.", "error");
    });
}
function handleImportCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    showNotification("Membaca file CSV...", "info");
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const data = parseCSV(text);
            if (!data || data.length === 0) {
                showNotification("File CSV kosong atau format header tidak sesuai.", "warning");
                return;
            }
            uploadSiswaData(data);
        } catch (parseError) {
             console.error("Error parsing CSV:", parseError);
             showNotification("Gagal membaca file CSV: " + parseError.message, "error");
        }
    };
     reader.onerror = function() {
         console.error("FileReader error:", reader.error);
         showNotification("Gagal membaca file.", "error");
     };
    reader.readAsText(file);
    event.target.value = null; // Reset input file agar bisa pilih file yg sama lagi
}
function parseCSV(text) {
    // Implementasi parseCSV yang lebih robust (seperti di jawaban sebelumnya)
    const lines = text.split(/[\r\n]+/).filter(line => line.trim() !== '');
    if (lines.length < 2) return []; // Butuh header + minimal 1 data

    const parseLine = (line) => { /* ... (fungsi parseLine dari jawaban sebelumnya) ... */
        const values = []; let currentVal = ''; let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') { currentVal += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal.trim()); currentVal = '';
            } else { currentVal += char; }
        }
        values.push(currentVal.trim()); return values;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase());
    const data = [];
    const expectedHeaders = ["nisn", "nis", "nama_siswa", "tempat_lahir", "tanggal_lahir", "jenis_kelamin", "agama", "kelas", "fase", "tahun_ajaran_masuk", "nama_ayah", "pekerjaan_ayah", "nama_ibu", "pekerjaan_ibu", "alamat_siswa", "asal_sekolah", "nama_wali", "alamat_orang_tua"];

    // Validasi header
     let headerMap = {};
     let missingHeaders = [];
     expectedHeaders.forEach(eh => {
         const index = headers.indexOf(eh);
         if (index === -1) {
             missingHeaders.push(eh);
         } else {
             headerMap[eh] = index; // Simpan index header yang ditemukan
         }
     });

     if (missingHeaders.length > 0) {
         console.warn("CSV headers missing:", missingHeaders);
         showNotification(`Header CSV tidak lengkap. Header hilang: ${missingHeaders.join(', ')}`, "warning");
         // return []; // Batalkan import jika header tidak lengkap?
     }


    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        // Cukup periksa apakah jumlah value minimal sama dengan header yg ada
        if (values.length >= headers.length) {
            let obj = {};
            // Gunakan headerMap untuk mengambil data berdasarkan nama header
             expectedHeaders.forEach(eh => {
                 const index = headerMap[eh];
                 if (index !== undefined && index < values.length) { // Pastikan index valid
                     obj[eh] = values[index];
                 } else {
                      obj[eh] = null; // Isi null jika header hilang atau kolom tidak ada
                 }
             });
            // Pastikan ada data siswa sebelum di push
            if (obj.nama_siswa || obj.nisn || obj.nis) {
                 data.push(obj);
            }
        } else {
            console.warn(`Skipping line ${i + 1} due to column count mismatch.`);
        }
    }
    return data;
}
function uploadSiswaData(siswaDataArray) {
    showNotification(`Mengimpor ${siswaDataArray.length} data siswa...`, "info");
    const payload = { action: "handleSiswaActions", subAction: "importSiswa", spreadsheetId: user.spreadsheetId, data: siswaDataArray };
    fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } })
    .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
    .then(data => {
        if (data.success) {
            showNotification(data.message, "success");
            loadInitialData(); // Muat ulang semua data agar tabel & dropdown update
        } else {
            showNotification("Gagal mengimpor: " + (data.message || "Error tidak diketahui"), "error");
        }
    })
    .catch(error => {
        console.error("Error importing data:", error);
        showNotification("Kesalahan jaringan saat impor.", "error");
    });
}
function loadSiswaList() {
    if (!siswaTableBody) {
        console.warn("Elemen #siswa-table-body tidak ditemukan saat loadSiswaList.");
        return;
    }

    // Reset tampilan tombol lipat
    if (toggleSiswaListBtn) toggleSiswaListBtn.style.display = 'none';
    if (siswaTableContainer) siswaTableContainer.classList.remove('is-expanded');
    if (toggleSiswaListBtn) toggleSiswaListBtn.innerText = 'Tampilkan Semua Siswa';

    if (allSiswaData && allSiswaData.length > 0) {
        siswaTableBody.innerHTML = ''; // Kosongkan tabel
        allSiswaData.forEach(siswa => {
            const tr = document.createElement('tr');
            let tglLahir = 'N/A';
            if(siswa.tanggal_lahir) {
                 try {
                     const tglValue = siswa.tanggal_lahir;
                     let dateObj = (tglValue instanceof Date) ? tglValue : (new Date(tglValue));
                     if (dateObj && !isNaN(dateObj.getTime())) {
                        tglLahir = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                     } else tglLahir = tglValue; // Tampilkan string asli jika invalid
                 } catch(e) { tglLahir = siswa.tanggal_lahir; }
            }
            tr.innerHTML = `
                <td>${siswa.nisn || 'N/A'}</td>
                <td>${siswa.nama_siswa || 'N/A'}</td>
                <td>${siswa.kelas || 'N/A'}</td>
                <td>${tglLahir}</td>
                <td><a href="#" class="edit-btn" data-siswa-id="${siswa.id_siswa || ''}">Edit</a></td>
            `;
            siswaTableBody.appendChild(tr);
        });

        // Tampilkan tombol lipat jika perlu
        if (allSiswaData.length > 3 && toggleSiswaListBtn) {
            toggleSiswaListBtn.style.display = 'block';
        }
    } else {
        siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data siswa. Silakan import.</td></tr>`;
    }
}


/**
 * Simpan Nilai & Deskripsi Akhir (handle Mulok)
 */
function handleSimpanNilai() {
    const id_kelas = selectKelas ? selectKelas.value : null;
    const id_siswa = selectSiswa ? selectSiswa.value : null;
    const id_mapel = selectMapel ? selectMapel.value : null;
    const nilai_akhir = nilaiAkhirInput ? nilaiAkhirInput.value : null;
    const deskripsi_rapor = finalDescriptionInput ? finalDescriptionInput.value : '';

    if (!id_kelas || !id_siswa || !id_mapel || nilai_akhir === null || nilai_akhir === undefined) {
        showNotification("Pilihan Kelas, Siswa, Mapel, dan Nilai Akhir wajib diisi!", "warning");
        return;
    }
     // Validasi nilai angka
    const nilaiNum = parseFloat(nilai_akhir);
    if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
        showNotification("Nilai Akhir harus berupa angka antara 0 dan 100.", "warning");
        return;
    }

    let id_cp_tp_tosend = null; // Default null (jika tidak ada CP dipilih sama sekali)
    const hasSelectedCp = Object.keys(currentSelectedCpStatuses).length > 0;

    if (hasSelectedCp) {
        id_cp_tp_tosend = isMulokActive ? null : 'REKAP'; // Backend akan generate ID Mulok
    }


    if (isMulokActive && !deskripsi_rapor) {
         showNotification("Untuk Muatan Lokal, deskripsi wajib diisi.", "warning");
         return;
    }
     // Konfirmasi jika deskripsi kosong tapi BUKAN mulok
     if (!isMulokActive && !deskripsi_rapor && hasSelectedCp) {
         if (!confirm("Deskripsi rapor kosong padahal ada CP dipilih. Yakin ingin menyimpan?")) {
             return;
         }
     }


    showNotification("Menyimpan nilai akhir & deskripsi...", "info");
    if(simpanNilaiBtn) simpanNilaiBtn.disabled = true;

    const payload = {
        action: "saveNilaiCp", spreadsheetId: user.spreadsheetId,
        id_kelas, id_siswa, id_mapel,
        id_cp_tp: id_cp_tp_tosend, // Kirim REKAP, null (untuk Mulok), atau null jika tidak ada CP dipilih
        nilai: nilaiNum, // Kirim nilai angka yang sudah divalidasi
        deskripsi_tercapai: deskripsi_rapor, // Deskripsi final
        deskripsi_perlu_bimbingan: "" // Kosongkan
    };

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
    .then(response => {
        if (!response.ok) throw new Error(`Server merespon dengan status ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification(data.message, "success");
            // Reset form yang relevan
            resetFinalDescriptionAndGrade();
            if (cpSelectionList) cpSelectionList.innerHTML = '<p style="color: #6c757d;"><i>Pilih kelas, mapel, dan agama terlebih dahulu...</i></p>';
             // Mungkin reset pilihan siswa? Atau biarkan agar bisa input siswa lain di kelas yg sama?
             // if(selectSiswa) selectSiswa.selectedIndex = 0;
        } else {
             showNotification("Gagal menyimpan: " + (data.message || "Error tidak diketahui"), "error");
             console.error("Server save error:", data.message);
        }
    })
    .catch(error => {
        console.error("Error saving nilai:", error);
        showNotification(`Kesalahan jaringan saat menyimpan: ${error.message}. Periksa console.`, "error");
    })
    .finally(() => {
        if(simpanNilaiBtn) simpanNilaiBtn.disabled = false;
    });
}
