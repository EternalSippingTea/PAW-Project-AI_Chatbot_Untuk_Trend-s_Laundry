const authPanel = document.getElementById('member-auth-panel');
const orderPanel = document.getElementById('member-order-panel');
const loginForm = document.getElementById('member-login-form');
const registerForm = document.getElementById('member-register-form');
const orderForm = document.getElementById('member-order-form');
const serviceSelect = document.getElementById('order-service');

function showAuthTab(tab) {
    const loginActive = tab === 'login';
    loginForm.classList.toggle('hidden', !loginActive);
    registerForm.classList.toggle('hidden', loginActive);
    document.getElementById('member-login-tab').className = loginActive
        ? 'px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-slate-900 shadow-sm'
        : 'px-4 py-2 rounded-md text-sm font-medium transition-colors text-slate-500 hover:text-slate-700';
    document.getElementById('member-register-tab').className = loginActive
        ? 'px-4 py-2 rounded-md text-sm font-medium transition-colors text-slate-500 hover:text-slate-700'
        : 'px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-slate-900 shadow-sm';
}

function clearErrors(prefix, fields) {
    fields.forEach(field => {
        const element = document.getElementById(`${prefix}-${field}-error`);
        if (element) element.textContent = '';
    });
    const feedback = document.getElementById(`${prefix}-feedback`);
    if (feedback) feedback.textContent = '';
}

function showFieldErrors(prefix, fields) {
    const aliases = {
        'member-login': { nomor_hp: 'phone' },
        'member-register': { nama: 'name', nomor_hp: 'phone', alamat: 'address', konfirmasi_password: 'confirm' },
        order: { nama_pelanggan: 'name', nomor_hp: 'phone', layanan: 'service', alamat: 'address', catatan: 'notes' }
    };
    for (const [field, message] of Object.entries(fields || {})) {
        const element = document.getElementById(`${prefix}-${aliases[prefix][field] || field}-error`);
        if (element) element.textContent = message;
        else {
            const feedback = document.getElementById(`${prefix}-feedback`);
            if (feedback) feedback.textContent = message;
        }
    }
}

async function parseResponse(response) {
    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error('Server mengirim respons yang tidak dapat dibaca.');
    }
    if (!response.ok || data.success === false) {
        const error = new Error(data.error || 'Permintaan gagal. Silakan coba lagi.');
        error.fields = data.fields;
        throw error;
    }
    return data;
}

async function loadServices() {
    try {
        const response = await fetch('/api/produk');
        const services = await parseResponse(response);
        if (!Array.isArray(services)) throw new Error('Data layanan tidak valid.');
        serviceSelect.innerHTML = '<option value="">-- Pilih Layanan --</option>';
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.nama;
            option.textContent = `${service.nama} (Rp${Number(service.harga).toLocaleString('id-ID')}/${service.satuan})`;
            serviceSelect.appendChild(option);
        });
    } catch (error) {
        document.getElementById('order-feedback').textContent = error.message || 'Daftar layanan belum dapat dimuat.';
    }
}

function showMember(member) {
    authPanel.classList.add('hidden');
    orderPanel.classList.remove('hidden');
    document.getElementById('member-greeting').textContent = member.nama;
    document.getElementById('member-phone-display').textContent = member.nomor_hp;
    document.getElementById('order-name').value = member.nama;
    document.getElementById('order-phone').value = member.nomor_hp;
    document.getElementById('order-address').value = member.alamat || '';
}

function showAuthentication(message = '') {
    orderPanel.classList.add('hidden');
    authPanel.classList.remove('hidden');
    if (message) document.getElementById('member-login-feedback').textContent = message;
}

document.getElementById('member-login-tab').addEventListener('click', () => showAuthTab('login'));
document.getElementById('member-register-tab').addEventListener('click', () => showAuthTab('register'));

loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearErrors('member-login', ['phone', 'password']);
    const submit = document.getElementById('member-login-submit');
    const feedback = document.getElementById('member-login-feedback');

    const phone = document.getElementById('member-login-phone').value.trim();
    const password = document.getElementById('member-login-password').value;

    const errors = {};
    if (!phone) errors.nomor_hp = 'Nomor HP wajib diisi.';
    if (!password) errors.password = 'Password wajib diisi.';

    if (Object.keys(errors).length > 0) {
        showFieldErrors('member-login', errors);
        return;
    }

    submit.disabled = true;
    feedback.textContent = 'Memeriksa akun...';

    try {
        const response = await fetch('/api/member/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomor_hp: phone, password })
        });
        const data = await parseResponse(response);
        loginForm.reset();
        feedback.textContent = '';
        showMember(data.data);
    } catch (error) {
        showFieldErrors('member-login', error.fields);
        feedback.textContent = error instanceof TypeError
            ? 'Tidak dapat terhubung ke server. Silakan coba lagi.'
            : error.message;
    } finally {
        submit.disabled = false;
    }
});

const regNameInput = document.getElementById('member-register-name');
if (regNameInput) {
    regNameInput.addEventListener('input', () => {
        const val = regNameInput.value.trim();
        const err = document.getElementById('member-register-name-error');
        if (!err) return;
        if (/\d/.test(val)) {
            err.textContent = 'Nama tidak boleh mengandung angka.';
        } else {
            err.textContent = '';
        }
    });
}

registerForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearErrors('member-register', ['name', 'phone', 'address', 'password', 'confirm']);
    const submit = document.getElementById('member-register-submit');
    const feedback = document.getElementById('member-register-feedback');

    const nama = document.getElementById('member-register-name').value.trim();
    const phone = document.getElementById('member-register-phone').value.trim();
    const address = document.getElementById('member-register-address').value.trim();
    const password = document.getElementById('member-register-password').value;
    const confirm = document.getElementById('member-register-confirm').value;

    const errors = {};
    if (!nama) {
        errors.nama = 'Nama lengkap wajib diisi.';
    } else if (nama.length < 2) {
        errors.nama = 'Nama lengkap minimal 2 karakter.';
    } else if (/\d/.test(nama)) {
        errors.nama = 'Nama tidak boleh mengandung angka.';
    } else if (!/^[a-zA-ZÀ-ž\s.'-]+$/.test(nama)) {
        errors.nama = 'Nama hanya boleh berisi huruf, spasi, dan titik.';
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!phone) {
        errors.nomor_hp = 'Nomor HP wajib diisi.';
    } else if (!/^(?:\+62|62|0)8[1-9]\d{6,11}$/.test(cleanPhone)) {
        errors.nomor_hp = 'Masukkan nomor HP Indonesia yang valid, contoh: 08123456789.';
    }

    if (!address) {
        errors.alamat = 'Alamat wajib diisi.';
    } else if (address.length < 5) {
        errors.alamat = 'Alamat minimal 5 karakter.';
    }

    if (!password) {
        errors.password = 'Password wajib diisi.';
    } else if (password.length < 12) {
        errors.password = 'Password minimal 12 karakter.';
    }

    if (!confirm) {
        errors.konfirmasi_password = 'Konfirmasi password wajib diisi.';
    } else if (confirm !== password) {
        errors.konfirmasi_password = 'Konfirmasi password tidak sama.';
    }

    if (Object.keys(errors).length > 0) {
        showFieldErrors('member-register', errors);
        return;
    }

    submit.disabled = true;
    feedback.textContent = 'Membuat akun...';

    try {
        const response = await fetch('/api/member/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nama,
                nomor_hp: phone,
                alamat: address,
                password,
                konfirmasi_password: confirm
            })
        });
        const data = await parseResponse(response);
        registerForm.reset();
        feedback.textContent = '';
        showMember(data.data);
    } catch (error) {
        showFieldErrors('member-register', error.fields);
        feedback.textContent = error instanceof TypeError
            ? 'Tidak dapat terhubung ke server. Silakan coba lagi.'
            : error.message;
    } finally {
        submit.disabled = false;
    }
});

document.getElementById('member-logout-button').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
        const response = await fetch('/api/member/logout', { method: 'POST' });
        await parseResponse(response);
        orderForm.reset();
        document.getElementById('order-confirmation').classList.add('hidden');
        showAuthentication('Anda sudah logout.');
    } catch (error) {
        document.getElementById('order-feedback').textContent = error.message || 'Logout gagal. Silakan coba lagi.';
    } finally {
        button.disabled = false;
    }
});

const orderFields = ['name', 'phone', 'service', 'address', 'notes'];
orderForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearErrors('order', orderFields);
    const feedback = document.getElementById('order-feedback');
    const confirmation = document.getElementById('order-confirmation');
    const submit = document.getElementById('order-submit');
    confirmation.classList.add('hidden');

    const payload = {
        nama_pelanggan: document.getElementById('order-name').value.trim(),
        nomor_hp: document.getElementById('order-phone').value.trim(),
        layanan: serviceSelect.value,
        alamat: document.getElementById('order-address').value.trim(),
        catatan: document.getElementById('order-notes').value.trim()
    };
    const errors = {};
    if (payload.nama_pelanggan.length < 2) errors.nama_pelanggan = 'Nama minimal 2 karakter.';
    if (!/^(?:\+62|62|0)8[1-9]\d{6,10}$/.test(payload.nomor_hp.replace(/[()\s-]/g, ''))) {
        errors.nomor_hp = 'Nomor HP akun tidak valid. Silakan perbarui profil atau hubungi admin.';
    }
    if (!payload.layanan) errors.layanan = 'Pilih layanan yang tersedia.';
    if (payload.alamat.length < 5) errors.alamat = 'Alamat minimal 5 karakter.';
    if (payload.catatan.length > 1000) errors.catatan = 'Catatan maksimal 1000 karakter.';

    if (Object.keys(errors).length) {
        showFieldErrors('order', errors);
        return;
    }

    submit.disabled = true;
    feedback.textContent = 'Mengirim pesanan...';
    feedback.className = 'text-sm mt-3 text-slate-500';
    try {
        const response = await fetch('/api/pesanan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await parseResponse(response);
        document.getElementById('order-invoice').textContent = data.data.kode_invoice;
        confirmation.classList.remove('hidden');
        feedback.textContent = '';
        document.getElementById('order-notes').value = '';
    } catch (error) {
        showFieldErrors('order', error.fields);
        feedback.textContent = error instanceof TypeError
            ? 'Tidak dapat terhubung ke server. Silakan coba lagi.'
            : error.message;
        feedback.className = 'text-sm mt-3 text-red-600';
        if (error.message.includes('login') || error.message.includes('Sesi member')) {
            showAuthentication(error.message);
        }
    } finally {
        submit.disabled = false;
    }
});

async function initializeMemberSession() {
    await loadServices();
    try {
        const response = await fetch('/api/member/session');
        if (response.status === 401) {
            showAuthentication();
            return;
        }
        const data = await parseResponse(response);
        showMember(data.data);
    } catch (error) {
        showAuthentication(error instanceof TypeError
            ? 'Tidak dapat memeriksa sesi. Anda dapat mencoba login kembali.'
            : error.message);
    }
}

initializeMemberSession();