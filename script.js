/* ========================================= */
/* --- KONFIGURASI SUPABASE --- */
/* ========================================= */

// 1. Masukkan URL dan ANON KEY dari Dashboard Supabase Anda di sini
const supabaseUrl = 'https://qxjefdaojlctmlktztkt.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4amVmZGFvamxjdG1sa3R6dGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjAxMDcsImV4cCI6MjA4MDA5NjEwN30.vFpaoqAqSBOo1WiUECxK3uPApHfv60plfJxWrv36pCk'; 

// Inisialisasi Client
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variabel Sementara
let tempEmailForVerification = "";


/* ========================================= */
/* --- AUTH SYSTEM LOGIC (UPDATED) --- */
/* ========================================= */

// Cek Status Login Saat Load
window.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    updateUIBasedOnAuth(user);
    
    // Logic SPA
    const hash = window.location.hash.substring(1);
    if (hash) renderPage(hash, null);
    else {
        const home = document.getElementById('home-page');
        if(home) home.classList.add('active');
    }
});

// Update Tampilan (Sembunyikan Login, Munculkan Profile)
function updateUIBasedOnAuth(user) {
    const loginBtn = document.getElementById('btnLoginMain');
    const profileIcon = document.getElementById('userProfileIcon');
    const authModal = document.getElementById('authModal');

    if (user) {
        if(loginBtn) loginBtn.style.display = 'none';
        if(profileIcon) profileIcon.style.display = 'flex';
        if(authModal) authModal.classList.remove('active');
    } else {
        if(loginBtn) loginBtn.style.display = 'block';
        if(profileIcon) profileIcon.style.display = 'none';
    }
}

// Buka/Tutup Modal
const btnLoginMain = document.getElementById('btnLoginMain');
if (btnLoginMain) {
    btnLoginMain.addEventListener('click', () => toggleAuthModal(true));
}

function toggleAuthModal(show) {
    const modal = document.getElementById('authModal');
    if (show) {
        modal.classList.add('active');
        switchAuthMode('login'); // Default ke login
    } else {
        modal.classList.remove('active');
    }
}

// --- SISTEM PERPINDAHAN MODE FORM (PENTING) ---
function switchAuthMode(mode) {
    // 1. Sembunyikan semua ID form
    ['loginForm', 'registerForm', 'verifyForm', 'forgotPasswordForm', 'resetPasswordForm'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    // 2. Tampilkan form yang dipilih
    if (mode === 'login') document.getElementById('loginForm').style.display = 'block';
    else if (mode === 'register') document.getElementById('registerForm').style.display = 'block';
    else if (mode === 'verify') document.getElementById('verifyForm').style.display = 'block';
    else if (mode === 'forgot') document.getElementById('forgotPasswordForm').style.display = 'block';
    else if (mode === 'reset') document.getElementById('resetPasswordForm').style.display = 'block';
}

// --- 1. FUNGSI LOGIN ---
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;

    if(!email || !pass) { alert("Isi email dan password!"); return; }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: pass
    });

    if (error) {
        alert("Gagal Login: " + error.message);
    } else {
        updateUIBasedOnAuth(data.user);
    }
}

// --- 2. FUNGSI REGISTER ---
async function handleRegister() {
    const username = document.getElementById('regUsername').value;
    const phone = document.getElementById('regPhone').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    const confirmPass = document.getElementById('regConfirmPassword').value;

    if (pass !== confirmPass) { alert("Password tidak sama!"); return; }
    if (!username || !email || !pass) { alert("Isi semua data!"); return; }

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: pass,
        options: {
            data: { username: username, phone: phone, full_name: username }
        }
    });

    if (error) {
        alert("Gagal Daftar: " + error.message);
    } else {
        tempEmailForVerification = email;
        alert("Kode verifikasi dikirim ke: " + email);
        switchAuthMode('verify');
    }
}

