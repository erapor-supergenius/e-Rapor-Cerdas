/* === e-Rapor Cerdas - Dashboard Script (Final V3 - Frasa dari Sheet) === */

// !!! PENTING !!! GANTI DENGAN URL WEB APP BARU DARI DATABASE ADMIN v2 ANDA !!!
const GAS_URL = "https://script.google.com/macros/s/AKfycby-empDcPt5BndGZnjLNyTKt9wbMIP3iRtvoQELdWWoOvZnu2om_Uoh9Zsj5I0Wdq7ZLw/exec"; // <-- GANTI INI

// --- Variabel Global ---
let user = {};
let allKelasData = [], allSiswaData = [], allCpTpData = [], allAgamaData = [];
let allFrasaTercapai = [], allFrasaBimbingan = []; // Daftar frasa dari sheet
let currentFase = null, isMulokActive = false;
let currentSelectedCpStatuses = {}; // { cpId: "Tercapai" / "Perlu Bimbingan" }
let currentPembukaTercapai = ""; // Kalimat pembuka terpilih/diketik
let currentPembukaBimbingan = ""; // Kalimat pembuka terpilih/diketik

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
const cpSelectionList = document.getElementById('cp-selection-list');
const mulokIndicator = document.getElementById('mulok-indicator');
const selectPembukaTercapai = document.getElementById('kalimat-pembuka-tercapai');
const inputCustomTercapai = document.getElementById('custom-pembuka-tercapai');
const selectPembukaBimbingan = document.getElementById('kalimat-pembuka-bimbingan');
const inputCustomBimbingan = document.getElementById('custom-pembuka-bimbingan');
const finalDescriptionInput = document.getElementById('final-description-input');
const nilaiAkhirInput = document.getElementById('nilai-akhir-input');
const simpanNilaiBtn = document.getElementById('simpan-nilai-btn');
const editDeskripsiBtn = document.getElementById('edit-deskripsi-btn'); // Tombol edit lama (mungkin tidak perlu)


