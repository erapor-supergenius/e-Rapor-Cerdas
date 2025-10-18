//
// !!! PENTING !!!
// GANTI URL DI BAWAH INI DENGAN URL APLIKASI WEB ANDA
// (yang Anda dapat dari Langkah 3)
//
const GAS_URL = "https://script.google.com/macros/s/AKfycbzKqIVZbNLOUWOF-5GFRia26wIMDLU92mutlLt2wlLqO0DqYKRxykTr085Bw11aMETV1w/exec";

// ----- Elemen DOM -----
const tabButtons = document.querySelectorAll(".tab-button");
const formContents = document.querySelectorAll(".form-content");

const formToken = document.getElementById("formToken");
const formRegister = document.getElementById("formRegister");
const formLogin = document.getElementById("formLogin");

const tokenStep = document.getElementById("token-step");
const registerStep = document.getElementById("register-step");
const messageArea = document.getElementById("message-area");

// ----- Logika Ganti Tab -----
tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        // Hapus aktif dari semua tombol & konten
        tabButtons.forEach(btn => btn.classList.remove("active"));
        formContents.forEach(content => content.classList.remove("active"));
        
        // Tambah aktif ke yang diklik
        button.classList.add("active");
        document.getElementById(button.dataset.tab).classList.add("active");
        
        // Sembunyikan pesan
        hideMessage();
    });
});

// ----- Logika Validasi Token -----
formToken.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = document.getElementById("token").value;
    const button = document.getElementById("token-button");
    
    setLoading(button, true, "Memvalidasi...");

    try {
        // Kirim permintaan GET ke Apps Script
        const response = await fetch(`${GAS_URL}?action=validateToken&token=${token}`);
        const result = await response.json();

        if (result.success) {
            showMessage(result.message, "success");
            // Sembunyikan form token, tampilkan form registrasi
            tokenStep.style.display = "none";
            registerStep.style.display = "block";
            // Simpan token yang valid di form registrasi
            document.getElementById("register-token").value = token;
        } else {
            showMessage(result.message, "error");
        }
    } catch (error) {
        showMessage("Terjadi kesalahan jaringan. Coba lagi.", "error");
    } finally {
        setLoading(button, false, "Validasi Token");
    }
});

// ----- Logika Registrasi -----
formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = document.getElementById("register-button");
    
    // Kumpulkan data
    const data = {
        action: "registerUser",
        token: document.getElementById("register-token").value,
        name: document.getElementById("register-name").value,
        username: document.getElementById("register-username").value,
        password: document.getElementById("register-password").value
    };

    setLoading(button, true, "Mendaftarkan...");

    try {
        // Kirim permintaan POST ke Apps Script
        const response = await fetch(GAS_URL, {
            method: "POST",
            mode: "cors", // Diperlukan untuk komunikasi lintas domain
            redirect: "follow",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "text/plain;charset=utf-8", // GAS memerlukan ini
            }
        });
        const result = await response.json();

        if (result.success) {
            showMessage(result.message, "success");
            // Pindahkan ke tab login setelah berhasil
            document.querySelector('.tab-button[data-tab="login-form"]').click();
            formRegister.reset();
            tokenStep.style.display = "block";
            registerStep.style.display = "none";
        } else {
            showMessage(result.message, "error");
        }
    } catch (error) {
        showMessage("Terjadi kesalahan jaringan saat mendaftar.", "error");
    } finally {
        setLoading(button, false, "Daftar Akun");
    }
});

// ----- Logika Login -----
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
            // Simpan data "sesi" di localStorage
            localStorage.setItem('userName', result.user.name);
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
    messageArea.className = type; // "success" atau "error"
    messageArea.innerText = message;
}

function hideMessage() {
    messageArea.style.display = "none";
}