// js/login.js

// ⚠️ PASTIKAN KEDUA URL INI MENGGUNAKAN HASIL DEPLOYMENT TERBARU ANDA ⚠️

// URL untuk verifikasi TOKEN ke server PUSAT
const PUSAT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbySsp-hz1mKiGME-1c7eLQiRHKEoK3cf4nmIunJatceBMPWIiis7U-5JEQlkYJTaUZCyQ/exec";
// URL untuk verifikasi USERNAME/PASSWORD ke server SEKOLAH
const SEKOLAH_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwdzxboNRcNTXB25QjQl5kG3vgpORlm_GPNDpZG8tYdZjXkYpHkP0xTzPAEncBQPIaT/exec";

// -------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    // Ambil referensi ke semua elemen penting dari index.html
    const tokenContainer = document.getElementById('tokenFormContainer');
    const loginContainer = document.getElementById('loginFormContainer');
    const tokenForm = document.getElementById('tokenForm');
    const loginForm = document.getElementById('loginForm');

    // Fungsi untuk menampilkan form login token
    function showTokenForm() {
        tokenContainer.style.display = 'block';
        loginContainer.style.display = 'none';
    }

    // Fungsi untuk menampilkan form login username/password
    function showLoginForm() {
        tokenContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    }

    // --- LOGIKA UTAMA SAAT HALAMAN DIBUKA ---
    // Memeriksa "tanda" dari halaman registrasi atau "dompet" browser
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const savedToken = localStorage.getItem("erapor_token");

    if (status === 'registered' || savedToken) {
        // Jika baru selesai registrasi ATAU sudah punya token, tampilkan form login user
        showLoginForm();
    } else {
        // Jika tidak, tampilkan form token
        showTokenForm();
    }
    // -----------------------------------------

    // --- LOGIKA SAAT FORM TOKEN DI-SUBMIT ---
    tokenForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tokenInput = document.getElementById('token').value.trim();
        const submitButton = tokenForm.querySelector('button');

        if (!tokenInput) {
            alert("Token tidak boleh kosong.");
            return;
        }

        submitButton.textContent = 'Memverifikasi...';
        submitButton.disabled = true;

        try {
            // Kirim token ke server PUSAT untuk diverifikasi
            const verificationUrl = `${PUSAT_WEBAPP_URL}?action=checkToken&token=${encodeURIComponent(tokenInput)}`;
            const res = await fetch(verificationUrl);
            const json = await res.json();

            if (json.success) {
                alert("Token sekolah berhasil diverifikasi!");
                localStorage.setItem("erapor_token", tokenInput);
                showLoginForm(); // Pindah ke form login user
            } else {
                alert("Verifikasi Gagal: " + (json.message || "Token tidak valid."));
            }
        } catch (err) {
            alert("Tidak dapat terhubung ke server pusat. Periksa koneksi internet Anda.");
        } finally {
            submitButton.textContent = 'Verifikasi Token';
            submitButton.disabled = false;
        }
    });

    // --- LOGIKA SAAT FORM LOGIN DI-SUBMIT ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            // Kirim username/password ke server SEKOLAH untuk login
            const res = await fetch(SEKOLAH_WEBAPP_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "loginUser",
                    username: username,
                    password: password
                }),
            });

            const json = await res.json();
            if (json.success) {
                alert("Login berhasil! Mengarahkan ke dashboard...");
                // Simpan "tiket masuk" pengguna ke dompet browser
                localStorage.setItem("user_info", JSON.stringify(json.user));
                window.location.href = 'dashboard.html';
            } else {
                alert("Login Gagal: " + json.message);
            }
        } catch (err) {
            alert("Tidak dapat terhubung ke server sekolah.");
        }
    });
});

