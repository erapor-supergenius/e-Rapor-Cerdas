/* ================================================================
 * e-Rapor Cerdas – Dashboard Script (Final V3.2 Penuh Disempurnakan)
 * Fix Total : Form Input Nilai + Deskripsi + Validasi Tombol
 * URL GAS aktif : https://script.google.com/macros/s/AKfycby-empDcPt5BndGZnjLNyTKt9wbMIP3iRtvoQELdWWoOvZnu2om_Uoh9Zsj5I0Wdq7ZLw/exec
 * ================================================================ */

// === URL GAS (Backend Database Admin v2) ===
const GAS_URL = "https://script.google.com/macros/s/AKfycby-empDcPt5BndGZnjLNyTKt9wbMIP3iRtvoQELdWWoOvZnu2om_Uoh9Zsj5I0Wdq7ZLw/exec";

// === Variabel Global ===
let user = {};
let allKelasData = [], allSiswaData = [], allCpTpData = [], allAgamaData = [];
let allFrasaTercapai = [], allFrasaBimbingan = [];
let currentFase = null, isMulokActive = false;
let currentSelectedCpStatuses = {};
let currentPembukaTercapai = "", currentPembukaBimbingan = "";

// === Elemen DOM ===
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

// === Elemen Data Siswa ===
const downloadTemplateBtn = document.getElementById('download-template-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const csvFileInput = document.getElementById('csv-file-input');
const siswaTableBody = document.getElementById('siswa-table-body');
const toggleSiswaListBtn = document.getElementById('toggle-siswa-list');
const siswaTableContainer = document.querySelector('.data-table-container');

// === Fungsi Notifikasi Elegan ===
function showNotification(message, type = 'info') {
  if (!notificationToast || !notificationMessage) return;
  notificationMessage.innerText = message;
  notificationToast.className = 'notification-toast';
  notificationToast.classList.add(type);
  notificationToast.style.display = 'flex';
  if (notificationToast.timer) clearTimeout(notificationToast.timer);
  notificationToast.timer = setTimeout(() => hideNotification(), 5000);
}
function hideNotification() {
  if (!notificationToast) return;
  notificationToast.style.display = 'none';
  if (notificationToast.timer) clearTimeout(notificationToast.timer);
}
if (notificationClose) notificationClose.addEventListener('click', hideNotification);

// === Saat DOM Siap ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM siap – inisialisasi e-Rapor Cerdas...");
  try {
    // 1️⃣ Otentikasi pengguna
    user.name = localStorage.getItem('userName');
    user.spreadsheetId = localStorage.getItem('spreadsheetId');
    user.username = localStorage.getItem('userUsername');

    if (!user.name || !user.spreadsheetId || !user.username) {
      alert("Sesi berakhir. Silakan login ulang.");
      window.location.href = 'index.html';
      return;
    }

    const welcomeMsgEl = document.getElementById('welcome-message');
    if (welcomeMsgEl) welcomeMsgEl.innerText = `Selamat Datang, ${user.name}!`;

    // 2️⃣ Logout
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm("Yakin logout?")) {
          localStorage.clear();
          window.location.href = 'index.html';
        }
      });
    }

    // 3️⃣ Navigasi Sidebar
    const navLinks = document.querySelectorAll('.nav-link');
    const contentPages = document.querySelectorAll('.content-page');
    if (navLinks.length && contentPages.length) {
      navLinks.forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault();
          const targetPageId = link.getAttribute('data-page');
          navLinks.forEach(n => n.classList.remove('active'));
          contentPages.forEach(p => p.classList.remove('active'));
          link.classList.add('active');
          const page = document.getElementById(targetPageId);
          if (page) {
            page.classList.add('active');
            if (targetPageId === 'page-data-siswa') loadSiswaList();
          }
        });
      });
      const defaultLink = document.querySelector('.nav-link[data-page="page-home"]');
      const defaultPage = document.getElementById('page-home');
      if (defaultLink && defaultPage) {
        defaultLink.classList.add('active');
        defaultPage.classList.add('active');
      }
    }

    // 4️⃣ Muat data awal sekolah
    loadInitialData();

    // 5️⃣ Event Dropdown dan Input Nilai
    if (selectKelas) selectKelas.addEventListener('change', e => { handleKelasChange(e); validateAndToggleButton(); });
    if (selectMapel) selectMapel.addEventListener('change', e => { handleMapelChange(e); validateAndToggleButton(); });
    if (selectAgama) selectAgama.addEventListener('change', e => { handleAgamaChange(e); validateAndToggleButton(); });
    if (selectSiswa) selectSiswa.addEventListener('change', validateAndToggleButton);   // ✅ tambahan penting
    if (nilaiAkhirInput) nilaiAkhirInput.addEventListener('input', validateAndToggleButton);

    // 6️⃣ Pembuka deskripsi
    if (selectPembukaTercapai && inputCustomTercapai) {
      selectPembukaTercapai.addEventListener('change', handlePembukaTercapaiChange);
      inputCustomTercapai.addEventListener('input', handleCustomTercapaiInput);
    }
    if (selectPembukaBimbingan && inputCustomBimbingan) {
      selectPembukaBimbingan.addEventListener('change', handlePembukaBimbinganChange);
      inputCustomBimbingan.addEventListener('input', handleCustomBimbinganInput);
    }

    // 7️⃣ Tombol Simpan Nilai
    if (simpanNilaiBtn && formInputNilai) {
      simpanNilaiBtn.disabled = true;
      simpanNilaiBtn.addEventListener('click', e => { e.preventDefault(); handleSimpanNilai(); });
    }

    // 8️⃣ Download/Import Siswa
    if (downloadTemplateBtn) downloadTemplateBtn.addEventListener('click', handleDownloadTemplate);
    if (importCsvBtn && csvFileInput) importCsvBtn.addEventListener('click', () => csvFileInput.click());
    if (csvFileInput) csvFileInput.addEventListener('change', handleImportCSV);

    // 9️⃣ Tampilkan/Sembunyikan Daftar Siswa
    if (toggleSiswaListBtn && siswaTableContainer) {
      toggleSiswaListBtn.addEventListener('click', e => {
        e.preventDefault();
        const expanded = siswaTableContainer.classList.toggle('is-expanded');
        toggleSiswaListBtn.innerText = expanded ? 'Sembunyikan' : 'Tampilkan Semua Siswa';
      });
    }

    console.log("Inisialisasi DOM selesai.");
  } catch (error) {
    console.error("Critical init error:", error);
    showNotification("Gagal memuat dashboard.", "error");
  }
});

