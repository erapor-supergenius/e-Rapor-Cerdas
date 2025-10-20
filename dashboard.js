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


