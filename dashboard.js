/* === Dashboard JS - Tes Minimalis === */
console.log("[TEST] Memulai dashboard.js...");

document.addEventListener("DOMContentLoaded", () => {
    console.log("[TEST] DOMContentLoaded event fired.");

    try {
        // Tes Tombol Logout
        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) {
            console.log("[TEST] Tombol Logout ditemukan.");
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("[TEST] Tombol Logout DIKLIK!");
                alert("Tombol Logout berfungsi!");
                // Tambahkan logika logout asli jika perlu
                // if (confirm("Yakin logout?")) {
                //     localStorage.clear();
                //     window.location.href = 'index.html';
                // }
            });
            console.log("[TEST] Listener Logout ditambahkan.");
        } else {
            console.error("[TEST] Tombol Logout (#logout-button) TIDAK DITEMUKAN!");
        }

        // Tes Link Navigasi Pertama (Dashboard Home)
        const firstNavLink = document.querySelector('.nav-link[data-page="page-home"]');
        if (firstNavLink) {
             console.log("[TEST] Link Navigasi Home ditemukan.");
             firstNavLink.addEventListener('click', (e) => {
                 e.preventDefault();
                 console.log("[TEST] Link Navigasi Home DIKLIK!");
                 alert("Link Navigasi Home berfungsi!");
                 // Logika pindah halaman bisa ditambahkan di sini
             });
             console.log("[TEST] Listener Navigasi Home ditambahkan.");
        } else {
             console.warn("[TEST] Link Navigasi Home (.nav-link[data-page='page-home']) TIDAK DITEMUKAN!");
        }

        // Tes Tombol Simpan (hanya cek elemen)
        const simpanBtnTest = document.getElementById('simpan-nilai-btn');
        if (simpanBtnTest) {
            console.log("[TEST] Tombol Simpan (#simpan-nilai-btn) DITEMUKAN.");
             simpanBtnTest.addEventListener('click', (e) => {
                 e.preventDefault();
                 console.log("[TEST] Tombol Simpan DIKLIK! (Test Listener)");
                 alert("Tombol Simpan berfungsi! (Test Listener)");
             });
             console.log("[TEST] Listener Tombol Simpan (Test) ditambahkan.");
        } else {
             console.error("[TEST] Tombol Simpan (#simpan-nilai-btn) TIDAK DITEMUKAN!");
        }


    } catch (error) {
        console.error("[TEST] Error di dalam DOMContentLoaded:", error);
        alert("Terjadi error saat inisialisasi: " + error.message);
    }

    console.log("[TEST] Akhir event DOMContentLoaded.");
});

console.log("[TEST] Akhir file dashboard.js.");