// ===========================================================
// === BAGIAN 2 : LOAD DATA AWAL, DROPDOWN, DAN KALIMAT PEMBUKA ===
// ===========================================================

/**
 * Memuat data awal dari server GAS (profil sekolah, kelas, mapel, CP/TP, frasa)
 */
function loadInitialData() {
  showNotification("Memuat data awal sekolah...", "info");
  const payload = { action: "getInitialData", spreadsheetId: user.spreadsheetId };
  if (!user.spreadsheetId) {
    console.error("Gagal load: spreadsheetId kosong!");
    showNotification("Gagal: ID Sekolah kosong.", "error");
    return;
  }

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
    .then(response => {
      if (!response.ok) throw new Error(`Server status ${response.status}`);
      return response.json();
    })
    .then(data => {
      hideNotification();
      if (data.success) {
        console.log("Data awal sekolah berhasil dimuat.");

        const sidebarSchoolName = document.getElementById('sidebar-school-name');
        if (sidebarSchoolName)
          sidebarSchoolName.innerText = data.profil.nama_sekolah || "[Nama Sekolah]";

        allKelasData = data.kelas || [];
        allSiswaData = data.siswa || [];
        allCpTpData = data.cptp || [];
        allAgamaData = data.agama || [];
        allFrasaTercapai = data.frasaTercapai || [];
        allFrasaBimbingan = data.frasaBimbingan || [];

        loadKelasDropdown(allKelasData);
        loadMapelDropdown(data.mapel);
        loadAgamaDropdown(allAgamaData);

        loadPembukaOptions(selectPembukaTercapai, allFrasaTercapai);
        loadPembukaOptions(selectPembukaBimbingan, allFrasaBimbingan);

        const activePage = document.querySelector('.content-page.active');
        if (activePage && activePage.id === 'page-data-siswa') {
          loadSiswaList();
        }

        if (selectKelas && allKelasData.length > 0) selectKelas.disabled = false;
        if (selectMapel && data.mapel && data.mapel.length > 0) selectMapel.disabled = false;

      } else {
        console.error("Gagal memuat data awal:", data.message);
        showNotification("Gagal memuat data awal: " + (data.message || "Error"), "error");
      }
    })
    .catch(error => {
      hideNotification();
      console.error("Fetch error:", error);
      showNotification(`Jaringan error: ${error.message}.`, "error");
    });
}

