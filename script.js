// --- KONFIGURASI SUPABASE ---
// GANTI DENGAN URL DAN KEY DARI PROJECT SUPABASE ANDA
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co'; 
const SUPABASE_KEY = 'eyJxhGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....'; // Ini Anon Key

// PERBAIKAN: Menggunakan variabel 'sb' agar tidak bentrok dengan library 'supabase'
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* --- NAVIGASI HALAMAN (SPA) --- */
const homeSection = document.getElementById('home-page');
const detailSection = document.getElementById('detail-page');
const profileSection = document.getElementById('profile-page');
const pageTitle = document.getElementById('page-title');

// 1. Fungsi Ganti Halaman
function goToPage(pageId, titleName) {
    // Sembunyikan semua page
    homeSection.classList.remove('active');
    detailSection.classList.remove('active');
    profileSection.classList.remove('active');

    if (pageId === 'home-page') {
        homeSection.classList.add('active');
        // Bersihkan hash url
        history.pushState("", document.title, window.location.pathname);
    } 
    else if (pageId === 'profile-user') {
        profileSection.classList.add('active');
        checkUserSession(); // Update email display
    }
    else {
        // Halaman Detail Produk
        detailSection.classList.add('active');
        if (titleName) pageTitle.innerText = titleName;
    }
    
    window.scrollTo(0, 0);
}

// 2. Tombol Kembali
function goBack() {
    homeSection.classList.add('active');
    detailSection.classList.remove('active');
    profileSection.classList.remove('active');
}

// 3. Handle Profile Click di Navbar Bawah
async function handleProfileClick() {
    // Cek apakah user sudah login
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        goToPage('profile-user', 'Profil Saya');
    } else {
        openAuthModal(); // Buka Pop-up Login
    }
}


/* --- LOGIKA AUTH MODAL (POP UP) --- */

const authModal = document.getElementById('auth-modal');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const formForgot = document.getElementById('form-forgot');
const formUpdatePass = document.getElementById('form-update-pass');
const authTitle = document.getElementById('auth-header-title');
const authAlert = document.getElementById('auth-alert');
const headerAuthSection = document.getElementById('header-auth-section');
const userEmailDisplay = document.getElementById('user-email-display');

// Buka Modal
function openAuthModal() {
    if(authModal) {
        authModal.style.display = 'flex';
        switchAuthMode('login'); // Default ke login
        document.body.style.overflow = 'hidden'; // Kunci scroll background
    } else {
        console.error("Elemen auth-modal tidak ditemukan!");
    }
}

// Tutup Modal
function closeAuthModal() {
    if(authModal) {
        authModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Buka kunci scroll
        if(authAlert) authAlert.style.display = 'none';
    }
}

// Tutup Modal jika klik di luar kotak putih
window.onclick = function(event) {
    if (event.target == authModal) {
        closeAuthModal();
    }
}

// Helper: Tampilkan Pesan Alert
function showAlert(message, type) {
    if(authAlert) {
        authAlert.style.display = 'block';
        authAlert.className = `auth-alert ${type}`;
        authAlert.innerText = message;
    } else {
        alert(message); // Fallback jika elemen tidak ada
    }
}

// Helper: Ganti Mode Form (Login/Daftar/Lupa)
function switchAuthMode(mode) {
    if(formLogin) formLogin.style.display = 'none';
    if(formRegister) formRegister.style.display = 'none';
    if(formForgot) formForgot.style.display = 'none';
    if(formUpdatePass) formUpdatePass.style.display = 'none';
    if(authAlert) authAlert.style.display = 'none';

    if (mode === 'login') {
        formLogin.style.display = 'block';
        authTitle.innerText = 'Masuk Akun';
    } else if (mode === 'register') {
        formRegister.style.display = 'block';
        authTitle.innerText = 'Daftar Akun';
    } else if (mode === 'forgot') {
        formForgot.style.display = 'block';
        authTitle.innerText = 'Lupa Password';
    } else if (mode === 'update') {
        formUpdatePass.style.display = 'block';
        authTitle.innerText = 'Reset Password';
    }
}

// 1. FUNGSI LOGIN
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if (!email || !pass) return showAlert("Email dan password wajib diisi", "error");

    const { data, error } = await sb.auth.signInWithPassword({
        email: email,
        password: pass,
    });

    if (error) {
        showAlert("Login Gagal: " + error.message, "error");
    } else {
        showAlert("Login Berhasil!", "success");
        setTimeout(() => {
            closeAuthModal();
            updateUI(data.session);
        }, 1000);
    }
}

// 2. FUNGSI REGISTER
async function handleRegister() {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if (!email || !pass) return showAlert("Isi semua data", "error");
    if (pass.length < 6) return showAlert("Password minimal 6 karakter", "error");

    const { data, error } = await sb.auth.signUp({
        email: email,
        password: pass,
    });

    if (error) {
        showAlert("Daftar Gagal: " + error.message, "error");
    } else {
        showAlert("Berhasil! Silakan cek email untuk verifikasi.", "success");
    }
}

