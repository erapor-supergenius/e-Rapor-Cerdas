/* === e-Rapor Cerdas - Dashboard Script (Final V3 + Perbaikan Validasi) === */

// !!! PENTING !!! PASTIKAN INI ADALAH URL DARI "DATABASE ADMIN v2" ANDA !!!
const GAS_URL = "https://script.google.com/macros/s/AKfycby-empDcPt5BndGZnjLNyTKt9wbMIP3iRtvoQELdWWoOvZnu2om_Uoh9Zsj5I0Wdq7ZLw/exec"; // <-- GANTI JIKA URL ANDA BERBEDA

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
const editDeskripsiBtn = document.getElementById('edit-deskripsi-btn'); // Tombol edit lama

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
             else { // Fallback jika page-home tidak ada, aktifkan yg pertama
                if (navLinks.length > 0) {
                    const firstLinkId = navLinks[0].getAttribute('data-page');
                    const firstPage = firstLinkId ? document.getElementById(firstLinkId) : null;
                    if (firstLinkId && firstPage) {
                         navLinks[0].classList.add('active');
                         firstPage.classList.add('active');
                    }
                }
             }
        } else console.error(".nav-link or .content-page missing.");

        // 4. MEMUAT DATA AWAL
        loadInitialData();

        // 5. LOGIKA HALAMAN DATA SISWA
        if (downloadTemplateBtn) downloadTemplateBtn.addEventListener('click', handleDownloadTemplate);
        if (importCsvBtn && csvFileInput) importCsvBtn.addEventListener('click', () => csvFileInput.click());
        if (csvFileInput) csvFileInput.addEventListener('change', handleImportCSV);

        // 6. LOGIKA DROPDOWN FILTER INPUT NILAI + PANGGIL VALIDASI
        if (selectKelas) { selectKelas.addEventListener('change', (e) => { handleKelasChange(e); validateAndToggleButton(); }); } else console.warn("#pilih-kelas missing.");
        if (selectMapel) { selectMapel.addEventListener('change', (e) => { handleMapelChange(e); validateAndToggleButton(); }); } else console.warn("#pilih-mapel missing.");
        if (selectAgama) { selectAgama.addEventListener('change', (e) => { handleAgamaChange(e); validateAndToggleButton(); }); } else console.warn("#pilih-agama missing.");
        // -- BARU: Event listener untuk input nilai akhir --
        if (nilaiAkhirInput) {
            nilaiAkhirInput.addEventListener('input', validateAndToggleButton);
        } else console.warn("#nilai-akhir-input missing.");
        // -- AKHIR BARU --

        // 7. Event Listener Dropdown Kalimat Pembuka
        if (selectPembukaTercapai && inputCustomTercapai) { selectPembukaTercapai.addEventListener('change', handlePembukaTercapaiChange); inputCustomTercapai.addEventListener('input', handleCustomTercapaiInput); } else console.warn("Phrase elements (Tercapai) missing.");
        if (selectPembukaBimbingan && inputCustomBimbingan) { selectPembukaBimbingan.addEventListener('change', handlePembukaBimbinganChange); inputCustomBimbingan.addEventListener('input', handleCustomBimbinganInput); } else console.warn("Phrase elements (Bimbingan) missing.");

        // 8. LOGIKA TOMBOL TAMPILKAN SEMUA SISWA
        if (toggleSiswaListBtn && siswaTableContainer) { toggleSiswaListBtn.addEventListener('click', (e) => { e.preventDefault(); const isExpanded = siswaTableContainer.classList.toggle('is-expanded'); toggleSiswaListBtn.innerText = isExpanded ? 'Sembunyikan' : 'Tampilkan Semua Siswa'; }); }
        else console.warn("#toggle-siswa-list or .data-table-container missing.");

        // 9. LOGIKA TOMBOL SIMPAN NILAI
        if (simpanNilaiBtn && formInputNilai) {
             // Nonaktifkan tombol simpan di awal
             simpanNilaiBtn.disabled = true;
             simpanNilaiBtn.addEventListener('click', (e) => { e.preventDefault(); handleSimpanNilai(); });
        } else console.error("#simpan-nilai-btn or #form-input-nilai missing.");

         // 10. (Opsional) Tombol Edit Deskripsi jika masih ada
         if (editDeskripsiBtn && finalDescriptionInput) {
             editDeskripsiBtn.addEventListener('click', () => {
                 finalDescriptionInput.readOnly = false;
                 editDeskripsiBtn.disabled = true;
                 showNotification("Deskripsi rapor bisa diedit manual.", "info");
                 finalDescriptionInput.focus();
             });
             editDeskripsiBtn.style.display = 'none'; // Sembunyikan by default, hanya muncul jika ada CP
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
            // Set default kalimat pembuka dari opsi pertama yg dimuat
            currentPembukaTercapai = selectPembukaTercapai && selectPembukaTercapai.options.length > 1 ? selectPembukaTercapai.options[0].value : " menunjukkan penguasaan yang baik dalam ";
            currentPembukaBimbingan = selectPembukaBimbingan && selectPembukaBimbingan.options.length > 1 ? selectPembukaBimbingan.options[0].value : " perlu bimbingan dalam ";

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
        hideNotification(); console.error("Initial load fetch error:", error);
        showNotification(`Jaringan error: ${error.message}.`, "error");
        // Nonaktifkan form jika gagal load
        if (formInputNilai) { formInputNilai.style.opacity = '0.5'; formInputNilai.style.pointerEvents = 'none'; const els = formInputNilai.elements; for(let el of els) el.disabled = true; }
    });
}