/**
 * Memuat opsi dropdown kalimat pembuka (frasa otomatis)
 */
function loadPembukaOptions(selectElement, optionsArray) {
  if (!selectElement) return;
  const customOption = selectElement.querySelector('option[value="custom"]');
  selectElement.innerHTML = '';
  if (optionsArray && optionsArray.length > 0) {
    optionsArray.forEach((frasa, index) => {
      const trimmed = frasa.trim();
      const option = new Option(trimmed, ` ${trimmed} `);
      selectElement.add(option);
      if (index === 0) option.selected = true;
    });
  } else {
    selectElement.add(new Option("-- Tidak ada pilihan --", ""));
  }
  if (customOption)
    selectElement.add(customOption);
  else
    selectElement.add(new Option("-- Tulis Manual --", "custom"));
}

/**
 * Mengisi dropdown kelas
 */
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

/**
 * Mengisi dropdown siswa sesuai kelas terpilih
 */
function loadSiswaDropdown(selectedKelasId) {
  if (!selectSiswa) return;
  selectSiswa.innerHTML = '';
  selectSiswa.disabled = true;
  if (!selectedKelasId) {
    selectSiswa.add(new Option("Pilih kelas dahulu...", ""));
    return;
  }
  const siswaDiKelas = allSiswaData.filter(s => s.id_kelas === selectedKelasId);
  if (siswaDiKelas.length > 0) {
    selectSiswa.add(new Option(`Pilih Siswa (${siswaDiKelas.length} siswa)...`, ""));
    siswaDiKelas.forEach(s => {
      selectSiswa.add(new Option(s.nama_siswa, s.id_siswa));
    });
    selectSiswa.disabled = false;
  } else {
    selectSiswa.add(new Option("Tidak ada siswa di kelas ini", ""));
  }
}

/**
 * Mengisi dropdown mapel
 */
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

/**
 * Mengisi dropdown agama
 */
function loadAgamaDropdown(agamaArray) {
  if (!selectAgama) return;
  selectAgama.innerHTML = '';
  selectAgama.add(new Option("Pilih Agama...", ""));
  let hasAgama = false;
  if (agamaArray && agamaArray.length > 0) {
    selectAgama.add(new Option("Semua (Umum)", "Semua"));
    agamaArray.forEach(ag => {
      if (ag && ag.toLowerCase() !== 'semua') {
        selectAgama.add(new Option(ag, ag));
        hasAgama = true;
      }
    });
  }
  if (!hasAgama) {
    selectAgama.add(new Option("Tidak ada data agama", ""));
    selectAgama.disabled = true;
  } else {
    selectAgama.disabled = !selectMapel || !selectMapel.value;
  }
}

// === Event handler perubahan dropdown utama ===
function handleKelasChange(e) {
  const selectedId = e.target.value;
  const selectedKelas = allKelasData.find(k => k.id_kelas === selectedId);
  currentFase = selectedKelas ? selectedKelas.fase : null;
  loadSiswaDropdown(selectedId);
  loadCpCheckboxList(selectMapel ? selectMapel.value : null, currentFase, selectAgama ? selectAgama.value : null);
  resetFinalDescriptionAndGrade();
  resetMulok();
}
function handleMapelChange(e) {
  const mapelId = e.target.value;
  loadAgamaDropdown(allAgamaData);
  if (selectAgama) selectAgama.disabled = !mapelId;
  loadCpCheckboxList(mapelId, currentFase, selectAgama ? selectAgama.value : null);
  resetFinalDescriptionAndGrade();
  resetMulok();
}
function handleAgamaChange(e) {
  loadCpCheckboxList(selectMapel ? selectMapel.value : null, currentFase, e.target.value);
  resetFinalDescriptionAndGrade();
  resetMulok();
}