// 3. FUNGSI LUPA PASSWORD
async function handleForgotPass() {
    const email = document.getElementById('forgot-email').value;
    if (!email) return showAlert("Masukkan email Anda", "error");

    const { data, error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href, 
    });

    if (error) {
        showAlert("Gagal: " + error.message, "error");
    } else {
        showAlert("Link reset password telah dikirim ke email!", "success");
    }
}

// 4. FUNGSI UPDATE PASSWORD
async function handleUpdatePass() {
    const newPass = document.getElementById('new-pass').value;
    if (!newPass) return showAlert("Masukkan password baru", "error");

    const { data, error } = await sb.auth.updateUser({
        password: newPass
    });

    if (error) {
        showAlert("Gagal update password: " + error.message, "error");
    } else {
        showAlert("Password berhasil diubah! Silakan login.", "success");
        setTimeout(() => switchAuthMode('login'), 1500);
    }
}

// 5. FUNGSI LOGOUT
async function handleLogout() {
    const { error } = await sb.auth.signOut();
    if (!error) {
        goBack(); // Ke home
        // updateUI dipanggil oleh onAuthStateChange
    }
}

// 6. UPDATE UI HEADER
function updateUI(session) {
    if (!headerAuthSection) return;

    if (session) {
        // Jika Login: Tampilkan Foto Profil
        headerAuthSection.innerHTML = `
            <img src="https://api.deline.web.id/76NssFHmcI.png" class="profile-pic" style="display:block;" onclick="goToPage('profile-user', 'Profil')">
        `;
        // Update foto profil di navbar bawah juga jika ada
        const navProfileImg = document.getElementById('nav-profile-img');
        if(navProfileImg) navProfileImg.src = "https://api.deline.web.id/76NssFHmcI.png"; 

    } else {
        // Jika Belum Login: Tampilkan Tombol Login
        headerAuthSection.innerHTML = `
             <span class="btn-login-header" onclick="openAuthModal()">Masuk / Daftar</span>
        `;
    }
}

// 7. CEK SESSION SAAT WEB DIBUKA
async function checkUserSession() {
    const { data: { session } } = await sb.auth.getSession();
    updateUI(session);
    if(session && userEmailDisplay) {
        userEmailDisplay.innerText = session.user.email;
    }
}

// LISTENER: Mendeteksi Perubahan Auth
sb.auth.onAuthStateChange((event, session) => {
    updateUI(session);
    
    if (event === 'PASSWORD_RECOVERY') {
        openAuthModal();
        switchAuthMode('update');
    }
});

// Jalankan saat load
checkUserSession();


/* --- SLIDER LOGIC --- */
const wrapper = document.getElementById('slider-wrapper');
const container = document.getElementById('slider-container');
const dots = document.querySelectorAll('.dot');
const totalSlides = 3;
let currentIndex = 0;
let autoSlideInterval;
let startX = 0;
let endX = 0;

function updateSlider() {
    if(!wrapper) return;
    wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach(d => d.classList.remove('active'));
    if(dots[currentIndex]) dots[currentIndex].classList.add('active');
}
function nextSlide() {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSlider();
}
function startAutoSlide() {
    stopAutoSlide(); 
    autoSlideInterval = setInterval(nextSlide, 3000);
}
function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}
if (container) {
    container.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; stopAutoSlide(); });
    container.addEventListener('touchmove', (e) => { endX = e.touches[0].clientX; });
    container.addEventListener('touchend', () => {
        if (startX > endX + 50) nextSlide();
        else if (startX < endX - 50) { currentIndex = (currentIndex - 1 + totalSlides) % totalSlides; updateSlider(); }
        startAutoSlide();
    });
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            stopAutoSlide();
            currentIndex = parseInt(e.target.dataset.index);
            updateSlider();
            startAutoSlide();
        });
    });
    startAutoSlide();
}

/* --- SEARCH OVERLAY --- */
const searchInput = document.getElementById('searchInput');
const searchOverlay = document.getElementById('searchOverlay');
const header = document.getElementById('mainHeader');
const closeSearchBtn = document.getElementById('closeSearchBtn');

if (searchInput && searchOverlay && header && closeSearchBtn) {
    searchInput.addEventListener('focus', () => {
        const headerHeight = header.offsetHeight;
        searchOverlay.style.top = headerHeight + 'px';
        searchOverlay.style.height = `calc(100vh - ${headerHeight}px)`;
        searchOverlay.classList.add('active');
        document.body.classList.add('lock-scroll');
    });
    closeSearchBtn.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
        document.body.classList.remove('lock-scroll');
        searchOverlay.style.height = '0';
        searchInput.blur();
    });
}