/**
 * Memuat opsi dropdown kalimat pembuka
 */
function loadPembukaOptions(selectElement, optionsArray) {
    if (!selectElement) return;
    const customOption = selectElement.querySelector('option[value="custom"]');
    selectElement.innerHTML = ''; // Hapus placeholder "Memuat..."

    if (optionsArray && optionsArray.length > 0) {
        optionsArray.forEach((frasa, index) => {
            const trimmedFrasa = frasa.trim();
            // Value pakai spasi, Text tidak
             const option = new Option(trimmedFrasa, ` ${trimmedFrasa} `);
             selectElement.add(option);
             if (index === 0) option.selected = true; // Pilih opsi pertama
        });
    } else {
        selectElement.add(new Option("-- Tidak ada pilihan --", "")); // Fallback
    }
    // Tambahkan kembali opsi custom
    if (customOption) selectElement.add(customOption);
    else selectElement.add(new Option("-- Tulis Manual --", "custom"));
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

    if (cpTpFiltered.length === 0) { // --- MULOK ---
        isMulokActive = true; cpSelectionList.innerHTML = `<p style="color: #6c757d;"><i>Tidak ada CP. Input manual Mulok aktif.</i></p>`;
        if (mulokIndicator) mulokIndicator.style.display = 'inline';
        if(finalDescriptionInput) { finalDescriptionInput.readOnly = false; finalDescriptionInput.placeholder = "Input deskripsi Mulok..."; }
        if(nilaiAkhirInput) nilaiAkhirInput.disabled = false;
        currentSelectedCpStatuses['MULOK'] = { isMulok: true };
        if (editDeskripsiBtn) editDeskripsiBtn.style.display = 'none';
        validateAndToggleButton(); // Panggil validasi untuk Mulok
    } else { // --- ADA CP ---
        isMulokActive = false; if (mulokIndicator) mulokIndicator.style.display = 'none';
        if(finalDescriptionInput) { finalDescriptionInput.readOnly = true; finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis..."; }
        if(nilaiAkhirInput) nilaiAkhirInput.disabled = false;
        if (editDeskripsiBtn) { editDeskripsiBtn.style.display = 'block'; editDeskripsiBtn.disabled = true; }

        cpTpFiltered.forEach(cp => {
            const cpId = cp.id_cp_tp; if (!cpId) return;
            const itemDiv = document.createElement('div'); itemDiv.classList.add('cp-item');
            const tercapaiId = `cp_${cpId}_tercapai`; const bimbinganId = `cp_${cpId}_bimbingan`;
            itemDiv.innerHTML = `<div class="cp-item-header">${cp.deskripsi || '[No TP Desc]'}</div> <div class="cp-item-options"> <label for="${tercapaiId}"><input type="checkbox" id="${tercapaiId}" name="cp_status_${cpId}" value="Tercapai" data-cp-id="${cpId}" data-status="Tercapai"> Tercapai</label> <label for="${bimbinganId}"><input type="checkbox" id="${bimbinganId}" name="cp_status_${cpId}" value="Perlu Bimbingan" data-cp-id="${cpId}" data-status="Perlu Bimbingan"> P. Bimbingan</label> </div>`;
            cpSelectionList.appendChild(itemDiv);
            const checkboxes = itemDiv.querySelectorAll(`input[name="cp_status_${cpId}"]`);
            checkboxes.forEach(cb => { cb.addEventListener('change', (e) => handleCpCheckboxChange(e.target, cpId, checkboxes)); });
        });
        validateAndToggleButton(); // Panggil validasi setelah CP dimuat
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
}

/**
 * (DIPERBARUI) Membuat Deskripsi Naratif Akhir SELALU dengan "Ananda [Nama Siswa]"
 */
function generateFinalDescription() {
    if (!finalDescriptionInput || !allCpTpData) return;

    let deskripsiTercapaiList = [], deskripsiBimbinganList = [], isAnyCpSelected = false;

    if (isMulokActive) {
        finalDescriptionInput.readOnly = false; finalDescriptionInput.placeholder = "Input deskripsi Mulok..."; isAnyCpSelected = true;
    } else {
        for (const cpId in currentSelectedCpStatuses) {
            if (cpId === 'MULOK') continue; isAnyCpSelected = true;
            const status = currentSelectedCpStatuses[cpId]; const cpData = allCpTpData.find(cp => cp.id_cp_tp === cpId);
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

    // Hanya generate jika bukan Mulok
    if (!isMulokActive) {
        let finalDescription = "";
        const siswaSelectedIndex = selectSiswa ? selectSiswa.selectedIndex : -1;
        // Ambil nama siswa, JANGAN default ke "Ananda" lagi
        const namaSiswa = siswaSelectedIndex > 0 && selectSiswa.options.length > siswaSelectedIndex
                        ? selectSiswa.options[siswaSelectedIndex].text : ""; // Kosongkan jika belum dipilih

        const pembukaTercapai = currentPembukaTercapai || " menunjukkan penguasaan yang baik dalam ";
        const pembukaBimbingan = currentPembukaBimbingan || " perlu bimbingan dalam ";

        // --- PERUBAHAN DI SINI ---
        // Selalu tambahkan "Ananda " di depan, baru nama siswa (jika ada)
        const prefixNama = namaSiswa ? `Ananda ${namaSiswa}` : "Ananda";
        // --- AKHIR PERUBAHAN ---

        if (deskripsiTercapaiList.length > 0) {
            // Gunakan prefixNama
            finalDescription += prefixNama + pembukaTercapai + deskripsiTercapaiList.join(', ');
        }

        if (deskripsiBimbinganList.length > 0) {
            if (finalDescription !== "") { // Jika sudah ada tercapai
                finalDescription += ", namun" + pembukaBimbingan + deskripsiBimbinganList.join(', ');
            } else { // Jika hanya perlu bimbingan
                // Gunakan prefixNama
                finalDescription += prefixNama + " " + pembukaBimbingan + deskripsiBimbinganList.join(', ');
            }
        }

        if (finalDescription !== "") finalDescription += ".";
        finalDescriptionInput.value = finalDescription.trim();
    }


    // Atur status readonly dan placeholder (Sama)
    if (!isAnyCpSelected && !isMulokActive) {
        finalDescriptionInput.placeholder = "Pilih status capaian pada CP di atas...";
        finalDescriptionInput.readOnly = true;
         if (editDeskripsiBtn) editDeskripsiBtn.disabled = true;
    } else {
        finalDescriptionInput.placeholder = isMulokActive ? "Input deskripsi Mulok..." : "Deskripsi rapor...";
        finalDescriptionInput.readOnly = false;
         if (editDeskripsiBtn) editDeskripsiBtn.disabled = isMulokActive;
    }

    // Validasi tombol simpan setelah deskripsi di-generate/diubah
    validateAndToggleButton();
}

/**
 * Reset deskripsi akhir, nilai, DAN validasi tombol
 */
 function resetFinalDescriptionAndGrade() {
    if(finalDescriptionInput) { finalDescriptionInput.value = ''; finalDescriptionInput.readOnly = true; finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis..."; }
    if(nilaiAkhirInput) { nilaiAkhirInput.value = ''; nilaiAkhirInput.disabled = true; }
    currentSelectedCpStatuses = {};
    if (editDeskripsiBtn) editDeskripsiBtn.disabled = true;
    // Nonaktifkan tombol simpan saat reset
    if (simpanNilaiBtn) simpanNilaiBtn.disabled = true;
 }

/**
 * Reset status Mulok
 */
function resetMulok() {
    isMulokActive = false;
    if (mulokIndicator) mulokIndicator.style.display = 'none';
    if (!isMulokActive && finalDescriptionInput) { finalDescriptionInput.readOnly = true; finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis..."; }
    // Tampilkan tombol edit jika tidak Mulok
     if (editDeskripsiBtn) editDeskripsiBtn.style.display = 'block';
}

/**
 * (FUNGSI BARU) Validasi input form dan aktifkan/nonaktifkan tombol simpan
 */
function validateAndToggleButton() {
    if (!simpanNilaiBtn) return;

    const id_kelas = selectKelas ? selectKelas.value : null;
    const id_siswa = selectSiswa ? selectSiswa.value : null;
    const id_mapel = selectMapel ? selectMapel.value : null;
    const id_agama = selectAgama ? selectAgama.value : null;
    const nilai_akhir = nilaiAkhirInput ? nilaiAkhirInput.value : null;
    const deskripsi_rapor = finalDescriptionInput ? finalDescriptionInput.value : '';
    const hasSelectedCp = Object.keys(currentSelectedCpStatuses).filter(k => k !== 'MULOK').length > 0;

    let isValid = true;

    // Cek field wajib dasar
    if (!id_kelas || !id_siswa || !id_mapel || !id_agama) {
        isValid = false;
    }

    // Cek nilai akhir (harus angka 0-100)
    const nilaiNum = parseFloat(nilai_akhir);
    if (nilai_akhir === null || nilai_akhir === '' || isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
        isValid = false;
    }

    // Cek deskripsi (Jika Mulok, wajib diisi)
    if (isMulokActive && !deskripsi_rapor.trim()) {
        isValid = false;
    }
    // Jika BUKAN Mulok, setidaknya harus ada CP dipilih ATAU deskripsi diisi manual (jika user edit)
    // Tapi kita biarkan kosong jika user memang sengaja hapus, validasi di handleSimpanNilai
    if (!isMulokActive && !hasSelectedCp && !deskripsi_rapor.trim()) {
        // isValid = false; // Jangan blok simpan jika memang tidak ada CP & user tidak edit
    }


    // Aktifkan/nonaktifkan tombol berdasarkan validitas
    simpanNilaiBtn.disabled = !isValid;
}


// --- Fungsi-fungsi Halaman Data Siswa ---
function handleDownloadTemplate() {
    showNotification("Membuat template...", "info"); const payload = { action: "handleSiswaActions", subAction: "getSiswaTemplate", spreadsheetId: user.spreadsheetId }; fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } }).then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)).then(d => { if (d.success) { hideNotification(); const b = new Blob([d.template],{type:'text/csv;charset=utf-8;'}); const l = document.createElement("a"); const u = URL.createObjectURL(b); l.setAttribute("href", u); l.setAttribute("download", "template_siswa.csv"); l.style.visibility='hidden'; document.body.appendChild(l); l.click(); document.body.removeChild(l); URL.revokeObjectURL(u); } else { showNotification("Gagal: " + (d.message||"Error"), "error"); } }).catch(e => { hideNotification(); console.error("DL template err:", e); showNotification("Jaringan error.", "error"); });
}
function handleImportCSV(event) {
    const file = event.target.files[0]; if (!file) return; showNotification("Membaca CSV...", "info"); const reader = new FileReader(); reader.onload = (e) => { try { const text = e.target.result; const data = parseCSV(text); if (!data || data.length === 0) { showNotification("CSV kosong/format salah.", "warning"); return; } uploadSiswaData(data); } catch (err) { console.error("CSV Parse err:", err); showNotification("Gagal baca CSV: " + err.message, "error"); } }; reader.onerror = () => { console.error("FileReader err:", reader.error); showNotification("Gagal baca file.", "error"); }; reader.readAsText(file); event.target.value = null;
}
function parseCSV(text) { // Versi robust
    const lines = text.split(/[\r\n]+/).filter(l => l.trim() !== ''); if (lines.length < 2) return []; const parseLine = (line) => { const v = []; let c = ''; let q = false; for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"') { if (q && line[i + 1] === '"') { c += '"'; i++; } else { q = !q; } } else if (char === ',' && !q) { v.push(c.trim()); c = ''; } else { c += char; } } v.push(c.trim()); return v; }; const headers = parseLine(lines[0]).map(h => h.toLowerCase()); const data = []; const expected = ["nisn", "nis", "nama_siswa", "tempat_lahir", "tanggal_lahir", "jenis_kelamin", "agama", "kelas", "fase", "tahun_ajaran_masuk", "nama_ayah", "pekerjaan_ayah", "nama_ibu", "pekerjaan_ibu", "alamat_siswa", "asal_sekolah", "nama_wali", "alamat_orang_tua"]; let headerMap = {}; let missing = []; expected.forEach(eh => { const i = headers.indexOf(eh); if (i === -1) missing.push(eh); else headerMap[eh] = i; }); if (missing.length > 0) console.warn("CSV headers missing:", missing); for (let i = 1; i < lines.length; i++) { const values = parseLine(lines[i]); if (values.length >= headers.length) { let obj = {}; expected.forEach(eh => { const index = headerMap[eh]; obj[eh] = (index !== undefined && index < values.length) ? values[index] : null; }); if (obj.nama_siswa || obj.nisn || obj.nis) data.push(obj); } else console.warn(`Skip line ${i+1}`); } return data;
}
function uploadSiswaData(siswaDataArray) {
    showNotification(`Mengimpor ${siswaDataArray.length} siswa...`, "info"); const payload = { action: "handleSiswaActions", subAction: "importSiswa", spreadsheetId: user.spreadsheetId, data: siswaDataArray }; fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } }).then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)).then(d => { if (d.success) { showNotification(d.message, "success"); loadInitialData(); } else { showNotification("Gagal impor: " + (d.message || "Error"), "error"); } }).catch(e => { console.error("Import error:", e); showNotification("Jaringan error.", "error"); });
}
function loadSiswaList() {
    if (!siswaTableBody) { console.warn("#siswa-table-body missing."); return; } if (toggleSiswaListBtn) toggleSiswaListBtn.style.display = 'none'; if (siswaTableContainer) siswaTableContainer.classList.remove('is-expanded'); if (toggleSiswaListBtn) toggleSiswaListBtn.innerText = 'Tampilkan Semua Siswa';
    if (allSiswaData && allSiswaData.length > 0) {
        siswaTableBody.innerHTML = ''; allSiswaData.forEach(siswa => { const tr = document.createElement('tr'); let tglLahir = 'N/A'; if (siswa.tanggal_lahir) { try { const d = new Date(siswa.tanggal_lahir); if (!isNaN(d.getTime())) tglLahir = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }); else tglLahir = siswa.tanggal_lahir; } catch(e){ tglLahir = siswa.tanggal_lahir; } } tr.innerHTML = `<td>${siswa.nisn||'N/A'}</td><td>${siswa.nama_siswa||'N/A'}</td><td>${siswa.kelas||'N/A'}</td><td>${tglLahir}</td><td><a href="#" class="edit-btn" data-siswa-id="${siswa.id_siswa||''}">Edit</a></td>`; siswaTableBody.appendChild(tr); });
        if (allSiswaData.length > 3 && toggleSiswaListBtn) { toggleSiswaListBtn.style.display = 'block'; }
    } else { siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data siswa.</td></tr>`; }
}


/**
 * Simpan Nilai & Deskripsi Akhir (handle Mulok) - Dengan Validasi & Error Handling
 */
function handleSimpanNilai() {
    const id_kelas = selectKelas ? selectKelas.value : null; const id_siswa = selectSiswa ? selectSiswa.value : null; const id_mapel = selectMapel ? selectMapel.value : null;
    const nilai_akhir = nilaiAkhirInput ? nilaiAkhirInput.value : null; const deskripsi_rapor = finalDescriptionInput ? finalDescriptionInput.value : '';

    // Validasi Awal
    if (!id_kelas || !id_siswa || !id_mapel || nilai_akhir === null || nilai_akhir === undefined) { showNotification("Kelas, Siswa, Mapel, & Nilai Akhir wajib!", "warning"); return; }
    const nilaiNum = parseFloat(nilai_akhir); if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) { showNotification("Nilai Akhir 0-100.", "warning"); return; }
    if (isMulokActive && !deskripsi_rapor.trim()) { showNotification("Deskripsi Mulok wajib.", "warning"); return; }

    const hasSelectedCp = Object.keys(currentSelectedCpStatuses).filter(k => k !== 'MULOK').length > 0;
    if (!isMulokActive && !deskripsi_rapor.trim() && hasSelectedCp) { if (!confirm("Deskripsi rapor kosong. Yakin simpan?")) return; }
    // Tambahkan konfirmasi jika tidak ada CP dipilih sama sekali (bukan Mulok)
     if (!isMulokActive && !hasSelectedCp) {
         if (!confirm("Tidak ada CP dipilih. Hanya simpan nilai akhir? Deskripsi akan kosong.")) return;
     }

    showNotification("Menyimpan...", "info"); if(simpanNilaiBtn) simpanNilaiBtn.disabled = true;

    let id_cp_tp_tosend = null;
    if (isMulokActive) { id_cp_tp_tosend = null; } // Backend akan generate ID Mulok
    else if (hasSelectedCp) { id_cp_tp_tosend = 'REKAP'; } // Kirim 'REKAP' jika ada CP dipilih

    const payload = { action: "saveNilaiCp", spreadsheetId: user.spreadsheetId, id_kelas, id_siswa, id_mapel, id_cp_tp: id_cp_tp_tosend, nilai: nilaiNum, deskripsi_tercapai: deskripsi_rapor.trim(), deskripsi_perlu_bimbingan: "" };

    fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } })
    .then(response => {
        if (!response.ok) {
             return response.text().then(text => { let errMsg = `Server error (${response.status})`; try { const errData = JSON.parse(text); if (errData && errData.message) errMsg += `: ${errData.message}`; } catch(e){} throw new Error(errMsg); });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification(data.message || "Berhasil disimpan.", "success");
            resetFinalDescriptionAndGrade();
            if (cpSelectionList) cpSelectionList.innerHTML = '<p style="color: #6c757d;"><i>Pilih kelas, mapel, dan agama...</i></p>';
            if (isMulokActive) resetMulok();
            if(selectSiswa) selectSiswa.selectedIndex = 0; // Reset siswa
            validateAndToggleButton(); // Pastikan tombol nonaktif setelah reset
        } else {
             showNotification("Gagal menyimpan: " + (data.message || "Error server."), "error"); console.error("Server save error:", data.message);
        }
    })
    .catch(error => { console.error("Save fetch/parse error:", error); showNotification(`Gagal menyimpan: ${error.message}.`, "error"); })
    .finally(() => {
        // Jangan aktifkan tombol di sini, biarkan validateAndToggleButton yg mengatur
        // if(simpanNilaiBtn) simpanNilaiBtn.disabled = false;
         validateAndToggleButton(); // Cek ulang validasi
    });
}