// ===========================================================
// === BAGIAN 3 : DAFTAR CP/TP, DESKRIPSI OTOMATIS & VALIDASI ===
// ===========================================================

/**
 * Membuat daftar checkbox CP berdasarkan mapel/fase/agama
 */
function loadCpCheckboxList(selectedMapelId, selectedFase, selectedAgama) {
  if (!cpSelectionList || !allCpTpData) {
    console.warn("#cp-selection-list or CP data missing.");
    return;
  }

  cpSelectionList.innerHTML = '';
  currentSelectedCpStatuses = {};
  resetFinalDescriptionAndGrade();
  resetMulok();

  if (!selectedMapelId || !selectedFase || !selectedAgama) {
    cpSelectionList.innerHTML = `<p style="color: #6c757d;"><i>Pilih kelas, mapel, & agama...</i></p>`;
    return;
  }

  const cpTpFiltered = allCpTpData.filter(cp =>
    cp.id_mapel === selectedMapelId &&
    cp.fase === selectedFase &&
    (cp.agama === selectedAgama || cp.agama === "Semua" || !cp.agama)
  );

  if (cpTpFiltered.length === 0) {
    // === MODE MULOK ===
    isMulokActive = true;
    cpSelectionList.innerHTML = `<p style="color: #6c757d;"><i>Tidak ada CP. Input manual Mulok aktif.</i></p>`;
    if (mulokIndicator) mulokIndicator.style.display = 'inline';
    if (finalDescriptionInput) {
      finalDescriptionInput.readOnly = false;
      finalDescriptionInput.placeholder = "Input deskripsi Mulok...";
    }
    if (nilaiAkhirInput) nilaiAkhirInput.disabled = false;
    currentSelectedCpStatuses['MULOK'] = { isMulok: true };
    if (editDeskripsiBtn) editDeskripsiBtn.style.display = 'none';
    validateAndToggleButton();
  } else {
    // === MODE CP NORMAL ===
    isMulokActive = false;
    if (mulokIndicator) mulokIndicator.style.display = 'none';
    if (finalDescriptionInput) {
      finalDescriptionInput.readOnly = true;
      finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis...";
    }
    if (nilaiAkhirInput) nilaiAkhirInput.disabled = false;
    if (editDeskripsiBtn) {
      editDeskripsiBtn.style.display = 'block';
      editDeskripsiBtn.disabled = true;
    }

    cpTpFiltered.forEach(cp => {
      const cpId = cp.id_cp_tp;
      if (!cpId) return;

      const itemDiv = document.createElement('div');
      itemDiv.classList.add('cp-item');
      const tercapaiId = `cp_${cpId}_tercapai`;
      const bimbinganId = `cp_${cpId}_bimbingan`;
      itemDiv.innerHTML = `
        <div class="cp-item-header">${cp.deskripsi || '[No TP Desc]'}</div>
        <div class="cp-item-options">
          <label for="${tercapaiId}">
            <input type="checkbox" id="${tercapaiId}" name="cp_status_${cpId}" value="Tercapai" data-cp-id="${cpId}" data-status="Tercapai"> Tercapai
          </label>
          <label for="${bimbinganId}">
            <input type="checkbox" id="${bimbinganId}" name="cp_status_${cpId}" value="Perlu Bimbingan" data-cp-id="${cpId}" data-status="Perlu Bimbingan"> P. Bimbingan
          </label>
        </div>
      `;
      cpSelectionList.appendChild(itemDiv);

      const checkboxes = itemDiv.querySelectorAll(`input[name="cp_status_${cpId}"]`);
      checkboxes.forEach(cb => {
        cb.addEventListener('change', e => handleCpCheckboxChange(e.target, cpId, checkboxes));
      });
    });

    validateAndToggleButton();
  }
}