// --- Elemen Halaman Data Siswa ---
const downloadTemplateBtn = document.getElementById('download-template-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const csvFileInput = document.getElementById('csv-file-input');
const siswaTableBody = document.getElementById('siswa-table-body');
const toggleSiswaListBtn = document.getElementById('toggle-siswa-list');
const siswaTableContainer = document.querySelector('.data-table-container');


// --- Fungsi Notifikasi Elegan ---
function showNotification(message, type = 'info') {
    if (!notificationToast || !notificationMessage) { console.warn("Notif elements missing."); return; }
    notificationMessage.innerText = message;
    notificationToast.className = 'notification-toast'; notificationToast.classList.add(type);
    notificationToast.style.display = 'flex';
    if (notificationToast.timer) clearTimeout(notificationToast.timer);
    notificationToast.timer = setTimeout(() => { hideNotification(); }, 5000);
}
function hideNotification() {
    if (!notificationToast) return;
    notificationToast.style.display = 'none';
    if (notificationToast.timer) clearTimeout(notificationToast.timer); notificationToast.timer = null;
}
if (notificationClose) { notificationClose.addEventListener('click', hideNotification); }
else { console.warn("#notification-toast-close missing."); }


// --- Fungsi Utama (DOMContentLoaded) ---
document.addEventListener("DOMContentLoaded", () => {
    try {
        // 1. OTENTIKASI
        user.name = localStorage.getItem('userName'); user.spreadsheetId = localStorage.getItem('spreadsheetId'); user.username = localStorage.getItem('userUsername');
        const welcomeMsgEl = document.getElementById('welcome-message');
        if (!user.name || !user.spreadsheetId || !user.username) { alert("Sesi berakhir. Login ulang."); window.location.href = 'index.html'; return; }
        if (welcomeMsgEl) welcomeMsgEl.innerText = `Selamat Datang, ${user.name}!`; else console.error("#welcome-message missing.");

        // 2. LOGIKA LOGOUT
        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) { logoutBtn.addEventListener('click', (e) => { e.preventDefault(); if (confirm("Yakin logout?")) { localStorage.clear(); window.location.href = 'index.html'; } }); }
        else console.error("#logout-button missing.");

        // 3. LOGIKA NAVIGASI SIDEBAR
        const navLinks = document.querySelectorAll('.nav-link'); const contentPages = document.querySelectorAll('.content-page');
        if (navLinks.length > 0 && contentPages.length > 0) {
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault(); const targetPageId = link.getAttribute('data-page'); if (!targetPageId) return;
                    navLinks.forEach(nav => nav.classList.remove('active')); contentPages.forEach(page => page.classList.remove('active'));
                    link.classList.add('active'); const targetPage = document.getElementById(targetPageId);
                    if (targetPage) { targetPage.classList.add('active'); if (targetPageId === 'page-data-siswa') loadSiswaList(); }
                    else { console.error(`Target page #${targetPageId} missing.`); showNotification(`Halaman ${targetPageId} tidak ada!`, "error"); }
                });
            });
            // Aktifkan default page
             const defaultLink = document.querySelector('.nav-link[data-page="page-home"]'); const defaultPage = document.getElementById('page-home');
             if (defaultLink && defaultPage) { defaultLink.classList.add('active'); defaultPage.classList.add('active'); }
        } else console.error(".nav-link or .content-page missing.");

        // 4. MEMUAT DATA AWAL
        loadInitialData();

        // 5. LOGIKA HALAMAN DATA SISWA
        if (downloadTemplateBtn) downloadTemplateBtn.addEventListener('click', handleDownloadTemplate);
        if (importCsvBtn && csvFileInput) importCsvBtn.addEventListener('click', () => csvFileInput.click());
        if (csvFileInput) csvFileInput.addEventListener('change', handleImportCSV);

        // 6. LOGIKA DROPDOWN FILTER INPUT NILAI
        if (selectKelas) selectKelas.addEventListener('change', handleKelasChange); else console.warn("#pilih-kelas missing.");
        if (selectMapel) selectMapel.addEventListener('change', handleMapelChange); else console.warn("#pilih-mapel missing.");
        if (selectAgama) selectAgama.addEventListener('change', handleAgamaChange); else console.warn("#pilih-agama missing.");

        // 7. Event Listener Dropdown Kalimat Pembuka
        if (selectPembukaTercapai && inputCustomTercapai) { selectPembukaTercapai.addEventListener('change', handlePembukaTercapaiChange); inputCustomTercapai.addEventListener('input', handleCustomTercapaiInput); } else console.warn("Phrase elements (Tercapai) missing.");
        if (selectPembukaBimbingan && inputCustomBimbingan) { selectPembukaBimbingan.addEventListener('change', handlePembukaBimbinganChange); inputCustomBimbingan.addEventListener('input', handleCustomBimbinganInput); } else console.warn("Phrase elements (Bimbingan) missing.");

        // 8. LOGIKA TOMBOL TAMPILKAN SEMUA SISWA
        if (toggleSiswaListBtn && siswaTableContainer) { toggleSiswaListBtn.addEventListener('click', (e) => { e.preventDefault(); const isExpanded = siswaTableContainer.classList.toggle('is-expanded'); toggleSiswaListBtn.innerText = isExpanded ? 'Sembunyikan' : 'Tampilkan Semua Siswa'; }); }
        else console.warn("#toggle-siswa-list or .data-table-container missing.");

        // 9. LOGIKA TOMBOL SIMPAN NILAI
        if (simpanNilaiBtn && formInputNilai) { simpanNilaiBtn.addEventListener('click', (e) => { e.preventDefault(); handleSimpanNilai(); }); }
        else console.error("#simpan-nilai-btn or #form-input-nilai missing.");

         // 10. (Opsional) Tombol Edit Deskripsi jika masih ada
         if (editDeskripsiBtn && finalDescriptionInput) {
             editDeskripsiBtn.addEventListener('click', () => {
                 finalDescriptionInput.readOnly = false;
                 editDeskripsiBtn.disabled = true;
                 showNotification("Deskripsi rapor bisa diedit manual.", "info");
                 finalDescriptionInput.focus();
             });
         }


    } catch (error) { console.error("Critical init error:", error); showNotification("Gagal memuat: " + error.message, "error"); }
}); // --- AKHIR DOMContentLoaded ---


