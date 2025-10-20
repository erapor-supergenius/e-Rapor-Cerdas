/* === e-Rapor Cerdas - Dashboard Script (Final V3.1 + Fix Input Nilai & Deskripsi Aktif) === */

// !!! PENTING !!! PASTIKAN INI ADALAH URL DARI "DATABASE ADMIN v2" ANDA !!!
const GAS_URL = "https://script.google.com/macros/s/AKfycbw1Jc7JXssFYq_KMQ6Up34zBGm4XYyOEEORsCeJI7DwJfG-xj3mGY930FbU5a5c5ZCJew/exec"; // <-- GANTI JIKA URL ANDA BERBEDA

// --- Variabel Global ---
let user = {};
let allKelasData = [], allSiswaData = [], allCpTpData = [], allAgamaData = [];
let allFrasaTercapai = [], allFrasaBimbingan = [];
let currentFase = null, isMulokActive = false;
let currentSelectedCpStatuses = {};
let currentPembukaTercapai = "", currentPembukaBimbingan = "";

// --- Elemen Form & Notifikasi ---
const notificationToast = document.getElementById('notification-toast');
const notificationMessage = document.getElementById('notification-toast-message');
const notificationClose = document.getElementById('notification-toast-close');
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
const editDeskripsiBtn = document.getElementById('edit-deskripsi-btn');

// --- Elemen Data Siswa ---
const downloadTemplateBtn = document.getElementById('download-template-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const csvFileInput = document.getElementById('csv-file-input');
const siswaTableBody = document.getElementById('siswa-table-body');
const toggleSiswaListBtn = document.getElementById('toggle-siswa-list');
const siswaTableContainer = document.querySelector('.data-table-container');

// --- Notifikasi ---
function showNotification(message, type = 'info') { if (!notificationToast || !notificationMessage) return; notificationMessage.innerText = message; notificationToast.className = 'notification-toast'; notificationToast.classList.add(type); notificationToast.style.display = 'flex'; if (notificationToast.timer) clearTimeout(notificationToast.timer); notificationToast.timer = setTimeout(() => { hideNotification(); }, 5000); }
function hideNotification() { if (!notificationToast) return; notificationToast.style.display = 'none'; if (notificationToast.timer) clearTimeout(notificationToast.timer); notificationToast.timer = null; } // Ditambahkan reset timer
if (notificationClose) notificationClose.addEventListener('click', hideNotification);

// --- Saat DOM Siap ---
document.addEventListener("DOMContentLoaded", () => {
    try {
        // 1. Otentikasi
        user.name = localStorage.getItem('userName');
        user.spreadsheetId = localStorage.getItem('spreadsheetId');
        user.username = localStorage.getItem('userUsername');
        console.log("Auth Check >> Spreadsheet ID:", user.spreadsheetId); // Log ID
        if (!user.name || !user.spreadsheetId || !user.username) {
             console.error("Auth Check >> Gagal:", user); // Log detail jika gagal
             alert("Sesi berakhir atau data tidak lengkap. Login ulang.");
             window.location.href = 'index.html'; return;
        }
        console.log("Auth Check >> Berhasil."); // Log jika berhasil
        document.getElementById('welcome-message').innerText = `Selamat Datang, ${user.name}!`;

        // 2. Logout
        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) logoutBtn.addEventListener('click', (e) => { // Tambahkan parameter 'e'
            e.preventDefault(); // Mencegah aksi default jika <a>
            if (confirm("Yakin logout?")) { localStorage.clear(); window.location.href = 'index.html'; }
        });

        // 3. Navigasi
        const navLinks = document.querySelectorAll('.nav-link');
        const contentPages = document.querySelectorAll('.content-page');
        if (navLinks.length && contentPages.length) {
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetPageId = link.dataset.page; // Ambil ID halaman dari data-page
                    if (!targetPageId) return; // Lewati jika tidak ada data-page
                    navLinks.forEach(n => n.classList.remove('active'));
                    contentPages.forEach(p => p.classList.remove('active'));
                    link.classList.add('active');
                    const page = document.getElementById(targetPageId); // Cari elemen berdasarkan ID
                    if (page) {
                        page.classList.add('active');
                        // Load data siswa jika halaman data siswa dibuka
                        if (targetPageId === 'page-data-siswa') {
                            loadSiswaList();
                        }
                    } else {
                        console.error(`Halaman dengan ID '${targetPageId}' tidak ditemukan.`);
                    }
                });
            });
             // Aktifkan default page (misal: page-home)
             const defaultLink = document.querySelector('.nav-link[data-page="page-home"]');
             const defaultPage = document.getElementById('page-home');
             if (defaultLink && defaultPage) { defaultLink.click(); } // Panggil klik agar logic jalan
        }

        // 4. Load Data Awal
        loadInitialData();

        // 5. Event Listener Halaman Data Siswa
        if (downloadTemplateBtn) downloadTemplateBtn.addEventListener('click', handleDownloadTemplate);
        if (importCsvBtn && csvFileInput) importCsvBtn.addEventListener('click', () => csvFileInput.click());
        if (csvFileInput) csvFileInput.addEventListener('change', handleImportCSV);
        if (toggleSiswaListBtn && siswaTableContainer) { toggleSiswaListBtn.addEventListener('click', (e) => { e.preventDefault(); const isExpanded = siswaTableContainer.classList.toggle('is-expanded'); toggleSiswaListBtn.innerText = isExpanded ? 'Sembunyikan' : 'Tampilkan Semua Siswa'; }); }

        // 6. Event Dropdown & Input Form Nilai
        if (selectKelas) selectKelas.addEventListener('change', (e) => { handleKelasChange(e); validateAndToggleButton(); });
        if (selectMapel) selectMapel.addEventListener('change', (e) => { handleMapelChange(e); validateAndToggleButton(); });
        if (selectAgama) selectAgama.addEventListener('change', (e) => { handleAgamaChange(e); validateAndToggleButton(); });
        if (selectSiswa) selectSiswa.addEventListener('change', validateAndToggleButton); // ✅ Listener untuk siswa
        if (nilaiAkhirInput) nilaiAkhirInput.addEventListener('input', validateAndToggleButton);

        // 7. Tombol Simpan Nilai
        if (simpanNilaiBtn) {
            simpanNilaiBtn.disabled = true;
            simpanNilaiBtn.addEventListener('click', (e) => { e.preventDefault(); handleSimpanNilai(); });
        }

        // 8. Kalimat Pembuka
        if (selectPembukaTercapai && inputCustomTercapai) { selectPembukaTercapai.addEventListener('change', handlePembukaTercapaiChange); inputCustomTercapai.addEventListener('input', handleCustomTercapaiInput); }
        if (selectPembukaBimbingan && inputCustomBimbingan) { selectPembukaBimbingan.addEventListener('change', handlePembukaBimbinganChange); inputCustomBimbingan.addEventListener('input', handleCustomBimbinganInput); }

    } catch (err) {
        console.error("Init error:", err); showNotification("Gagal memuat dashboard: " + err.message, "error");
    }
});

