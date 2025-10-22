/* === e-Rapor Cerdas - Dashboard Script (V4.2 - PERBAIKAN FATAL ERROR) === */

// !!! PENTING !!! PASTIKAN INI ADALAH URL DARI "DATABASE ADMIN v2" ANDA !!!
const GAS_URL = "https://script.google.com/macros/s/AKfycbw1Jc7JXssFYq_KMQ6Up34zBGm4XYyOEEORsCeJI7DwJfG-xj3mGY930FbU5a5c5ZCJew/exec"; // <-- URL ANDA (Sudah benar)

// --- Variabel Global ---
let user = {};
let allKelasData = [], allSiswaData = [], allCpTpData = [], allAgamaData = [];
let allFrasaTercapai = [], allFrasaBimbingan = [];
let currentFase = null, isMulokActive = false;
let currentSelectedCpStatuses = {};
let currentPembukaTercapai = "", currentPembukaBimbingan = "";

// --- Fungsi Helper (DI LUAR DOMContentLoaded) ---

// --- Notifikasi ---
// (Definisi fungsi notifikasi di luar agar bisa dipanggil dari mana saja)
function showNotification(message, type = 'info') { 
  const notificationToast = document.getElementById('notification-toast');
  const notificationMessage = document.getElementById('notification-toast-message');
  if (!notificationToast || !notificationMessage) return; 
  notificationMessage.innerText = message; 
  notificationToast.className = 'notification-toast'; 
  notificationToast.classList.add(type); 
  notificationToast.style.display = 'flex'; 
  if (notificationToast.timer) clearTimeout(notificationToast.timer); 
  notificationToast.timer = setTimeout(() => { hideNotification(); }, 5000); 
}
function hideNotification() { 
  const notificationToast = document.getElementById('notification-toast');
  if (!notificationToast) return; 
  notificationToast.style.display = 'none'; 
  if (notificationToast.timer) clearTimeout(notificationToast.timer); 
  notificationToast.timer = null; 
}

// --- Fungsi Helper (Fetch Data) ---
function fetchData(action, payload) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(response => {
        if (response.success) {
          resolve(response);
        } else {
          console.error(`Error in action [${action}]:`, response.message);
          reject(new Error(response.message));
        }
      })
      .withFailureHandler(error => {
        console.error(`Gagal memanggil GAS [${action}]:`, error.message);
        reject(error);
      })
      .postData({ action, payload, user });
  });
}

// --- Fungsi Helper (Global Loader) ---
function setGlobalLoading(isVisible) {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.style.display = isVisible ? 'flex' : 'none';
  }
}

/* === FUNGSI UNTUK PROFIL SEKOLAH (DI LUAR DOMContentLoaded) === */
/**
 * 1. Mengisi data form profil sekolah dari data yang sudah dimuat
 * PENTING: 'profilInputs' harus di-pass sebagai argumen karena baru didefinisi di dalam DOMContentLoaded
 */
function populateProfilForm(profil, profilInputs) {
  if (!profil || !profilInputs) return;

  // Loop semua keys di profilInputs dan isi nilainya
  for (const key in profilInputs) {
    if (profilInputs[key] && profil[key] !== undefined) {
      profilInputs[key].value = profil[key];
    }
  }

  // Set preview logo dari URL yang ada
  const logoPreview = document.getElementById('logo-preview'); // Ambil langsung
  if (profil.url_logo && logoPreview) {
    logoPreview.src = profil.url_logo;
  }
}

/**
 * 2. Menangani upload file logo
 * PENTING: 'profilInputs' dan elemen UI di-pass sebagai argumen
 */