// --- 3. FUNGSI VERIFIKASI OTP (Saat Daftar) ---
async function handleVerifyOtp() {
    const code = document.getElementById('otpCode').value;
    if(!code) { alert("Masukkan kode!"); return; }

    const { data, error } = await supabase.auth.verifyOtp({
        email: tempEmailForVerification,
        token: code,
        type: 'signup'
    });

    if (error) {
        alert("Kode Salah/Kadaluarsa: " + error.message);
    } else {
        alert("Verifikasi Berhasil! Anda telah login.");
        updateUIBasedOnAuth(data.user);
    }
}

// --- 4. REQUEST LUPA PASSWORD (Kirim Kode) ---
async function handleForgotPasswordRequest() {
    const email = document.getElementById('forgotEmail').value;
    if (!email) { alert("Masukkan email Anda!"); return; }

    // Simpan email sementara untuk step reset
    tempEmailForVerification = email;

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
        alert("Gagal kirim kode: " + error.message);
    } else {
        alert("Kode pemulihan telah dikirim ke " + email + ". Cek inbox/spam.");
        switchAuthMode('reset');
    }
}

// --- 5. VERIFIKASI & UBAH PASSWORD ---
async function handleResetPasswordFinal() {
    const otp = document.getElementById('resetOtpCode').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmNewPassword').value;

    if (!otp || !newPass || !confirmPass) {
        alert("Mohon isi semua data!"); return;
    }
    if (newPass !== confirmPass) {
        alert("Password baru tidak cocok!"); return;
    }

    // A. Verifikasi Kode
    const { data, error } = await supabase.auth.verifyOtp({
        email: tempEmailForVerification,
        token: otp,
        type: 'recovery'
    });

    if (error) {
        alert("Kode salah atau kadaluarsa: " + error.message);
    } else {
        // B. Update Password User
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPass
        });

        if (updateError) {
            alert("Gagal memperbarui password: " + updateError.message);
        } else {
            alert("Password berhasil diubah! Silakan login dengan password baru.");
            await supabase.auth.signOut(); // Logout sesi recovery
            switchAuthMode('login'); // Kembali ke login
        }
    }
}

// --- FUNGSI LOGOUT ---
const navLogoutBtn = document.getElementById('navLogoutBtn');
if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', async () => {
        if(confirm("Yakin ingin keluar?")) {
            const { error } = await supabase.auth.signOut();
            if (!error) {
                window.location.reload();
            }
        }
    });
}


/* ========================================= */
/* --- NAVIGASI HALAMAN (SPA) LAMA --- */
/* ========================================= */
const homeSection = document.getElementById('home-page');
const detailSection = document.getElementById('detail-page');
const pageTitle = document.getElementById('page-title');

function goToPage(pageId, titleName) {
    window.location.hash = pageId;
    localStorage.setItem('currentTitle', titleName);
    renderPage(pageId, titleName);
}

function renderPage(pageId, titleName) {
    homeSection.classList.remove('active');
    detailSection.classList.add('active');
    window.scrollTo(0, 0);

    if (titleName) {
        pageTitle.innerText = titleName;
    } else {
        pageTitle.innerText = localStorage.getItem('currentTitle') || 'Detail Kategori';
    }
}

function goBack() {
    history.pushState("", document.title, window.location.pathname + window.location.search);
    detailSection.classList.remove('active');
    homeSection.classList.add('active');
}

window.addEventListener('popstate', () => {
    const hash = window.location.hash.substring(1);
    if (!hash) {
        detailSection.classList.remove('active');
        homeSection.classList.add('active');
    } else {
        renderPage(hash, null);
    }
});


/* ========================================= */
/* --- SLIDER & UI INTERACTION --- */
/* ========================================= */
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
    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        stopAutoSlide();
    });
    container.addEventListener('touchmove', (e) => {
        endX = e.touches[0].clientX;
    });
    container.addEventListener('touchend', () => {
        if (startX > endX + 50) nextSlide();
        else if (startX < endX - 50) {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateSlider();
        }
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

if (searchInput) {
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