/**
 * Menangani perubahan checkbox CP
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

  generateFinalDescription();
}

/**
 * Membuat deskripsi otomatis dari CP terpilih
 */
function generateFinalDescription() {
  if (!finalDescriptionInput || !allCpTpData) return;

  let deskripsiTercapaiList = [];
  let deskripsiBimbinganList = [];
  let isAnyCpSelected = false;

  if (isMulokActive) {
    finalDescriptionInput.readOnly = false;
    finalDescriptionInput.placeholder = "Input deskripsi Mulok...";
    isAnyCpSelected = true;
  } else {
    for (const cpId in currentSelectedCpStatuses) {
      if (cpId === 'MULOK') continue;
      isAnyCpSelected = true;
      const status = currentSelectedCpStatuses[cpId];
      const cpData = allCpTpData.find(cp => cp.id_cp_tp === cpId);
      if (cpData) {
        let descPart = cpData.deskripsi ? cpData.deskripsi.toLowerCase().replace(/[.,;!?]$/, '') : '';
        if (!descPart && status === "Tercapai")
          descPart = cpData.deskripsi_tercapai ? cpData.deskripsi_tercapai.toLowerCase().replace(/[.,;!?]$/, '') : '';
        if (!descPart && status === "Perlu Bimbingan")
          descPart = cpData.deskripsi_perlu_bimbingan ? cpData.deskripsi_perlu_bimbingan.toLowerCase().replace(/[.,;!?]$/, '') : '';

        if (descPart) {
          if (status === "Tercapai") deskripsiTercapaiList.push(descPart);
          else if (status === "Perlu Bimbingan") deskripsiBimbinganList.push(descPart);
        }
      }
    }
  }

  if (!isMulokActive) {
    let finalDesc = "";
    const siswaSelectedIndex = selectSiswa ? selectSiswa.selectedIndex : -1;
    const namaSiswa = siswaSelectedIndex > 0 && selectSiswa.options.length > siswaSelectedIndex
      ? selectSiswa.options[siswaSelectedIndex].text
      : "";
    const pembukaTercapai = currentPembukaTercapai || " menunjukkan penguasaan yang baik dalam ";
    const pembukaBimbingan = currentPembukaBimbingan || " perlu bimbingan dalam ";
    const prefixNama = namaSiswa ? `Ananda ${namaSiswa}` : "Ananda";

    if (deskripsiTercapaiList.length > 0)
      finalDesc += prefixNama + pembukaTercapai + deskripsiTercapaiList.join(', ');
    if (deskripsiBimbinganList.length > 0)
      finalDesc += (finalDesc !== "" ? ", namun" : prefixNama + " ") + pembukaBimbingan + deskripsiBimbinganList.join(', ');
    if (finalDesc !== "") finalDesc += ".";
    finalDescriptionInput.value = finalDesc.trim();
  }

  if (!isAnyCpSelected && !isMulokActive) {
    finalDescriptionInput.placeholder = "Pilih status capaian...";
    finalDescriptionInput.readOnly = true;
    if (editDeskripsiBtn) editDeskripsiBtn.disabled = true;
  } else {
    finalDescriptionInput.placeholder = isMulokActive ? "Input Mulok..." : "Deskripsi rapor...";
    finalDescriptionInput.readOnly = false;
    if (editDeskripsiBtn) editDeskripsiBtn.disabled = isMulokActive;
  }

  // Tambahan fix agar deskripsi bisa diketik manual setelah CP dipilih
  if (finalDescriptionInput && !isMulokActive) finalDescriptionInput.readOnly = false;

  validateAndToggleButton();
}

/**
 * Reset deskripsi dan nilai akhir
 */
function resetFinalDescriptionAndGrade() {
  if (finalDescriptionInput) {
    finalDescriptionInput.value = '';
    finalDescriptionInput.readOnly = true;
    finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis...";
  }
  if (nilaiAkhirInput) {
    nilaiAkhirInput.value = '';
    nilaiAkhirInput.disabled = true;
  }
  currentSelectedCpStatuses = {};
  if (editDeskripsiBtn) editDeskripsiBtn.disabled = true;
  if (simpanNilaiBtn) simpanNilaiBtn.disabled = true;
}