function handleLogoUpload(event, profilInputs, btnSimpanProfil, profilLoadingSpinner) {
  const file = event.target.files[0];
  if (!file) return;

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    showNotification('Format file tidak didukung. Gunakan .jpg atau .png', 'error');
    return;
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = () => {
    showNotification('Mengupload logo...', 'info');
    if(btnSimpanProfil) btnSimpanProfil.disabled = true;
    if(profilLoadingSpinner) profilLoadingSpinner.style.display = 'inline-block';

    const base64String = reader.result.split(',')[1];
    const fileData = {
      base64: base64String,
      mimeType: file.type,
      fileName: file.name
    };

    fetchData('uploadLogo', fileData)
      .then(response => {
        if (response.success) {
          const newUrl = response.data.url;
          showNotification('Logo berhasil diupload!', 'success');
          
          const logoPreview = document.getElementById('logo-preview');
          if(logoPreview) logoPreview.src = newUrl;
          if(profilInputs.url_logo) profilInputs.url_logo.value = newUrl; // SIMPAN URL BARU
          
          const sidebarLogo = document.getElementById('sidebar-logo-img');
          if(sidebarLogo) sidebarLogo.src = newUrl;
        } else {
          throw new Error(response.message);
        }
      })
      .catch(error => {
        console.error('Error uploading logo:', error);
        showNotification(`Gagal upload logo: ${error.message}`, 'error');
      })
      .finally(() => {
        if(btnSimpanProfil) btnSimpanProfil.disabled = false;
        if(profilLoadingSpinner) profilLoadingSpinner.style.display = 'none';
        event.target.value = null;
      });
  };
}

/**
 * 3. Mengumpulkan data dari form dan menyimpannya ke Sheet
 * PENTING: 'profilInputs' dan elemen UI di-pass sebagai argumen
 */
function simpanDataProfil(profilInputs, btnSimpanProfil, profilLoadingSpinner) {
  let dataToSave = {};
  for (const key in profilInputs) {
    if (profilInputs[key]) {
      dataToSave[key] = profilInputs[key].value;
    }
  }

  if(btnSimpanProfil) btnSimpanProfil.disabled = true;
  if(profilLoadingSpinner) profilLoadingSpinner.style.display = 'inline-block';
  showNotification('Menyimpan data profil...', 'info');

  fetchData('simpanProfilSekolah', dataToSave)
    .then(response => {
      if (response.success) {
        showNotification('Profil sekolah berhasil diperbarui!', 'success');
        
        const sidebarNama = document.getElementById('sidebar-nama-sekolah');
        if(sidebarNama) sidebarNama.textContent = dataToSave.nama_sekolah;
        
        const sidebarSubtext = document.getElementById('sidebar-subtext');
        if(sidebarSubtext) sidebarSubtext.textContent = `NPSN: ${dataToSave.npsn}`;
        
      } else {
        throw new Error(response.message);
      }
    })
    .catch(error => {
      console.error('Error saving profil:', error);
      showNotification(`Gagal menyimpan: ${error.message}`, 'error');
    })
    .finally(() => {
      if(btnSimpanProfil) btnSimpanProfil.disabled = false;
      if(profilLoadingSpinner) profilLoadingSpinner.style.display = 'none';
    });
}
/* === (SELESAI) FUNGSI PROFIL SEKOLAH === */