// --- Handler Perubahan Dropdown Filter ---
function handleKelasChange(e) {
    const selectedKelasId = e.target.value;
    const selectedKelas = allKelasData.find(k => k.id_kelas === selectedKelasId);
    currentFase = selectedKelas ? selectedKelas.fase : null;
    loadSiswaDropdown(selectedKelasId);
    loadCpCheckboxList(selectMapel ? selectMapel.value : null, currentFase, selectAgama ? selectAgama.value : null);
    resetFinalDescriptionAndGrade();
    resetMulok();
}
function handleMapelChange(e) {
    const selectedMapelId = e.target.value;
    loadAgamaDropdown(allAgamaData);
    if (selectAgama) selectAgama.disabled = !selectedMapelId;
    loadCpCheckboxList(selectedMapelId, currentFase, selectAgama ? selectAgama.value : null);
    resetFinalDescriptionAndGrade();
    resetMulok();
}
function handleAgamaChange(e) {
    loadCpCheckboxList(selectMapel ? selectMapel.value : null, currentFase, e.target.value);
    resetFinalDescriptionAndGrade();
    resetMulok();
}

// --- Handler Perubahan Dropdown/Input Kalimat Pembuka ---
function handlePembukaTercapaiChange() {
    if (!selectPembukaTercapai || !inputCustomTercapai) return;
    const selVal = selectPembukaTercapai.value;
    if (selVal === 'custom') {
        inputCustomTercapai.style.display = 'block'; inputCustomTercapai.value = ''; inputCustomTercapai.focus();
        currentPembukaTercapai = " "; // Default spasi jika custom kosong
    } else {
        inputCustomTercapai.style.display = 'none';
        currentPembukaTercapai = selVal ? ` ${selVal.trim()} ` : " "; // Ambil value (sudah ada spasi)
        generateFinalDescription(); // Regenerate
    }
}
function handleCustomTercapaiInput() {
    if (!inputCustomTercapai) return;
    currentPembukaTercapai = inputCustomTercapai.value.trim() ? ` ${inputCustomTercapai.value.trim()} ` : " ";
    generateFinalDescription();
}
function handlePembukaBimbinganChange() {
    if (!selectPembukaBimbingan || !inputCustomBimbingan) return;
    const selVal = selectPembukaBimbingan.value;
    if (selVal === 'custom') {
        inputCustomBimbingan.style.display = 'block'; inputCustomBimbingan.value = ''; inputCustomBimbingan.focus();
        currentPembukaBimbingan = " ";
    } else {
        inputCustomBimbingan.style.display = 'none';
        currentPembukaBimbingan = selVal ? ` ${selVal.trim()} ` : " ";
        generateFinalDescription();
    }
}
function handleCustomBimbinganInput() {
    if (!inputCustomBimbingan) return;
    currentPembukaBimbingan = inputCustomBimbingan.value.trim() ? ` ${inputCustomBimbingan.value.trim()} ` : " ";
    generateFinalDescription();
}


/**
 * Memuat data awal + Memuat Opsi Frasa
 */
function loadInitialData() {
    showNotification("Memuat data awal sekolah...", "info");
    const payload = { action: "getInitialData", spreadsheetId: user.spreadsheetId };
    fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" }})
    .then(response => { if (!response.ok) throw new Error(`Server status ${response.status}`); return response.json(); })
    .then(data => {
        hideNotification();
        if (data.success) {
            const sidebarSchoolName = document.getElementById('sidebar-school-name');
            if (sidebarSchoolName) sidebarSchoolName.innerText = data.profil.nama_sekolah || "[Nama Sekolah]";

            allKelasData = data.kelas || []; loadKelasDropdown(allKelasData);
            loadMapelDropdown(data.mapel);
            allAgamaData = data.agama || []; loadAgamaDropdown(allAgamaData);
            allSiswaData = data.siswa || []; allCpTpData = data.cptp || [];

            // Muat opsi frasa ke dropdown
            allFrasaTercapai = data.frasaTercapai || [];
            allFrasaBimbingan = data.frasaBimbingan || [];
            loadPembukaOptions(selectPembukaTercapai, allFrasaTercapai);
            loadPembukaOptions(selectPembukaBimbingan, allFrasaBimbingan);
            // Set default kalimat pembuka dari opsi pertama
            currentPembukaTercapai = allFrasaTercapai.length > 0 ? ` ${allFrasaTercapai[0].trim()} ` : " menunjukkan penguasaan yang baik dalam ";
            currentPembukaBimbingan = allFrasaBimbingan.length > 0 ? ` ${allFrasaBimbingan[0].trim()} ` : " perlu bimbingan dalam ";

            const activePage = document.querySelector('.content-page.active');
            if (activePage && activePage.id === 'page-data-siswa') { loadSiswaList(); }
            if (selectKelas && allKelasData.length > 0) selectKelas.disabled = false;
            if (selectMapel && data.mapel && data.mapel.length > 0) selectMapel.disabled = false;
        } else {
            showNotification("Gagal memuat data awal: " + (data.message || "Error"), "error");
            console.error("Server init error:", data.message);
        }
    })
    .catch(error => {
        hideNotification();
        console.error("Initial load fetch error:", error);
        showNotification(`Jaringan error: ${error.message}.`, "error");
        // Nonaktifkan semua form jika gagal load
        if (formInputNilai) formInputNilai.style.opacity = '0.5';
        if (formInputNilai) formInputNilai.style.pointerEvents = 'none';
        const formElements = formInputNilai ? formInputNilai.elements : [];
        for(let el of formElements) el.disabled = true;
    });
}

