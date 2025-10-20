/* === Dashboard JS - Tes Listener Logout Super Minimalis === */
console.log("[SUPER-MIN] Memulai dashboard.js..."); // Log 1

document.addEventListener("DOMContentLoaded", () => {
    console.log("[SUPER-MIN] DOMContentLoaded fired."); // Log 2

    try {
        const logoutBtn = document.getElementById('logout-button');
        console.log("[SUPER-MIN] Mencari #logout-button:", logoutBtn); // Log 3

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("[SUPER-MIN] Tombol Logout DIKLIK!"); // Log 4
                alert("Tes Klik Logout via JS OK!");
                // Tambahkan konfirmasi logout jika perlu
                // if (confirm("Yakin logout?")) {
                //     localStorage.clear();
                //     window.location.href = 'index.html';
                // }
            });
            console.log("[SUPER-MIN] Listener Logout BERHASIL ditambahkan."); // Log 5
        } else {
            console.error("[SUPER-MIN] Tombol Logout (#logout-button) TIDAK DITEMUKAN!"); // Log 6
        }
    } catch (error) {
        console.error("[SUPER-MIN] Error di dalam DOMContentLoaded:", error); // Log 7
        alert("Error saat pasang listener: " + error.message);
    }

    console.log("[SUPER-MIN] Akhir event DOMContentLoaded."); // Log 8
});

console.log("[SUPER-MIN] Akhir file dashboard.js."); // Log 9