// --- Saat DOM Siap ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM siap.");

  // --- (PINDAH KE SINI) Definisi Variabel Elemen ---
  const notificationToast = document.getElementById('notification-toast');
  const notificationMessage = document.getElementById('notification-toast-message');
  const notificationClose = document.getElementById('notification-toast-close');
  const formInputNilai = document.getElementById('form-input-nilai');
  const selectKelas = document.getElementById('pilih-kelas');
  const selectSiswa = document.getElementById('pilih-siswa');
  const selectMapel = document.getElementById('pilih-mapel');
  const selectAgama = document.getElementById('select-agama');

  /* === (PINDAH KE SINI) Elemen Form Profil Sekolah === */
  const formProfilSekolah = document.getElementById('form-profil-sekolah');
  const btnSimpanProfil = document.getElementById('simpan-profil-btn');
  const inputLogoFile = document.getElementById('input-logo-file');
  const logoPreview = document.getElementById('logo-preview');
  const profilLoadingSpinner = document.getElementById('profil-loading-spinner');

  const profilInputs = {
    token_sekolah: document.getElementById('profil-token-sekolah'),
    nama_sekolah: document.getElementById('profil-nama-sekolah'),
    nss: document.getElementById('profil-nss'),
    npsn: document.getElementById('profil-npsn'),
    status_sekolah: document.getElementById('profil-status-sekolah'),
    alamat_sekolah: document.getElementById('profil-alamat-sekolah'),
    kelurahan_desa: document.getElementById('profil-kelurahan-desa'),
    kecamatan: document.getElementById('profil-kecamatan'),
    kabupaten_kota: document.getElementById('profil-kabupaten-kota'),
    provinsi: document.getElementById('profil-provinsi'),
    website: document.getElementById('profil-website'),
    email: document.getElementById('profil-email'),
    telepon: document.getElementById('profil-telepon'),
    kepala_sekolah: document.getElementById('profil-kepala-sekolah'),
    nip_kepsek: document.getElementById('profil-nip-kepsek'),
    url_logo: document.getElementById('profil-url-logo'), // Input hidden
    kabupaten_kota_rapor: document.getElementById('profil-kabupaten-kota-rapor'),
    tanggal_rapor: document.getElementById('profil-tanggal-rapor')
  };
  /* === (SELESAI) Elemen Form Profil Sekolah === */
  
  // --- (PINDAH KE SINI) Elemen Data Siswa ---
  const downloadTemplateBtn = document.getElementById('download-template-btn');
  const importCsvBtn = document.getElementById('import-csv-btn');
  const csvFileInput = document.getElementById('csv-file-input');
  const siswaTableBody = document.getElementById('siswa-table-body');
  const toggleSiswaListBtn = document.getElementById('toggle-siswa-list');
  const siswaTableContainer = document.querySelector('.data-table-container');

  // --- (PINDAH KE SINI) Listener Notifikasi ---
  if (notificationClose) notificationClose.addEventListener('click', hideNotification);

  // --- Panggil Data Awal ---
  setGlobalLoading(true);

  // 1. Cek Autentikasi & Ambil Data Awal
  google.script.run
    .withSuccessHandler(response => {
      console.log("Auth Check >> Berhasil.", response);
      setGlobalLoading(false);

      if (!response.success) {
        showNotification(response.message || 'Gagal memuat data. Sesi mungkin berakhir.', 'error');
        if (response.action === 'redirect') {
          setTimeout(() => { window.location.href = response.url; }, 2000);
        }
        return;
      }

      // SUKSES: Data diterima, inisialisasi dashboard
      try {
        const data = response.data;

        // --- Setel header sidebar ---
        const profil = data.profil;
        if (profil) {
            document.getElementById('sidebar-logo-img').src = profil.url_logo || 'assets/logo.png';
            document.getElementById('sidebar-nama-sekolah').textContent = profil.nama_sekolah || "Nama Sekolah";
            document.getElementById('sidebar-subtext').textContent = profil.npsn ? `NPSN: ${profil.npsn}` : "Subtext Sekolah";
            
            /* === (PERBAIKAN) Panggil Fungsi Isi Form Profil (passing profilInputs) === */
            populateProfilForm(profil, profilInputs); 
        }
        
        // --- Setel data pengguna ---
        user = data.user || {};
        document.getElementById('welcome-message').textContent = `Selamat Datang, ${user.nama_lengkap || 'Pengguna'}`;

        // --- Inisialisasi data global ---
        allKelasData = data.kelas || [];
        allSiswaData = data.siswa || [];
        allCpTpData = data.cp_tp || [];
        allAgamaData = data.agama || [];
        allFrasaTercapai = data.frasa_tercapai || [];
        allFrasaBimbingan = data.frasa_bimbingan || [];
        
        // --- Setup Dropdown ---
        setupSelectKelas(allKelasData);
        setupSelectAgama(allAgamaData);
        setupSelectSiswa([]); // Kosongkan dulu

      } catch (e) {
        console.error("Error memproses data awal:", e);
        showNotification(`Error: ${e.message}`, 'error');
      }

    })
    .withFailureHandler(error => {
      console.error("Auth Check >> Gagal:", error);
      setGlobalLoading(false);
      showNotification(`Koneksi Gagal: ${error.message}. Coba muat ulang.`, 'error');
    })
    .getInitialData(); // Panggil fungsi GAS Anda

  
  // 2. Logout
  const logoutBtn = document.getElementById('logout-button');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logoutBtn.disabled = true;
      logoutBtn.textContent = 'Memuat...';
      showNotification('Anda sedang keluar...', 'info');
      
      google.script.run
        .withSuccessHandler(response => {
          if (response.success) {
            window.location.href = response.url; // Redirect ke halaman login
          } else {
            showNotification(response.message || 'Gagal logout', 'error');
            logoutBtn.disabled = false;
            logoutBtn.textContent = 'Logout';
          }
        })
        .withFailureHandler(error => {
          showNotification(`Error: ${error.message}`, 'error');
          logoutBtn.disabled = false;
          logoutBtn.textContent = 'Logout';
        })
        .logoutUser();
    });
  }

  // --- Logika Halaman Input Nilai ---

  // 3. Event listener untuk dropdown
  if (selectKelas) {
    selectKelas.addEventListener('change', (e) => {
      const idKelas = e.target.value;
      const kelas = allKelasData.find(k => k.id_kelas === idKelas);
      
      if (kelas) {
        currentFase = kelas.fase;
        // Filter siswa berdasarkan id_kelas
        const siswaDiKelas = allSiswaData.filter(s => s.id_kelas === idKelas);
        setupSelectSiswa(siswaDiKelas);
        
        // Filter mapel berdasarkan fase
        const mapelDiFase = allCpTpData.filter(cp => cp.fase === currentFase);
        // Ambil mapel unik
        const mapelUnik = [...new Map(mapelDiFase.map(item => [item['mapel'], item])).values()];
        setupSelectMapel(mapelUnik);
        
      } else {
        currentFase = null;
        setupSelectSiswa([]);
        setupSelectMapel([]);
      }
      resetFormInputNilai();
    });
  }

  if (selectMapel) {
    selectMapel.addEventListener('change', (e) => {
      const mapelDipilih = e.target.value;
      const idSiswa = selectSiswa.value;
      isMulokActive = mapelDipilih.toLowerCase().includes('muatan lokal');

      if (idSiswa && mapelDipilih && currentFase) {
        // Muat data nilai jika ada
        muatDataNilaiSiswa(idSiswa, mapelDipilih);
      } else {
        // Reset jika salah satu tidak terpilih
        resetFormInputNilai();
      }
    });
  }
  
  if (selectSiswa) {
    selectSiswa.addEventListener('change', (e) => {
      const idSiswa = e.target.value;
      const mapelDipilih = selectMapel.value;

      if (idSiswa && mapelDipilih && currentFase) {
        // Muat data nilai jika ada
        muatDataNilaiSiswa(idSiswa, mapelDipilih);
      } else {
        // Reset jika salah satu tidak terpilih
        resetFormInputNilai();
      }
    });
  }
  
  if (selectAgama) {
    selectAgama.addEventListener('change', (e) => {
      const agama = e.target.value;
      const idSiswa = selectSiswa.value;
      // Jika agama diganti, otomatis muat ulang data nilai (jika PAI/Budi Pekerti)
      if (selectMapel.value.toLowerCase().includes('pendidikan agama') && idSiswa) {
          muatDataNilaiSiswa(idSiswa, selectMapel.value);
      }
    });
  }

  // 4. Submit Form Nilai
  if (formInputNilai) {
    formInputNilai.addEventListener('submit', (e) => {
      e.preventDefault();
      simpanDataNilai();
    });
  }

  // --- Fungsi Inti Halaman Input Nilai (DI DALAM DOMContentLoaded) ---

  function resetFormInputNilai() {
    document.getElementById('cp-selection-list').innerHTML = '';
    document.getElementById('input-nilai-akhir').value = '';
    document.getElementById('input-deskripsi-tercapai').value = '';
    document.getElementById('input-deskripsi-bimbingan').value = '';
    document.getElementById('mulok-fields').style.display = 'none';
    document.getElementById('agama-fields').style.display = 'none';
    document.getElementById('cp-fields').style.display = 'none';
    currentSelectedCpStatuses = {};
  }

  function simpanDataNilai() {
    const payload = {
      id_siswa: selectSiswa.value,
      mapel: selectMapel.value,
      fase: currentFase,
      nilai_akhir: document.getElementById('input-nilai-akhir').value,
      cp_tercapai: [],
      cp_bimbingan: [],
      deskripsi_tercapai: document.getElementById('input-deskripsi-tercapai').value,
      deskripsi_bimbingan: document.getElementById('input-deskripsi-bimbingan').value,
      is_mulok: isMulokActive
    };

    // Validasi
    if (!payload.id_siswa || !payload.mapel || !payload.fase) {
      showNotification('Kelas, Siswa, dan Mapel harus dipilih.', 'error');
      return;
    }
    
    // Kumpulkan status CP
    document.querySelectorAll('#cp-selection-list input[type="radio"]:checked').forEach(radio => {
      const idTp = radio.dataset.id;
      const status = radio.value; // 'tercapai' or 'bimbingan'
      if (status === 'tercapai') {
        payload.cp_tercapai.push(idTp);
      } else if (status === 'bimbingan') {
        payload.cp_bimbingan.push(idTp);
      }
    });

    setGlobalLoading(true);
    showNotification('Menyimpan data nilai...', 'info');

    fetchData('simpanNilaiSiswa', payload)
      .then(response => {
        showNotification(response.message || 'Nilai berhasil disimpan!', 'success');
      })
      .catch(error => {
        showNotification(`Gagal menyimpan: ${error.message}`, 'error');
      })
      .finally(() => {
        setGlobalLoading(false);
      });
  }

  function muatDataNilaiSiswa(idSiswa, mapel) {
    resetFormInputNilai();
    const agama = selectAgama.value;
    
    // Tampilkan/sembunyikan input agama
    const isPai = mapel.toLowerCase().includes('pendidikan agama');
    document.getElementById('agama-fields').style.display = isPai ? 'block' : 'none';
    
    // Jika PAI tapi agama belum dipilih, jangan lanjutkan
    if (isPai && !agama) {
      showNotification('Silakan pilih Agama siswa terlebih dahulu.', 'info');
      document.getElementById('cp-fields').style.display = 'none';
      return;
    }
    
    // Tampilkan/sembunyikan input mulok
    document.getElementById('mulok-fields').style.display = isMulokActive ? 'block' : 'none';
    document.getElementById('cp-fields').style.display = isMulokActive ? 'none' : 'block';

    setGlobalLoading(true);

    fetchData('getNilaiSiswa', { idSiswa, mapel, agama })
      .then(response => {
        const data = response.data;
        
        // 1. Isi Nilai & Deskripsi (jika ada)
        document.getElementById('input-nilai-akhir').value = data.nilai.nilai_akhir || '';
        document.getElementById('input-deskripsi-tercapai').value = data.nilai.deskripsi_tercapai || '';
        document.getElementById('input-deskripsi-bimbingan').value = data.nilai.deskripsi_bimbingan || '';

        // 2. Render Pilihan CP/TP
        renderCpSelection(data.cp_tp_list, data.nilai.cp_tercapai, data.nilai.cp_bimbingan);
        
        // 3. (BARU) Set frasa pembuka
        currentPembukaTercapai = data.frasa.pembuka_tercapai || "";
        currentPembukaBimbingan = data.frasa.pembuka_bimbingan || "";

      })
      .catch(error => {
        showNotification(`Gagal memuat data nilai: ${error.message}`, 'error');
      })
      .finally(() => {
        setGlobalLoading(false);
      });
  }

  function renderCpSelection(cpList, tercapaiList, bimbinganList) {
    const container = document.getElementById('cp-selection-list');
    container.innerHTML = ''; // Kosongkan
    currentSelectedCpStatuses = {};
    
    if (!cpList || cpList.length === 0) {
      container.innerHTML = '<p style="color:var(--muted)">Tidak ada CP/TP ditemukan untuk mapel/fase ini.</p>';
      return;
    }
    
    // Buat map status untuk pencarian cepat
    tercapaiList.forEach(id => currentSelectedCpStatuses[id] = 'tercapai');
    bimbinganList.forEach(id => currentSelectedCpStatuses[id] = 'bimbingan');

    cpList.forEach((item, index) => {
      const idTp = item.id_tp;
      const status = currentSelectedCpStatuses[idTp] || 'belum'; // 'tercapai', 'bimbingan', 'belum'
      
      const isTercapai = status === 'tercapai';
      const isBimbingan = status === 'bimbingan';
      const isBelum = status === 'belum';

      const element = document.createElement('div');
      element.className = 'cp-item';
      element.innerHTML = `
        <div style="font-weight: 500;">${item.deskripsi_tp}</div>
        <div class="cp-radio-group">
          <input type="radio" id="cp-${idTp}-1" name="cp-${idTp}" value="tercapai" data-id="${idTp}" ${isTercapai ? 'checked' : ''}>
          <label for="cp-${idTp}-1">Tercapai</label>
          <input type="radio" id="cp-${idTp}-2" name="cp-${idTp}" value="bimbingan" data-id="${idTp}" ${isBimbingan ? 'checked' : ''}>
          <label for="cp-${idTp}-2">Perlu Bimbingan</label>
          <input type="radio" id="cp-${idTp}-0" name="cp-${idTp}" value="belum" data-id="${idTp}" ${isBelum ? 'checked' : ''}>
          <label for="cp-${idTp}-0">Belum Dinilai</label>
        </div>
      `;
      container.appendChild(element);
    });
  }


  // --- Fungsi Setup Dropdown (Lanjutan, DI DALAM DOMContentLoaded) ---
  function setupSelectKelas(data) {
    if (!selectKelas) return;
    selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id_kelas;
      option.textContent = item.nama_kelas;
      selectKelas.appendChild(option);
    });
  }

  function setupSelectAgama(data) {
    if (!selectAgama) return;
    selectAgama.innerHTML = '<option value="">-- Pilih Agama Siswa --</option>';
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      selectAgama.appendChild(option);
    });
  }

  function setupSelectSiswa(data) {
    if (!selectSiswa) return;
    selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>';
    data.sort((a, b) => a.nama.localeCompare(b.nama)); // Urutkan nama
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id_siswa;
      option.textContent = item.nama;
      selectSiswa.appendChild(option);
    });
  }

  function setupSelectMapel(data) {
    if (!selectMapel) return;
    selectMapel.innerHTML = '<option value="">-- Pilih Mapel --</option>';
    data.sort((a, b) => a.mapel.localeCompare(b.mapel)); // Urutkan mapel
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.mapel;
      option.textContent = item.mapel;
      selectMapel.appendChild(option);
    });
  }
  
  // --- Logika Halaman Data Siswa (DI DALAM DOMContentLoaded) ---
  if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener('click', () => {
      // Logika download template
      showNotification('Fungsi download template belum siap.', 'info');
    });
  }

  if (importCsvBtn) {
    importCsvBtn.addEventListener('click', () => {
      csvFileInput.click(); // Memicu input file
    });
  }

  if (csvFileInput) {
    csvFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        handleCsvUpload(file);
      }
    });
  }

  if (toggleSiswaListBtn) {
    toggleSiswaListBtn.addEventListener('click', () => {
      const isHidden = siswaTableContainer.style.display === 'none';
      siswaTableContainer.style.display = isHidden ? 'block' : 'none';
      toggleSiswaListBtn.textContent = isHidden ? 'Sembunyikan Daftar Siswa' : 'Tampilkan Daftar Siswa';
      if (isHidden && siswaTableBody.innerHTML === '') {
        // Jika baru ditampilkan dan tabel kosong, muat datanya
        muatDataSemuaSiswa();
      }
    });
  }

  // --- Fungsi Halaman Data Siswa (DI DALAM DOMContentLoaded) ---
  function handleCsvUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      setGlobalLoading(true);
      showNotification('Mengimpor data siswa...', 'info');

      fetchData('imporSiswaCSV', { csvText: text })
        .then(response => {
          showNotification(response.message || 'Impor selesai.', 'success');
          // Muat ulang data siswa global dan muat ulang tabel jika ditampilkan
          google.script.run.getInitialData(); // Panggil ulang data awal
          if (siswaTableContainer.style.display === 'block') {
            muatDataSemuaSiswa();
          }
        })
        .catch(error => {
          showNotification(`Gagal impor: ${error.message}`, 'error');
        })
        .finally(() => {
          setGlobalLoading(false);
          csvFileInput.value = ''; // Reset input file
        });
    };
    reader.readAsText(file);
  }

  function muatDataSemuaSiswa() {
    siswaTableBody.innerHTML = '<tr><td colspan="5">Memuat data...</td></tr>';
    
    // Ambil data siswa terbaru (karena 'allSiswaData' mungkin kadaluarsa)
    fetchData('getSemuaSiswa')
      .then(response => {
        allSiswaData = response.data; // Update data global
        renderTabelSiswa(allSiswaData);
      })
      .catch(error => {
        siswaTableBody.innerHTML = `<tr><td colspan="5">Gagal memuat: ${error.message}</td></tr>`;
        showNotification(error.message, 'error');
      });
  }

  function renderTabelSiswa(data) {
    siswaTableBody.innerHTML = '';
    if (!data || data.length === 0) {
      siswaTableBody.innerHTML = '<tr><td colspan="5">Tidak ada data siswa.</td></tr>';
      return;
    }
    
    data.sort((a, b) => a.nama.localeCompare(b.nama)); // Urutkan
    
    data.forEach(siswa => {
      const row = document.createElement('tr');
      
      // Cari nama kelas
      const kelas = allKelasData.find(k => k.id_kelas === siswa.id_kelas);
      const namaKelas = kelas ? kelas.nama_kelas : '(Belum ada kelas)';
      
      row.innerHTML = `
        <td>${siswa.nama}</td>
        <td>${siswa.nisn || '-'}</td>
        <td>${siswa.nis || '-'}</td>
        <td>${namaKelas}</td>
        <td>
          <button class="btn ghost small btn-edit-siswa" data-id="${siswa.id_siswa}">Edit</button>
          <button class="btn ghost small btn-delete-siswa" data-id="${siswa.id_siswa}" style="--danger: #dc3545; color:var(--danger); border-color:var(--danger);">Hapus</button>
        </td>
      `;
      siswaTableBody.appendChild(row);
    });
  }

  // --- Setup Navigasi (dari file asli Anda) ---
  // (CATATAN: Blok 'setupNavButton' Anda yang lama dihapus karena duplikat dengan 'Kode Tambahan Chatgbt')
  
  /* === (PERBAIKAN) Event Listener untuk Halaman Profil === */
  if (btnSimpanProfil) {
    btnSimpanProfil.addEventListener('click', (e) => {
      e.preventDefault(); // Mencegah form submit
      // Pass semua elemen yang relevan ke fungsi
      simpanDataProfil(profilInputs, btnSimpanProfil, profilLoadingSpinner);
    });
  }
  
  if (inputLogoFile) {
    inputLogoFile.addEventListener('change', (event) => {
      // Pass semua elemen yang relevan ke fungsi
      handleLogoUpload(event, profilInputs, btnSimpanProfil, profilLoadingSpinner);
    });
  }
  /* === (SELESAI) Event Listener Profil === */


  // Kode Tambahan Chatgbt (Ini adalah kode navigasi utama Anda)
  // === Navigasi antar halaman ===
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Sembunyikan semua halaman
      document.querySelectorAll('.content-page').forEach(p => p.style.display = 'none');

      // Hilangkan class aktif di semua menu
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

      // Ambil target page dari atribut data-page
      const targetPage = e.currentTarget.dataset.page;
      const pageElement = document.getElementById(targetPage);

      // Tampilkan halaman yang diklik
      if (pageElement) {
        pageElement.style.display = 'block';
        e.currentTarget.classList.add('active'); // Tambahkan class aktif ke menu yang diklik
      }
      
      // Jika yang diklik adalah 'Data Siswa', muat datanya
      if (targetPage === 'page-data-siswa' && siswaTableContainer.style.display === 'block') {
        muatDataSemuaSiswa();
      }
    });
  });

}); // --- AKHIR DARI DOMContentLoaded ---