// --- Handler Perubahan Dropdown Filter ---
function handleKelasChange(e) { const selectedKelasId = e.target.value; const selectedKelas = allKelasData.find(k => k.id_kelas === selectedKelasId); currentFase = selectedKelas ? selectedKelas.fase : null; loadSiswaDropdown(selectedKelasId); loadCpCheckboxList(selectMapel ? selectMapel.value : null, currentFase, selectAgama ? selectAgama.value : null); resetFinalDescriptionAndGrade(); resetMulok(); }
function handleMapelChange(e) { const selectedMapelId = e.target.value; loadAgamaDropdown(allAgamaData); if (selectAgama) selectAgama.disabled = !selectedMapelId; loadCpCheckboxList(selectedMapelId, currentFase, selectAgama ? selectAgama.value : null); resetFinalDescriptionAndGrade(); resetMulok(); }
function handleAgamaChange(e) { loadCpCheckboxList(selectMapel ? selectMapel.value : null, currentFase, e.target.value); resetFinalDescriptionAndGrade(); resetMulok(); }

// --- Handler Perubahan Dropdown/Input Kalimat Pembuka ---
function handlePembukaTercapaiChange() { if (!selectPembukaTercapai || !inputCustomTercapai) return; const selVal = selectPembukaTercapai.value; if (selVal === 'custom') { inputCustomTercapai.style.display = 'block'; inputCustomTercapai.value = ''; inputCustomTercapai.focus(); currentPembukaTercapai = " "; } else { inputCustomTercapai.style.display = 'none'; currentPembukaTercapai = selVal ? ` ${selVal.trim()} ` : " "; generateFinalDescription(); } }
function handleCustomTercapaiInput() { if (!inputCustomTercapai) return; currentPembukaTercapai = inputCustomTercapai.value.trim() ? ` ${inputCustomTercapai.value.trim()} ` : " "; generateFinalDescription(); }
function handlePembukaBimbinganChange() { if (!selectPembukaBimbingan || !inputCustomBimbingan) return; const selVal = selectPembukaBimbingan.value; if (selVal === 'custom') { inputCustomBimbingan.style.display = 'block'; inputCustomBimbingan.value = ''; inputCustomBimbingan.focus(); currentPembukaBimbingan = " "; } else { inputCustomBimbingan.style.display = 'none'; currentPembukaBimbingan = selVal ? ` ${selVal.trim()} ` : " "; generateFinalDescription(); } }
function handleCustomBimbinganInput() { if (!inputCustomBimbingan) return; currentPembukaBimbingan = inputCustomBimbingan.value.trim() ? ` ${inputCustomBimbingan.value.trim()} ` : " "; generateFinalDescription(); }