/**
 * Reset status Mulok
 */
function resetMulok() {
  isMulokActive = false;
  if (mulokIndicator) mulokIndicator.style.display = 'none';
  if (!isMulokActive && finalDescriptionInput) {
    finalDescriptionInput.readOnly = true;
    finalDescriptionInput.placeholder = "Deskripsi dibuat otomatis...";
  }
  if (editDeskripsiBtn) editDeskripsiBtn.style.display = 'block';
}

/**
 * Validasi form input nilai dan aktifkan/nonaktifkan tombol simpan
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
  if (nilai_akhir === null || nilai_akhir === '' || isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100)
    isValid = false;
  if (isMulokActive && !deskripsi_rapor.trim()) isValid = false;

  simpanNilaiBtn.disabled = !isValid;
}

// ===========================================================
// === FIX TAMBAHAN : HANDLER PEMBUKA DESKRIPSI ===
// ===========================================================

function handlePembukaTercapaiChange(e) {
  const val = e.target.value;
  if (val === 'custom') {
    inputCustomTercapai.style.display = 'block';
    currentPembukaTercapai = inputCustomTercapai.value.trim();
  } else {
    inputCustomTercapai.style.display = 'none';
    currentPembukaTercapai = val;
  }
  generateFinalDescription();
}

function handleCustomTercapaiInput(e) {
  currentPembukaTercapai = e.target.value.trim();
  generateFinalDescription();
}

function handlePembukaBimbinganChange(e) {
  const val = e.target.value;
  if (val === 'custom') {
    inputCustomBimbingan.style.display = 'block';
    currentPembukaBimbingan = inputCustomBimbingan.value.trim();
  } else {
    inputCustomBimbingan.style.display = 'none';
    currentPembukaBimbingan = val;
  }
  generateFinalDescription();
}

function handleCustomBimbinganInput(e) {
  currentPembukaBimbingan = e.target.value.trim();
  generateFinalDescription();
}

// ===========================================================
// === BAGIAN 4 : SIMPAN NILAI, IMPORT/EXPORT CSV, DATA SISWA ===
// ===========================================================

/**
 * Mengirim nilai dan deskripsi ke server GAS
 */
function handleSimpanNilai() {
  if (!simpanNilaiBtn || simpanNilaiBtn.disabled) return;

  const id_kelas = selectKelas ? selectKelas.value : '';
  const id_siswa = selectSiswa ? selectSiswa.value : '';
  const id_mapel = selectMapel ? selectMapel.value : '';
  const id_agama = selectAgama ? selectAgama.value : '';
  const nilai_akhir = nilaiAkhirInput ? nilaiAkhirInput.value.trim() : '';
  const deskripsi_rapor = finalDescriptionInput ? finalDescriptionInput.value.trim() : '';

  if (!id_kelas || !id_siswa || !id_mapel || !id_agama || !nilai_akhir) {
    showNotification("Lengkapi semua data sebelum menyimpan.", "warning");
    return;
  }

  const nilaiNum = parseFloat(nilai_akhir);
  if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
    showNotification("Nilai harus antara 0-100.", "warning");
    return;
  }

  const payload = {
    action: "simpanNilai",
    spreadsheetId: user.spreadsheetId,
    username: user.username,
    id_kelas,
    id_siswa,
    id_mapel,
    id_agama,
    nilai_akhir: nilaiNum,
    deskripsi_rapor,
    cp_statuses: currentSelectedCpStatuses
  };

  showNotification("Menyimpan nilai...", "info");
  simpanNilaiBtn.disabled = true;

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        showNotification("Nilai berhasil disimpan.", "success");
        resetFinalDescriptionAndGrade();
        cpSelectionList.innerHTML = '<p><i>Nilai tersimpan.</i></p>';
      } else {
        showNotification("Gagal menyimpan nilai: " + (result.message || ""), "error");
      }
    })
    .catch(error => {
      console.error("Error simpan nilai:", error);
      showNotification("Gagal koneksi ke server: " + error.message, "error");
    })
    .finally(() => {
      simpanNilaiBtn.disabled = false;
    });
}

