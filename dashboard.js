/* ================================================================
 * e-Rapor Cerdas – Dashboard Script (Final V3.3)
 * Fix: Import Siswa, Simpan Nilai, Validasi DOM Aman
 * ================================================================ */

const GAS_URL = "https://script.google.com/macros/s/AKfycbw1Jc7JXssFYq_KMQ6Up34zBGm4XYyOEEORsCeJI7DwJfG-xj3mGY930FbU5a5c5ZCJew/exec";

// === Variabel Global ===
let user = {};
let allKelasData = [], allSiswaData = [], allCpTpData = [], allAgamaData = [];
let allFrasaTercapai = [], allFrasaBimbingan = [];
let currentFase = null, isMulokActive = false;
let currentSelectedCpStatuses = {};
let currentPembukaTercapai = "", currentPembukaBimbingan = "";

// === Elemen DOM ===
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
const importCsvBtn = document.getElementById('import-csv-btn'); // ✅ sesuai HTML kamu
const csvFileInput = document.getElementById('csv-file-input'); // ✅ sesuai HTML kamu
const siswaTableBody = document.getElementById('siswa-table-body');
const toggleSiswaListBtn = document.getElementById('toggle-siswa-list');
const siswaTableContainer = document.querySelector('.data-table-container');

// ================================================
// 🧩 BAGIAN 2 – LOAD DATA AWAL, DROPDOWN + MULOK
// ================================================

async function loadInitialData() {
  try {
    const payload = {
      action: "getInitialData",
      spreadsheetId: user.spreadsheetId,
    };

    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Gagal memuat dashboard.");

    console.log("✅ Data awal berhasil dimuat:", result);
    window.initialData = result;
    allSiswaData = result.siswa || [];
    allKelasData = result.kelas || [];

    loadKelasDropdown(result.kelas);
    loadMapelDropdown(result.mapel);
    loadAgamaDropdown(result.agama);
  } catch (error) {
    console.error("❌ Gagal memuat data awal:", error);
    showNotification("Gagal memuat dashboard.", "error");
  }
}

// ===========================================================
// 📦 BAGIAN 3 – IMPORT & EXPORT CSV SISWA (FIX HTML-ID)
// ===========================================================

// Download template CSV
function handleDownloadTemplate() {
  const header = ["id_siswa", "nama_siswa", "id_kelas"];
  const sample = ["S1", "Nama Contoh", "KLS1"];
  const csv = "data:text/csv;charset=utf-8," + [header.join(","), sample.join(",")].join("\n");
  const link = document.createElement("a");
  link.href = encodeURI(csv);
  link.download = "template_siswa.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Import CSV siswa
function handleImportCSV(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const text = evt.target.result.trim();
      const rows = text.split("\n").filter(r => r);
      const headers = rows[0].split(",");
      const data = rows.slice(1).map(line => {
        const cols = line.split(",");
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = cols[i]?.trim() || "");
        return obj;
      });
      uploadSiswaData(data);
    } catch (err) {
      showNotification("CSV tidak valid: " + err.message, "error");
    }
  };
  reader.readAsText(file);
}

// Upload data siswa ke server
function uploadSiswaData(data) {
  const payload = {
    action: "uploadSiswa",
    spreadsheetId: user.spreadsheetId,
    username: user.username,
    siswa: data,
  };

  showNotification("Mengupload data siswa...", "info");

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  })
    .then(r => r.json())
    .then(result => {
      if (result.success) {
        showNotification("✅ Data siswa berhasil diupload.", "success");
        loadSiswaList();
      } else {
        showNotification("Gagal upload siswa: " + (result.message || ""), "error");
      }
    })
    .catch(err => {
      console.error("Upload error:", err);
      showNotification("Kesalahan upload: " + err.message, "error");
    });
}

// Event tombol Import dan Template
if (downloadTemplateBtn) downloadTemplateBtn.addEventListener("click", handleDownloadTemplate);
if (importCsvBtn && csvFileInput) importCsvBtn.addEventListener("click", () => csvFileInput.click());
if (csvFileInput) csvFileInput.addEventListener("change", handleImportCSV);


// ===========================================================
// 🧾 BAGIAN 4 – SIMPAN NILAI (NORMAL + MULOK)
// ===========================================================
function simpanNilaiKeServer() {
  if (!selectKelas || !selectSiswa || !selectMapel || !selectAgama) return;
  if (!nilaiAkhirInput || !finalDescriptionInput) return;

  const id_mapel = selectMapel.value;
  const isMulokManual = id_mapel === "MULOK_MANUAL";

  const payload = {
    action: isMulokManual ? "simpanNilaiMulok" : "simpanNilai",
    spreadsheetId: user.spreadsheetId,
    username: user.username,
    id_kelas: selectKelas.value,
    id_siswa: selectSiswa.value,
    id_mapel,
    nama_mapel: selectMapel.options[selectMapel.selectedIndex]?.text || "",
    id_agama: selectAgama.value,
    nilai_akhir: nilaiAkhirInput.value,
    deskripsi_rapor: finalDescriptionInput.value,
    cp_statuses: currentSelectedCpStatuses,
  };

  showNotification("Menyimpan nilai...", "info");

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  })
    .then(r => r.json())
    .then(result => {
      if (result.success) {
        showNotification("✅ Nilai berhasil disimpan.", "success");
        resetFinalDescriptionAndGrade();
      } else {
        showNotification("Gagal menyimpan nilai: " + (result.message || ""), "error");
      }
    })
    .catch(err => {
      showNotification("Koneksi gagal: " + err.message, "error");
      console.error("Error simpan nilai:", err);
    });
}

if (simpanNilaiBtn) simpanNilaiBtn.addEventListener("click", simpanNilaiKeServer);


// ===========================================================
// 📋 BAGIAN 5 – DAFTAR SISWA DI DASHBOARD
// ===========================================================
function loadSiswaList() {
  if (!siswaTableBody) return;
  const siswaList = window.initialData?.siswa || [];
  siswaTableBody.innerHTML = '';

  if (siswaList.length === 0) {
    siswaTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Belum ada data siswa.</td></tr>`;
    return;
  }

  siswaList.forEach((s, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${s.nama_siswa}</td>
      <td>${s.id_kelas}</td>
    `;
    siswaTableBody.appendChild(row);
  });
}