/**
 * Memuat data awal + Memuat Opsi Frasa
 */
function loadInitialData() {
    showNotification("Memuat data awal sekolah...", "info");
    const payload = { action: "getInitialData", spreadsheetId: user.spreadsheetId };
    if (!user.spreadsheetId) { console.error("Gagal load: spreadsheetId kosong!"); showNotification("Gagal: ID Sekolah kosong.", "error"); return; }

    fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" }})
    .then(response => { if (!response.ok) throw new Error(`Server status ${response.status}`); return response.json(); })
    .then(data => {
        hideNotification();
        if (data.success) {
            console.log("Data awal OK.");
            const sidebarSchoolName = document.getElementById('sidebar-school-name'); if (sidebarSchoolName) sidebarSchoolName.innerText = data.profil.nama_sekolah || "[Nama Sekolah]";
            allKelasData = data.kelas || []; loadKelasDropdown(allKelasData); loadMapelDropdown(data.mapel); allAgamaData = data.agama || []; loadAgamaDropdown(allAgamaData); allSiswaData = data.siswa || []; allCpTpData = data.cptp || [];
            allFrasaTercapai = data.frasaTercapai || []; allFrasaBimbingan = data.frasaBimbingan || [];
            loadPembukaOptions(selectPembukaTercapai, allFrasaTercapai); loadPembukaOptions(selectPembukaBimbingan, allFrasaBimbingan);
            currentPembukaTercapai = selectPembukaTercapai && selectPembukaTercapai.options.length > 1 ? selectPembukaTercapai.options[0].value : " menunj..."; currentPembukaBimbingan = selectPembukaBimbingan && selectPembukaBimbingan.options.length > 1 ? selectPembukaBimbingan.options[0].value : " perlu bim...";
            const activePage = document.querySelector('.content-page.active'); if (activePage && activePage.id === 'page-data-siswa') { loadSiswaList(); }
            if (selectKelas && allKelasData.length > 0) selectKelas.disabled = false; if (selectMapel && data.mapel && data.mapel.length > 0) selectMapel.disabled = false;
        } else {
            console.error("Gagal server:", data.message); showNotification("Gagal memuat data awal: " + (data.message || "Error"), "error");
        }
    })
    .catch(error => {
        hideNotification(); console.error("Fetch error:", error); showNotification(`Jaringan error: ${error.message}.`, "error");
        if (formInputNilai) { /* ... disable form ... */ }
    });
}

/**
 * Memuat opsi dropdown kalimat pembuka
 */