/**
 * Memuat opsi dropdown kalimat pembuka
 */
function loadPembukaOptions(selectElement, optionsArray) {
    if (!selectElement) return;
    const customOption = selectElement.querySelector('option[value="custom"]'); // Simpan opsi custom
    selectElement.innerHTML = ''; // Hapus placeholder "Memuat..."

    if (optionsArray && optionsArray.length > 0) {
        optionsArray.forEach((frasa, index) => {
            const trimmedFrasa = frasa.trim();
            // Value pakai spasi agar langsung bisa dipakai, Text tidak
            const option = new Option(trimmedFrasa, ` ${trimmedFrasa} `);
            selectElement.add(option);
            if (index === 0) option.selected = true; // Pilih opsi pertama by default
        });
    } else {
        selectElement.add(new Option("-- Tidak ada pilihan dari sheet --", "")); // Fallback jika sheet kosong
    }
    // Tambahkan kembali opsi custom
    if (customOption) selectElement.add(customOption);
    else selectElement.add(new Option("-- Tulis Manual --", "custom")); // Tambahkan jika hilang
}

// --- Fungsi-fungsi Pengisian Dropdown Awal ---
function loadKelasDropdown(kelasArray) { if (!selectKelas) return; selectKelas.innerHTML = ''; selectKelas.add(new Option("Pilih Kelas...", "")); if (kelasArray && kelasArray.length > 0) { kelasArray.forEach(kelas => { const displayText = `${kelas.nama_kelas} (Fase ${kelas.fase || '?'})`; selectKelas.add(new Option(displayText, kelas.id_kelas)); }); selectKelas.disabled = false; } else { selectKelas.add(new Option("Belum ada data kelas", "")); selectKelas.disabled = true; } }
function loadSiswaDropdown(selectedKelasId) { if (!selectSiswa) return; selectSiswa.innerHTML = ''; selectSiswa.disabled = true; if (!selectedKelasId) { selectSiswa.add(new Option("Pilih kelas dahulu...", "")); return; } const siswaDiKelas = allSiswaData.filter(siswa => siswa.id_kelas === selectedKelasId); if (siswaDiKelas.length > 0) { selectSiswa.add(new Option(`Pilih Siswa (${siswaDiKelas.length} siswa)...`, "")); siswaDiKelas.forEach(siswa => { selectSiswa.add(new Option(siswa.nama_siswa, siswa.id_siswa)); }); selectSiswa.disabled = false; } else { selectSiswa.add(new Option("Tidak ada siswa di kelas ini", "")); } }
function loadMapelDropdown(mapelArray) { if (!selectMapel) return; selectMapel.innerHTML = ''; selectMapel.add(new Option("Pilih Mata Pelajaran...", "")); if (mapelArray && mapelArray.length > 0) { mapelArray.forEach(mapel => { selectMapel.add(new Option(mapel.nama_mapel, mapel.id_mapel)); }); selectMapel.disabled = false; } else { selectMapel.add(new Option("Belum ada data mapel", "")); selectMapel.disabled = true; } }
function loadAgamaDropdown(agamaArray) { if (!selectAgama) return; selectAgama.innerHTML = ''; selectAgama.add(new Option("Pilih Agama...", "")); let hasAgama = false; if (agamaArray && agamaArray.length > 0) { selectAgama.add(new Option("Semua (Umum)", "Semua")); hasAgama = true; agamaArray.forEach(agama => { if (agama && agama.toLowerCase() !== 'semua') { selectAgama.add(new Option(agama, agama)); hasAgama = true; } }); } if (!hasAgama) { selectAgama.add(new Option("Tidak ada data agama", "")); selectAgama.disabled = true; } else { selectAgama.disabled = !selectMapel || !selectMapel.value; } }


