//
// !!! PENTING !!!
// GANTI URL DI BAWAH INI DENGAN URL APLIKASI WEB ANDA YANG BARU
// (setelah Anda men-deploy ulang Code.gs)
//
const GAS_URL = "https://script.google.com/macros/s/AKfycbxhyLw9GMGq58Z3RkdhlwgY-fAtVx98wpQnGTHUi9sNPHUyRQ03U_XemlHfmI7z-7GBkQ/exec";

// ----- Elemen DOM -----
const tabButtons = document.querySelectorAll(".tab-button");
const formContents = document.querySelectorAll(".form-content");

const formToken = document.getElementById("formToken");
const formRegister = document.getElementById("formRegister");
const formLogin = document.getElementById("formLogin");

const tokenStep = document.getElementById("token-step");
const registerStep = document.getElementById("register-step");
const messageArea = document.getElementById("message-area");

// --- ELEMEN BARU ---
const namaSekolahGroup = document.getElementById("nama-sekolah-group");
const registerNamaSekolah = document.getElementById("register-nama-sekolah");

// ----- Logika Ganti Tab -----
tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        tabButtons.forEach(btn => btn.classList.remove("active"));
        formContents.forEach(content => content.classList.remove("active"));
        
        button.classList.add("active");
        document.getElementById(button.dataset.tab).classList.add("active");
        hideMessage();
        
        // Reset form registrasi jika pindah tab
        resetRegisterForm();
    });
});

// ----- Logika Validasi Token (SUDAH DI-UPGRADE) -----
formToken.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = document.getElementById("token").value;
    const button = document.getElementById("token-button");
    
    setLoading(button, true, "Memvalidasi...");

    try {
        const response = await fetch(`${GAS_URL}?action=validateToken&token=${token}`);
        const result = await response.json();

        if (result.success) {
            showMessage(result.message, "success");
            
            // Tampilkan form registrasi
            tokenStep.style.display = "none";
            registerStep.style.display = "block";
            
            // Simpan token yang valid
            document.getElementById("register-token").value = token;

            // --- LOGIKA BARU ---
            // Jika ini user pertama, tampilkan isian Nama Sekolah
            if (result.isFirstUser) {
                namaSekolahGroup.style.display = "block";
                registerNamaSekolah.required = true; // Wajibkan
            } else {
                namaSekolahGroup.style.display = "none";
                registerNamaSekolah.required = false; // Tidak wajib
            }
            // --- AKHIR LOGIKA BARU ---

        } else {
            showMessage(result.message, "error");
        }
    } catch (error) {
        showMessage("Terjadi kesalahan jaringan. Coba lagi.", "error");
    } finally {
        setLoading(button, false, "Validasi Token");
    }
});

// ----- Logika Registrasi (SUDAH DI-UPGRADE) -----
formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = document.getElementById("register-button");
    
    // Kumpulkan data (termasuk data baru)
    const data = {
        action: "registerUser",
        token: document.getElementById("register-token").value,
        nama_sekolah: document.getElementById("register-nama-sekolah").value, // field baru
        name: document.getElementById("register-name").value,
        nip: document.getElementById("register-nip").value, // field baru
        username: document.getElementById("register-username").value,
        password: document.getElementById("register-password").value
    };

    setLoading(button, true, "Mendaftarkan...");

    try {
        const response = await fetch(GAS_URL, {
            method: "POST",
            mode: "cors",
            redirect: "follow",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "text/plain;charset=utf-8", 
            }
        });
        const result = await response.json();

        if (result.success) {
            showMessage(result.message, "success");
            // Pindahkan ke tab login setelah berhasil
            document.querySelector('.tab-button[data-tab="login-form"]').click();
            resetRegisterForm();
        } else {
            showMessage(result.message, "error");
        }
    } catch (error) {
        showMessage("Terjadi kesalahan jaringan saat mendaftar.", "error");
    } finally {
        setLoading(button, false, "Daftar Akun");
    }
});

// ----- Logika Login (SUDAH DI-UPGRADE) -----
formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = document.getElementById("login-button");

    const data = {
        action: "login",
        username: document.getElementById("login-username").value,
        password: document.getElementById("login-password").value
    };

    setLoading(button, true, "Mencoba Masuk...");

    try {
        const response = await fetch(GAS_URL, {
            method: "POST",
            mode: "cors",
            redirect: "follow",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            }
        });
        const result = await response.json();

        if (result.success) {
            // --- LOGIKA BARU ---
            // Simpan SEMUA data user ke localStorage
            localStorage.setItem('userName', result.user.name);
            localStorage.setItem('userUsername', result.user.username); // (id_guru)
            localStorage.setItem('spreadsheetId', result.user.spreadsheetId); // SANGAT PENTING
            // --- AKHIR LOGIKA BARU ---

            // Arahkan ke dashboard
            window.location.href = "dashboard.html";
        } else {
            showMessage(result.message, "error");
        }
    } catch (error) {
        showMessage("Terjadi kesalahan jaringan saat login.", "error");
    } finally {
        setLoading(button, false, "Masuk");
    }
});


// ----- Fungsi Bantuan Tampilan -----

function setLoading(button, isLoading, text) {
    button.disabled = isLoading;
    button.innerText = text;
}

function showMessage(message, type) {
    messageArea.style.display = "block";
    messageArea.className = type;
    messageArea.innerText = message;
}

function hideMessage() {
    messageArea.style.display = "none";
}

function resetRegisterForm() {
    // Fungsi untuk membersihkan form registrasi
    formRegister.reset();
    tokenStep.style.display = "block";
    registerStep.style.display = "none";
    namaSekolahGroup.style.display = "none";
    registerNamaSekolah.required = false;
}