function loadPembukaOptions(selectElement, optionsArray) { if (!selectElement) return; const customOption = selectElement.querySelector('option[value="custom"]'); selectElement.innerHTML = ''; if (optionsArray && optionsArray.length > 0) { optionsArray.forEach((frasa, index) => { const trimmedFrasa = frasa.trim(); const option = new Option(trimmedFrasa, ` ${trimmedFrasa} `); selectElement.add(option); if (index === 0) option.selected = true; }); } else { selectElement.add(new Option("-- Tidak ada pilihan --", "")); } if (customOption) selectElement.add(customOption); else selectElement.add(new Option("-- Tulis Manual --", "custom")); }

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
        if(nilaiAkhirInput) { nilaiAkhirInput.disabled = false; } // Aktifkan nilai
        currentSelectedCpStatuses['MULOK'] = { isMulok: true };
        if (editDeskripsiBtn) editDeskripsiBtn.style.display = 'none';
        validateAndToggleButton();
    } else { // --- ADA CP ---
        isMulokActive = false; if (mulokIndicator) mulokIndicator.style.display = 'none';
        if(finalDescriptionInput) { finalDescriptionInput.readOnly = true; finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis..."; }
        if(nilaiAkhirInput) { nilaiAkhirInput.disabled = false; } // Aktifkan nilai
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
        validateAndToggleButton();
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
 * Membuat Deskripsi Naratif Akhir (SELALU "Ananda [Nama Siswa]")
 */
function generateFinalDescription() {
    if (!finalDescriptionInput || !allCpTpData) return;
    let descT = [], descB = [], isAny = false;
    if (isMulokActive) { finalDescriptionInput.readOnly = false; finalDescriptionInput.placeholder = "Input deskripsi Mulok..."; isAny = true; }
    else { for (const cpId in currentSelectedCpStatuses) { if (cpId === 'MULOK') continue; isAny = true; const st = currentSelectedCpStatuses[cpId]; const cp = allCpTpData.find(c => c.id_cp_tp === cpId); if (cp) { let dp = cp.deskripsi ? cp.deskripsi.toLowerCase().replace(/[.,;!?]$/, '') : ''; if (!dp && st === "Tercapai") dp = cp.deskripsi_tercapai ? cp.deskripsi_tercapai.toLowerCase().replace(/[.,;!?]$/, '') : ''; if (!dp && st === "Perlu Bimbingan") dp = cp.deskripsi_perlu_bimbingan ? cp.deskripsi_perlu_bimbingan.toLowerCase().replace(/[.,;!?]$/, '') : ''; if (dp) { if (st === "Tercapai") descT.push(dp); else if (st === "Perlu Bimbingan") descB.push(dp); } } } }
    if (!isMulokActive) {
        let finalD = ""; const si = selectSiswa ? selectSiswa.selectedIndex : -1; const nama = si > 0 && selectSiswa.options.length > si ? selectSiswa.options[si].text : ""; const pembT = currentPembukaTercapai || " menunj..."; const pembB = currentPembukaBimbingan || " perlu bim..."; const prefix = nama ? `Ananda ${nama}` : "Ananda";
        if (descT.length > 0) finalD += prefix + pembT + descT.join(', ');
        if (descB.length > 0) finalD += (finalD !== "" ? ", namun" : prefix + " ") + pembB + descB.join(', ');
        if (finalD !== "") finalD += "."; finalDescriptionInput.value = finalD.trim();
    }
    if (!isAny && !isMulokActive) { finalDescriptionInput.placeholder = "Pilih status..."; finalDescriptionInput.readOnly = true; if (editDeskripsiBtn) editDeskripsiBtn.disabled = true; }
    else { finalDescriptionInput.placeholder = isMulokActive ? "Input Mulok..." : "Deskripsi..."; finalDescriptionInput.readOnly = false; if (editDeskripsiBtn) editDeskripsiBtn.disabled = isMulokActive; }
    validateAndToggleButton(); // ✅ Panggil validasi di akhir
}

/**
 * Reset deskripsi akhir, nilai, DAN validasi tombol
 */
 function resetFinalDescriptionAndGrade() {
    if(finalDescriptionInput) { finalDescriptionInput.value = ''; finalDescriptionInput.readOnly = true; finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis..."; }
    if(nilaiAkhirInput) { nilaiAkhirInput.value = ''; nilaiAkhirInput.disabled = true; } // Pastikan disabled
    currentSelectedCpStatuses = {};
    if (editDeskripsiBtn) editDeskripsiBtn.disabled = true;
    if (simpanNilaiBtn) simpanNilaiBtn.disabled = true; // Nonaktifkan tombol simpan
 }

/**
 * Reset status Mulok
 */
function resetMulok() { isMulokActive = false; if (mulokIndicator) mulokIndicator.style.display = 'none'; if (!isMulokActive && finalDescriptionInput) { finalDescriptionInput.readOnly = true; finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis..."; } if (editDeskripsiBtn) editDeskripsiBtn.style.display = 'block'; }

/**
 * Validasi input form dan aktifkan/nonaktifkan tombol simpan
 */
function validateAndToggleButton() {
    if (!simpanNilaiBtn) return;

    const id_kelas = selectKelas ? selectKelas.value : null;
    const id_siswa = selectSiswa ? selectSiswa.value : null;
    const id_mapel = selectMapel ? selectMapel.value : null;
    const id_agama = selectAgama ? selectAgama.value : null;
    const nilai_akhir = nilaiAkhirInput ? nilaiAkhirInput.value : null;
    const deskripsi_rapor = finalDescriptionInput ? finalDescriptionInput.value : '';

    let isValid = true;

    if (!id_kelas || !id_siswa || !id_mapel || !id_agama) isValid = false;

    const nilaiNum = parseFloat(nilai_akhir);
    if (nilai_akhir === null || nilai_akhir === '' || isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) isValid = false;

    if (isMulokActive && !deskripsi_rapor.trim()) isValid = false;

    simpanNilaiBtn.disabled = !isValid;
    // console.log(`Validasi: Tombol Simpan disabled = ${simpanNilaiBtn.disabled}`); // Log jika perlu
}

// --- Fungsi-fungsi Halaman Data Siswa ---
function handleDownloadTemplate() { showNotification("Membuat template...", "info"); const payload = { action: "handleSiswaActions", subAction: "getSiswaTemplate", spreadsheetId: user.spreadsheetId }; fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } }).then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)).then(d => { if (d.success) { hideNotification(); const b = new Blob([d.template],{type:'text/csv;charset=utf-8;'}); const l = document.createElement("a"); const u = URL.createObjectURL(b); l.setAttribute("href", u); l.setAttribute("download", "template_siswa.csv"); l.style.visibility='hidden'; document.body.appendChild(l); l.click(); document.body.removeChild(l); URL.revokeObjectURL(u); } else { showNotification("Gagal: " + (d.message||"Error"), "error"); } }).catch(e => { hideNotification(); console.error("DL template err:", e); showNotification("Jaringan error.", "error"); }); }
function handleImportCSV(event) { const file = event.target.files[0]; if (!file) return; showNotification("Membaca CSV...", "info"); const reader = new FileReader(); reader.onload = (e) => { try { const text = e.target.result; const data = parseCSV(text); if (!data || data.length === 0) { showNotification("CSV kosong/format salah.", "warning"); return; } uploadSiswaData(data); } catch (err) { console.error("CSV Parse err:", err); showNotification("Gagal baca CSV: " + err.message, "error"); } }; reader.onerror = () => { console.error("FileReader err:", reader.error); showNotification("Gagal baca file.", "error"); }; reader.readAsText(file); event.target.value = null; }
function parseCSV(text) { const lines = text.split(/[\r\n]+/).filter(l => l.trim() !== ''); if (lines.length < 2) return []; const parseLine = (line) => { const v = []; let c = ''; let q = false; for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"') { if (q && line[i + 1] === '"') { c += '"'; i++; } else { q = !q; } } else if (char === ',' && !q) { v.push(c.trim()); c = ''; } else { c += char; } } v.push(c.trim()); return v; }; const headers = parseLine(lines[0]).map(h => h.toLowerCase()); const data = []; const expected = ["nisn", "nis", "nama_siswa", "tempat_lahir", "tanggal_lahir", "jenis_kelamin", "agama", "kelas", "fase", "tahun_ajaran_masuk", "nama_ayah", "pekerjaan_ayah", "nama_ibu", "pekerjaan_ibu", "alamat_siswa", "asal_sekolah", "nama_wali", "alamat_orang_tua"]; let headerMap = {}; let missing = []; expected.forEach(eh => { const i = headers.indexOf(eh); if (i === -1) missing.push(eh); else headerMap[eh] = i; }); if (missing.length > 0) console.warn("CSV headers missing:", missing); for (let i = 1; i < lines.length; i++) { const values = parseLine(lines[i]); if (values.length >= headers.length) { let obj = {}; expected.forEach(eh => { const index = headerMap[eh]; obj[eh] = (index !== undefined && index < values.length) ? values[index] : null; }); if (obj.nama_siswa || obj.nisn || obj.nis) data.push(obj); } else console.warn(`Skip line ${i+1}`); } return data; }
function uploadSiswaData(siswaDataArray) { showNotification(`Mengimpor ${siswaDataArray.length} siswa...`, "info"); const payload = { action: "handleSiswaActions", subAction: "importSiswa", spreadsheetId: user.spreadsheetId, data: siswaDataArray }; fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } }).then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)).then(d => { if (d.success) { showNotification(d.message, "success"); loadInitialData(); } else { showNotification("Gagal impor: " + (d.message || "Error"), "error"); } }).catch(e => { console.error("Import error:", e); showNotification("Jaringan error.", "error"); }); }
function loadSiswaList() { if (!siswaTableBody) { console.warn("#siswa-table-body missing."); return; } if (toggleSiswaListBtn) toggleSiswaListBtn.style.display = 'none'; if (siswaTableContainer) siswaTableContainer.classList.remove('is-expanded'); if (toggleSiswaListBtn) toggleSiswaListBtn.innerText = 'Tampilkan Semua Siswa'; if (allSiswaData && allSiswaData.length > 0) { siswaTableBody.innerHTML = ''; allSiswaData.forEach(siswa => { const tr = document.createElement('tr'); let tglLahir = 'N/A'; if (siswa.tanggal_lahir) { try { const d = new Date(siswa.tanggal_lahir); if (!isNaN(d.getTime())) tglLahir = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }); else tglLahir = siswa.tanggal_lahir; } catch(e){ tglLahir = siswa.tanggal_lahir; } } tr.innerHTML = `<td>${siswa.nisn||'N/A'}</td><td>${siswa.nama_siswa||'N/A'}</td><td>${siswa.kelas||'N/A'}</td><td>${tglLahir}</td><td><a href="#" class="edit-btn" data-siswa-id="${siswa.id_siswa||''}">Edit</a></td>`; siswaTableBody.appendChild(tr); }); if (allSiswaData.length > 3 && toggleSiswaListBtn) { toggleSiswaListBtn.style.display = 'block'; } } else { siswaTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data siswa.</td></tr>`; } }

/**
 * Simpan Nilai & Deskripsi Akhir (handle Mulok) - Dengan Validasi & Error Handling
 */
function handleSimpanNilai() {
    // Validasi Awal
    const id_kelas = selectKelas ? selectKelas.value : null; const id_siswa = selectSiswa ? selectSiswa.value : null; const id_mapel = selectMapel ? selectMapel.value : null;
    const nilai_akhir = nilaiAkhirInput ? nilaiAkhirInput.value : null; const deskripsi_rapor = finalDescriptionInput ? finalDescriptionInput.value : '';
    if (!id_kelas || !id_siswa || !id_mapel || nilai_akhir === null || nilai_akhir === undefined) { showNotification("Kelas, Siswa, Mapel, & Nilai Akhir wajib!", "warning"); return; }
    const nilaiNum = parseFloat(nilai_akhir); if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) { showNotification("Nilai Akhir 0-100.", "warning"); return; }
    if (isMulokActive && !deskripsi_rapor.trim()) { showNotification("Deskripsi Mulok wajib.", "warning"); return; }
    const hasSelectedCp = Object.keys(currentSelectedCpStatuses).filter(k => k !== 'MULOK').length > 0;
    if (!isMulokActive && !deskripsi_rapor.trim() && hasSelectedCp) { if (!confirm("Deskripsi rapor kosong. Yakin simpan?")) return; }
    if (!isMulokActive && !hasSelectedCp) { if (!confirm("Tidak ada CP dipilih. Simpan nilai akhir saja?")) return; }

    showNotification("Menyimpan...", "info"); if(simpanNilaiBtn) simpanNilaiBtn.disabled = true;

    let id_cp_tp_tosend = null;
    if (isMulokActive) { id_cp_tp_tosend = null; }
    else if (hasSelectedCp) { id_cp_tp_tosend = 'REKAP'; }

    const payload = { action: "saveNilaiCp", spreadsheetId: user.spreadsheetId, id_kelas, id_siswa, id_mapel, id_cp_tp: id_cp_tp_tosend, nilai: nilaiNum, deskripsi_tercapai: deskripsi_rapor.trim(), deskripsi_perlu_bimbingan: "" };

    fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } })
    .then(response => {
        if (!response.ok) { return response.text().then(text => { let errMsg = `Server error (${response.status})`; try { const errData = JSON.parse(text); if (errData && errData.message) errMsg += `: ${errData.message}`; } catch(e){} throw new Error(errMsg); }); }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification(data.message || "Berhasil disimpan.", "success");
            resetFinalDescriptionAndGrade(); // Reset form
            if (cpSelectionList) cpSelectionList.innerHTML = '<p style="color: #6c757d;"><i>Pilih kelas, mapel, dan agama...</i></p>'; // Kosongkan list CP
            if (isMulokActive) resetMulok(); // Reset status Mulok jika perlu
            if(selectSiswa) selectSiswa.selectedIndex = 0; // Reset pilihan siswa
        } else {
             showNotification("Gagal menyimpan: " + (data.message || "Error server."), "error"); console.error("Server save error:", data.message);
        }
    })
    .catch(error => { console.error("Save fetch/parse error:", error); showNotification(`Gagal menyimpan: ${error.message}.`, "error"); })
    .finally(() => {
        validateAndToggleButton(); // Pastikan status tombol benar setelah selesai
    });
}