/**
 * Mengunduh template CSV untuk data siswa
 */
function handleDownloadTemplate() {
  const header = ["id_siswa", "nama_siswa", "id_kelas"];
  const sample = ["S1", "Nama Siswa Contoh", "KLS1"];
  const csvContent = "data:text/csv;charset=utf-8," + [header.join(","), sample.join(",")].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "template_siswa.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Import file CSV siswa
 */
function handleImportCSV(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const csvText = evt.target.result;
    const siswaData = parseCSV(csvText);
    if (siswaData.length > 0) uploadSiswaData(siswaData);
    else showNotification("File CSV kosong atau tidak valid.", "warning");
  };
  reader.readAsText(file);
}

/**
 * Parser CSV sederhana
 */
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const values = line.split(",");
    let obj = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim());
    return obj;
  });
}

/**
 * Upload data siswa ke server
 */
function uploadSiswaData(siswaArray) {
  if (!Array.isArray(siswaArray) || siswaArray.length === 0) return;
  const payload = {
    action: "uploadSiswa",
    spreadsheetId: user.spreadsheetId,
    username: user.username,
    siswa: siswaArray
  };

  showNotification("Mengupload data siswa...", "info");

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        showNotification("Data siswa berhasil diupload.", "success");
        loadSiswaList();
      } else {
        showNotification("Gagal upload siswa: " + (result.message || ""), "error");
      }
    })
    .catch(error => {
      console.error("Error upload siswa:", error);
      showNotification("Kesalahan upload: " + error.message, "error");
    });
}

/**
 * Menampilkan daftar siswa di tabel dashboard
 */
function loadSiswaList() {
  if (!siswaTableBody) return;
  siswaTableBody.innerHTML = '';
  if (!allSiswaData || allSiswaData.length === 0) {
    siswaTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Belum ada data siswa.</td></tr>`;
    return;
  }
  allSiswaData.forEach((siswa, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${siswa.nama_siswa}</td>
      <td>${siswa.id_kelas}</td>
    `;
    siswaTableBody.appendChild(row);
  });
}

// ===========================================================
// === FUNGSI SIMPAN NILAI KE SERVER (FINAL + MENDUKUNG MULOK)
// ===========================================================
function simpanNilaiKeServer() {
  showNotification("Menyimpan data nilai...", "info");

  try {
    // Deteksi apakah mapel adalah Muatan Lokal (Manual)
    const isMulokManual = selectMapel && selectMapel.value === "MULOK_MANUAL";

    const payload = {
      action: isMulokManual ? "simpanNilaiMulok" : "saveNilaiCp",
      spreadsheetId: user.spreadsheetId,
      username: user.username,
      id_kelas: selectKelas.value,
      id_siswa: selectSiswa.value,
      id_mapel: selectMapel.value,
      nama_mapel: selectMapel.options[selectMapel.selectedIndex].text,
      id_agama: selectAgama.value,
      nilai_akhir: nilaiAkhirInput.value,
      deskripsi_rapor: finalDescriptionInput.value,
      cp_statuses: currentSelectedCpStatuses,
      tahun_ajaran: "2025/2026", // bisa dibuat dinamis nanti
      semester: "1"
    };

    fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
      .then(res => res.json())
      .then(result => {
        hideNotification();
        if (result.success) {
          showNotification(result.message || "Nilai berhasil disimpan!", "success");
          console.log("✅ Simpan nilai sukses:", result);
        } else {
          showNotification(result.message || "Gagal menyimpan nilai.", "error");
          console.error("❌ Simpan nilai gagal:", result);
        }
      })
      .catch(err => {
        hideNotification();
        console.error("Fetch Error:", err);
        showNotification("Koneksi ke server gagal: " + err.message, "error");
      });

  } catch (error) {
    hideNotification();
    console.error("Error simpanNilaiKeServer:", error);
    showNotification("Terjadi kesalahan internal: " + error.message, "error");
  }
}

// Pastikan tombol Simpan Nilai terhubung ke fungsi ini:
simpanNilaiBtn.addEventListener("click", simpanNilaiKeServer);