/**
 * Membuat daftar Checkbox CP + Deteksi Mulok
 */
function loadCpCheckboxList(selectedMapelId, selectedFase, selectedAgama) {
    if (!cpSelectionList || !allCpTpData) { console.warn("#cp-selection-list or CP data missing."); return; }
    cpSelectionList.innerHTML = ''; currentSelectedCpStatuses = {}; resetFinalDescriptionAndGrade(); resetMulok();
    if (!selectedMapelId || !selectedFase || !selectedAgama) { cpSelectionList.innerHTML = `<p style="color: #6c757d;"><i>Pilih kelas, mapel, & agama...</i></p>`; return; }

    const cpTpFiltered = allCpTpData.filter(cp => cp.id_mapel === selectedMapelId && cp.fase === selectedFase && (cp.agama === selectedAgama || cp.agama === "Semua" || !cp.agama));

    if (cpTpFiltered.length === 0) {
        isMulokActive = true; cpSelectionList.innerHTML = `<p style="color: #6c757d;"><i>Tidak ada CP. Input manual Mulok aktif.</i></p>`;
        if (mulokIndicator) mulokIndicator.style.display = 'inline';
        if(finalDescriptionInput) { finalDescriptionInput.readOnly = false; finalDescriptionInput.placeholder = "Input deskripsi Mulok..."; }
        if(nilaiAkhirInput) nilaiAkhirInput.disabled = false;
        currentSelectedCpStatuses['MULOK'] = { isMulok: true };
        // Sembunyikan tombol edit deskripsi (tidak relevan untuk Mulok)
        if (editDeskripsiBtn) editDeskripsiBtn.style.display = 'none';
    } else {
        isMulokActive = false; if (mulokIndicator) mulokIndicator.style.display = 'none';
        if(finalDescriptionInput) { finalDescriptionInput.readOnly = true; finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis..."; }
        if(nilaiAkhirInput) nilaiAkhirInput.disabled = false;
        // Tampilkan tombol edit deskripsi
         if (editDeskripsiBtn) {
             editDeskripsiBtn.style.display = 'block'; // Atau 'inline-block'
             editDeskripsiBtn.disabled = true; // Awalnya nonaktif
         }

        cpTpFiltered.forEach(cp => {
            const cpId = cp.id_cp_tp; if (!cpId) return;
            const itemDiv = document.createElement('div'); itemDiv.classList.add('cp-item');
            const tercapaiId = `cp_${cpId}_tercapai`; const bimbinganId = `cp_${cpId}_bimbingan`;
            itemDiv.innerHTML = `<div class="cp-item-header">${cp.deskripsi || '[No TP Desc]'}</div> <div class="cp-item-options"> <label for="${tercapaiId}"><input type="checkbox" id="${tercapaiId}" name="cp_status_${cpId}" value="Tercapai" data-cp-id="${cpId}" data-status="Tercapai"> Tercapai</label> <label for="${bimbinganId}"><input type="checkbox" id="${bimbinganId}" name="cp_status_${cpId}" value="Perlu Bimbingan" data-cp-id="${cpId}" data-status="Perlu Bimbingan"> P. Bimbingan</label> </div>`;
            cpSelectionList.appendChild(itemDiv);
            const checkboxes = itemDiv.querySelectorAll(`input[name="cp_status_${cpId}"]`);
            checkboxes.forEach(cb => { cb.addEventListener('change', (e) => handleCpCheckboxChange(e.target, cpId, checkboxes)); });
        });
    }
}

/**
 * Menangani perubahan pada checkbox CP
 */
function handleCpCheckboxChange(changedCheckbox, cpId, allCheckboxesForThisCp) {
    const status = changedCheckbox.dataset.status; const isChecked = changedCheckbox.checked;
    if (isChecked) { allCheckboxesForThisCp.forEach(cb => { if (cb !== changedCheckbox) cb.checked = false; }); currentSelectedCpStatuses[cpId] = status; }
    else { delete currentSelectedCpStatuses[cpId]; }
    generateFinalDescription(); // Regenerate deskripsi
     // Aktifkan/nonaktifkan tombol edit berdasarkan apakah ada CP dipilih
     if (editDeskripsiBtn) {
        editDeskripsiBtn.disabled = Object.keys(currentSelectedCpStatuses).filter(k => k !== 'MULOK').length === 0;
     }
}

/**
 * (DIPERBARUI) Membuat Deskripsi Naratif Akhir + Validasi Tombol Simpan
 */
function generateFinalDescription() {
    // ... (kode awal fungsi sama: cek elemen, loop CP, kumpulkan list) ...
    if (!finalDescriptionInput || !allCpTpData) return;

    let deskripsiTercapaiList = []; let deskripsiBimbinganList = [];
    let isAnyCpSelected = false;

    if (isMulokActive) {
        finalDescriptionInput.readOnly = false;
        finalDescriptionInput.placeholder = "Masukkan deskripsi Muatan Lokal secara manual...";
        // Untuk Mulok, anggap 'ada CP' agar tombol simpan bisa aktif (jika nilai diisi)
        isAnyCpSelected = true;
        // Jangan hapus isi jika user sudah mengetik
        // return; // Hapus return agar validasi tombol tetap jalan
    } else {
        // Kumpulkan deskripsi dari CP yang diceklis
        for (const cpId in currentSelectedCpStatuses) {
            if (cpId === 'MULOK') continue;
            isAnyCpSelected = true;
            const status = currentSelectedCpStatuses[cpId];
            const cpData = allCpTpData.find(cp => cp.id_cp_tp === cpId);
            if (cpData) {
                let descPart = cpData.deskripsi ? cpData.deskripsi.toLowerCase().replace(/[.,;!?]$/, '') : '';
                if (!descPart && status === "Tercapai") descPart = cpData.deskripsi_tercapai ? cpData.deskripsi_tercapai.toLowerCase().replace(/[.,;!?]$/, '') : '';
                if (!descPart && status === "Perlu Bimbingan") descPart = cpData.deskripsi_perlu_bimbingan ? cpData.deskripsi_perlu_bimbingan.toLowerCase().replace(/[.,;!?]$/, '') : '';

                if (descPart) {
                     if (status === "Tercapai") deskripsiTercapaiList.push(descPart);
                     else if (status === "Perlu Bimbingan") deskripsiBimbinganList.push(descPart);
                }
            }
        }
    }


    // --- Rangkai Kalimat (Sama seperti sebelumnya) ---
    let finalDescription = "";
    const siswaSelectedIndex = selectSiswa ? selectSiswa.selectedIndex : -1;
    const namaSiswa = siswaSelectedIndex > 0 && selectSiswa.options.length > siswaSelectedIndex ? selectSiswa.options[siswaSelectedIndex].text : "Ananda";
    const pembukaTercapai = currentPembukaTercapai || " menunjukkan penguasaan yang baik dalam ";
    const pembukaBimbingan = currentPembukaBimbingan || " perlu bimbingan dalam ";

    if (deskripsiTercapaiList.length > 0) { finalDescription += namaSiswa + pembukaTercapai + deskripsiTercapaiList.join(', '); }
    if (deskripsiBimbinganList.length > 0) { finalDescription += (finalDescription !== "" ? ", namun" : namaSiswa + " ") + pembukaBimbingan + deskripsiBimbinganList.join(', '); }
    if (finalDescription !== "") finalDescription += ".";

    finalDescriptionInput.value = finalDescription.trim();

    // Atur status readonly dan placeholder (Sama)
    if (!isAnyCpSelected && !isMulokActive) {
        finalDescriptionInput.placeholder = "Pilih status capaian pada CP di atas...";
        finalDescriptionInput.readOnly = true;
    } else if (!isMulokActive) { // Hanya kunci jika BUKAN Mulok dan TIDAK ada CP dipilih
        finalDescriptionInput.placeholder = "Deskripsi rapor...";
        finalDescriptionInput.readOnly = false; // Selalu bisa diedit jika ada CP terpilih atau Mulok
    }

    // --- BARU: Validasi Tombol Simpan ---
    validateAndToggleButton();
    // --- AKHIR BARU ---
}

/**
 * (DIPERBARUI) Reset deskripsi akhir, nilai, DAN validasi tombol
 */
 function resetFinalDescriptionAndGrade() {
    if(finalDescriptionInput) { finalDescriptionInput.value = ''; finalDescriptionInput.readOnly = true; finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis..."; }
    if(nilaiAkhirInput) { nilaiAkhirInput.value = ''; nilaiAkhirInput.disabled = true; } // Tetap disabled di awal
    currentSelectedCpStatuses = {};
    // --- BARU: Nonaktifkan tombol simpan saat reset ---
    if (simpanNilaiBtn) simpanNilaiBtn.disabled = true;
    // --- AKHIR BARU ---
 }

/**
 * Reset status Mulok
 */
function resetMulok() {
    isMulokActive = false;
    if (mulokIndicator) mulokIndicator.style.display = 'none';
    if (!isMulokActive && finalDescriptionInput) { finalDescriptionInput.readOnly = true; finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis..."; }
    // Tampilkan tombol edit jika tidak Mulok (dan ada CP nanti)
     if (editDeskripsiBtn) editDeskripsiBtn.style.display = 'block'; // Atau 'inline-block'
}


// --- Fungsi-fungsi Halaman Data Siswa ---
function handleDownloadTemplate() {
    showNotification("Membuat template...", "info");
    const payload = { action: "handleSiswaActions", subAction: "getSiswaTemplate", spreadsheetId: user.spreadsheetId };
    fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } })
    .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
    .then(data => { if (data.success) { hideNotification(); const blob = new Blob([data.template], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", "template_siswa.csv"); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); } else { showNotification("Gagal: " + (data.message || "Error"), "error"); } })
    .catch(error => { hideNotification(); console.error("DL template error:", error); showNotification("Jaringan error.", "error"); });
}
function handleImportCSV(event) {
    const file = event.target.files[0]; if (!file) return; showNotification("Membaca CSV...", "info");
    const reader = new FileReader();
    reader.onload = (e) => { try { const text = e.target.result; const data = parseCSV(text); if (!data || data.length === 0) { showNotification("CSV kosong/format salah.", "warning"); return; } uploadSiswaData(data); } catch (err) { console.error("CSV Parse error:", err); showNotification("Gagal baca CSV: " + err.message, "error"); } };
    reader.onerror = () => { console.error("FileReader error:", reader.error); showNotification("Gagal baca file.", "error"); }; reader.readAsText(file); event.target.value = null;
}
function parseCSV(text) { // Versi robust
    const lines = text.split(/[\r\n]+/).filter(l => l.trim() !== ''); if (lines.length < 2) return [];
    const parseLine = (line) => { const v = []; let c = ''; let q = false; for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"') { if (q && line[i + 1] === '"') { c += '"'; i++; } else { q = !q; } } else if (char === ',' && !q) { v.push(c.trim()); c = ''; } else { c += char; } } v.push(c.trim()); return v; };
    const headers = parseLine(lines[0]).map(h => h.toLowerCase()); const data = [];
    const expected = ["nisn", "nis", "nama_siswa", "tempat_lahir", "tanggal_lahir", "jenis_kelamin", "agama", "kelas", "fase", "tahun_ajaran_masuk", "nama_ayah", "pekerjaan_ayah", "nama_ibu", "pekerjaan_ibu", "alamat_siswa", "asal_sekolah", "nama_wali", "alamat_orang_tua"];
    let headerMap = {}; let missing = []; expected.forEach(eh => { const i = headers.indexOf(eh); if (i === -1) missing.push(eh); else headerMap[eh] = i; });
    if (missing.length > 0) console.warn("CSV headers missing:", missing);
    for (let i = 1; i < lines.length; i++) { const values = parseLine(lines[i]); if (values.length >= headers.length) { let obj = {}; expected.forEach(eh => { const index = headerMap[eh]; obj[eh] = (index !== undefined && index < values.length) ? values[index] : null; }); if (obj.nama_siswa || obj.nisn || obj.nis) data.push(obj); } else console.warn(`Skip line ${i+1}`); } return data;
}
function uploadSiswaData(siswaDataArray) {
    showNotification(`Mengimpor ${siswaDataArray.length} siswa...`, "info");
    const payload = { action: "handleSiswaActions", subAction: "importSiswa", spreadsheetId: user.spreadsheetId, data: siswaDataArray };
    fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } })
    .then(response => response.ok ? response.json() : Promise.reject(`HTTP ${response.status}`))
    .then(data => { if (data.success) { showNotification(data.message, "success"); loadInitialData(); } else { showNotification("Gagal impor: " + (data.message || "Error"), "error"); } })
    .catch(error => { console.error("Import error:", error); showNotification("Jaringan error.", "error"); });
}
function loadSiswaList() {
    if (!siswaTableBody) { console.warn("#siswa-table-body missing."); return; }
    if (toggleSiswaListBtn) toggleSiswaListBtn.style.display = 'none'; if (siswaTableContainer) siswaTableContainer.classList.remove('is-expanded'); if (toggleSiswaListBtn) toggleSiswaListBtn.innerText = 'Tampilkan Semua Siswa';
    if (allSiswaData && allSiswaData.length > 0) {
        siswaTableBody.innerHTML = '';
        allSiswaData.forEach(siswa => {
            const tr = document.createElement('tr'); let tglLahir = 'N/A';
            if (siswa.tanggal_lahir) { try { const d = new Date(siswa.tanggal_lahir); if (!isNaN(d.getTime())) tglLahir = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }); else tglLahir = siswa.tanggal_lahir; } catch(e){ tglLahir = siswa.tanggal_lahir; } }
            tr.innerHTML = `<td>${siswa.nisn||'N/A'}</td><td>${siswa.nama_siswa||'N/A'}</td><td>${siswa.kelas||'N/A'}</td><td>${tglLahir}</td><td><a href="#" class="edit-btn" data-siswa-id="${siswa.id_siswa||''}">Edit</a></td>`;
            siswaTableBody.appendChild(tr);
        });
        if (allSiswaData.length > 3 && toggleSiswaListBtn) { toggleSiswaListBtn.style.display = 'block'; }
    } else { siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data siswa.</td></tr>`; }
}


/**
 * Simpan Nilai & Deskripsi Akhir (handle Mulok) - SAMA DENGAN V2
 */
function handleSimpanNilai() {
    const id_kelas = selectKelas ? selectKelas.value : null; const id_siswa = selectSiswa ? selectSiswa.value : null; const id_mapel = selectMapel ? selectMapel.value : null;
    const nilai_akhir = nilaiAkhirInput ? nilaiAkhirInput.value : null; const deskripsi_rapor = finalDescriptionInput ? finalDescriptionInput.value : '';

    if (!id_kelas || !id_siswa || !id_mapel || nilai_akhir === null || nilai_akhir === undefined) { showNotification("Kelas, Siswa, Mapel, & Nilai Akhir wajib!", "warning"); return; }
    const nilaiNum = parseFloat(nilai_akhir); if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) { showNotification("Nilai Akhir 0-100.", "warning"); return; }

    let id_cp_tp_tosend = null; const hasSelectedCp = Object.keys(currentSelectedCpStatuses).filter(k => k !== 'MULOK').length > 0;
    if (isMulokActive) { id_cp_tp_tosend = null; if (!deskripsi_rapor) { showNotification("Deskripsi Mulok wajib.", "warning"); return; } }
    else if (hasSelectedCp) { id_cp_tp_tosend = 'REKAP'; if (!deskripsi_rapor) { if (!confirm("Deskripsi kosong. Yakin simpan?")) return; } }
    else { if (!confirm("Tidak ada CP dipilih. Simpan nilai akhir saja?")) return; }

    showNotification("Menyimpan...", "info"); if(simpanNilaiBtn) simpanNilaiBtn.disabled = true;

    const payload = { action: "saveNilaiCp", spreadsheetId: user.spreadsheetId, id_kelas, id_siswa, id_mapel, id_cp_tp: id_cp_tp_tosend, nilai: nilaiNum, deskripsi_tercapai: deskripsi_rapor, deskripsi_perlu_bimbingan: "" };

    fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } })
    .then(response => { if (!response.ok) throw new Error(`Server status ${response.status}`); return response.json(); })
    .then(data => { if (data.success) { showNotification(data.message, "success"); resetFinalDescriptionAndGrade(); if (cpSelectionList) cpSelectionList.innerHTML = '<p>...</p>'; if (isMulokActive) resetMulok(); } else { showNotification("Gagal: " + (data.message || "Error"), "error"); console.error("Save error:", data.message); } })
    .catch(error => { console.error("Save fetch error:", error); showNotification(`Jaringan error: ${error.message}.`, "error"); })
    .finally(() => { if(simpanNilaiBtn) simpanNilaiBtn.disabled = false; });
}
