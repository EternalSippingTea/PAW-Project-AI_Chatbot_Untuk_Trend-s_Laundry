const adminLoginPanel = document.getElementById('admin-login-panel');
const adminDashboard = document.getElementById('admin-dashboard');
const adminLoginFeedback = document.getElementById('admin-login-feedback');
const adminDashboardFeedback = document.getElementById('admin-dashboard-feedback');
const productForm = document.getElementById('form-produk');
const orderForm = document.getElementById('form-pesanan-admin');
const dashboardView = document.getElementById('admin-dashboard-view');
const membersView = document.getElementById('admin-members-view');
const STATUS_PESANAN = [
    'Antrian Masuk',
    'Sedang Dicuci',
    'Sedang Disetrika',
    'Siap Diambil',
    'Pesanan Sudah Diambil'
];

function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function formatNumberWithDots(value) {
    const raw = String(value == null ? '' : value).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    return raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
}

function getStatusBadgeClass(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('antrian')) return 'bg-slate-100 text-slate-600';
    if (s.includes('dicuci')) return 'bg-blue-50 text-blue-700';
    if (s.includes('disetrika')) return 'bg-amber-50 text-amber-700';
    if (s.includes('siap')) return 'bg-emerald-50 text-emerald-700';
    if (s.includes('diambil')) return 'bg-slate-100 text-slate-500';
    return 'bg-slate-100 text-slate-600';
}

function setAdminFeedback(message = '') {
    adminDashboardFeedback.textContent = message;
}

function showLogin(message = '') {
    adminDashboard.classList.add('hidden');
    adminLoginPanel.classList.remove('hidden');
    adminLoginFeedback.textContent = message;
}

function showDashboard() {
    adminLoginPanel.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    adminLoginFeedback.textContent = '';
    setAdminFeedback('');
    showAdminView('dashboard');
    loadDashboard();
}

function showAdminView(view) {
    const showMembers = view === 'members';
    dashboardView.classList.toggle('hidden', showMembers);
    membersView.classList.toggle('hidden', !showMembers);
    document.getElementById('admin-nav-dashboard').className = showMembers
        ? 'admin-nav-button w-full flex items-center gap-2.5 text-slate-500 hover:bg-slate-50 text-left text-sm px-3 py-2.5 rounded-lg transition-colors'
        : 'admin-nav-button w-full flex items-center gap-2.5 bg-sky-50 text-sky-700 font-medium text-left text-sm px-3 py-2.5 rounded-lg transition-colors';
    document.getElementById('admin-nav-members').className = showMembers
        ? 'admin-nav-button w-full flex items-center gap-2.5 bg-sky-50 text-sky-700 font-medium text-left text-sm px-3 py-2.5 rounded-lg transition-colors'
        : 'admin-nav-button w-full flex items-center gap-2.5 text-slate-500 hover:bg-slate-50 text-left text-sm px-3 py-2.5 rounded-lg transition-colors';
    const activeButton = document.getElementById(showMembers ? 'admin-nav-members' : 'admin-nav-dashboard');
    const inactiveButton = document.getElementById(showMembers ? 'admin-nav-dashboard' : 'admin-nav-members');
    activeButton.setAttribute('aria-current', 'page');
    inactiveButton.removeAttribute('aria-current');
    if (showMembers) loadMembers();
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error('Server mengirim respons yang tidak dapat dibaca.');
    }
    if (!response.ok) {
        const error = new Error(data.error || 'Permintaan gagal. Silakan coba lagi.');
        error.status = response.status;
        error.fields = data.fields;
        throw error;
    }
    return data;
}

function clearErrors(prefix, fields) {
    fields.forEach(field => {
        const element = document.getElementById(`${prefix}-${field}-error`);
        if (element) element.textContent = '';
        const input = document.getElementById(`${prefix}-${field}`);
        if (input) input.classList.remove('border-red-400');
    });
    const feedback = document.getElementById(`${prefix}-feedback`);
    if (feedback) feedback.textContent = '';
}

function showFieldErrors(prefix, fields) {
    for (const [field, message] of Object.entries(fields || {})) {
        const element = document.getElementById(`${prefix}-${field}-error`);
        if (element) element.textContent = message;
        const input = document.getElementById(`${prefix}-${field}`);
        if (input) input.classList.add('border-red-400');
        if (!element && !input) {
            const feedback = document.getElementById(`${prefix}-feedback`) || document.getElementById(`${prefix}-order-feedback`);
            if (feedback) feedback.textContent = message;
        }
    }
}

function handleAdminError(error) {
    if (error.status === 401) {
        showLogin('Sesi admin berakhir. Silakan login kembali.');
        return;
    }
    setAdminFeedback(error instanceof TypeError
        ? 'Tidak dapat terhubung ke server. Silakan coba lagi.'
        : error.message);
}

async function loadDashboard() {
    await Promise.all([loadProducts(), loadOrders()]);
}

async function loadProducts() {
    try {
        const products = await requestJson('/api/produk');
        if (!Array.isArray(products)) throw new Error('Data layanan tidak valid.');
        const tbody = document.getElementById('admin-tabel-body');
        const orderSelect = document.getElementById('adm-layanan');
        tbody.innerHTML = '';
        orderSelect.innerHTML = '<option value="">-- Pilih Layanan --</option>';

        products.forEach(product => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50 transition-colors';
            row.innerHTML = `
                <td class="px-4 py-3 text-slate-500">${escapeHtml(product.id)}</td>
                <td class="px-4 py-3 font-medium text-slate-900">${escapeHtml(product.nama)}</td>
                <td class="px-4 py-3 text-slate-600">Rp${Number(product.harga).toLocaleString('id-ID')} / ${escapeHtml(product.satuan)}</td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-medium">
                        <i class="fa-regular fa-clock text-[10px]"></i>
                        ${escapeHtml(product.estimasi)}
                    </span>
                </td>
                <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                        <button type="button" data-action="edit-product" data-id="${escapeHtml(product.id)}" aria-label="Edit ${escapeHtml(product.nama)}" class="w-8 h-8 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 flex items-center justify-center transition-colors">
                            <i class="fa-solid fa-pen-to-square text-sm"></i>
                        </button>
                        <button type="button" data-action="delete-product" data-id="${escapeHtml(product.id)}" aria-label="Hapus ${escapeHtml(product.nama)}" class="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors">
                            <i class="fa-solid fa-trash-can text-sm"></i>
                        </button>
                    </div>
                </td>`;
            tbody.appendChild(row);

            const option = document.createElement('option');
            option.value = product.nama;
            option.textContent = `${product.nama} (Rp${Number(product.harga).toLocaleString('id-ID')}/${product.satuan})`;
            orderSelect.appendChild(option);
        });
    } catch (error) {
        handleAdminError(error);
    }
}

async function loadOrders() {
    try {
        const orders = await requestJson('/api/pesanan');
        if (!Array.isArray(orders)) throw new Error('Data pesanan tidak valid.');
        const tbody = document.getElementById('admin-tabel-pesanan');
        tbody.innerHTML = '';

        orders.forEach(order => {
            const status = String(order.status || '').trim();
            const options = [...new Set([status, ...STATUS_PESANAN])]
                .map(option => `<option value="${escapeHtml(option)}"${option === status ? ' selected' : ''}>${escapeHtml(option || '-- Pilih status --')}</option>`)
                .join('');
            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50 align-top transition-colors';
            row.innerHTML = `
                <td class="px-4 py-3 font-mono font-bold text-sky-700 text-xs">${escapeHtml(order.kode_invoice)}</td>
                <td class="px-4 py-3 font-medium text-slate-900">${escapeHtml(order.nama_pelanggan)}</td>
                <td class="px-4 py-3 text-xs text-slate-500">
                    <div class="flex items-center gap-1.5">
                        <i class="fa-solid fa-phone text-slate-300 text-[10px]"></i>
                        ${escapeHtml(order.nomor_hp)}
                    </div>
                    <div class="flex items-start gap-1.5 mt-1">
                        <i class="fa-solid fa-location-dot text-slate-300 text-[10px] mt-0.5"></i>
                        <span>${escapeHtml(order.alamat)}</span>
                    </div>
                </td>
                <td class="px-4 py-3 text-slate-600">${escapeHtml(order.layanan)}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                        <input type="text" inputmode="decimal"
                            value="${escapeHtml(order.berat_kg == null ? '' : order.berat_kg)}"
                            data-weight-input="${escapeHtml(order.kode_invoice)}"
                            placeholder="0.00"
                            aria-label="Berat cucian ${escapeHtml(order.kode_invoice)}"
                            class="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition-colors">
                        <span class="text-xs text-slate-400">kg</span>
                    </div>
                    <button type="button" data-action="save-weight" data-invoice="${escapeHtml(order.kode_invoice)}"
                        class="text-xs text-sky-600 hover:text-sky-700 mt-1.5 font-medium">Simpan berat</button>
                    <span class="weight-save-message block text-xs mt-1 text-slate-400" role="status" aria-live="polite"></span>
                </td>
                <td class="px-4 py-3">
                    <select class="status-pesanan px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 cursor-pointer outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition-colors"
                        data-kode-invoice="${escapeHtml(order.kode_invoice)}"
                        data-saved-status="${escapeHtml(status)}"
                        aria-label="Ubah status pesanan ${escapeHtml(order.kode_invoice)}">${options}</select>
                    <span class="status-save-message block text-xs mt-1 text-slate-400" role="status" aria-live="polite"></span>
                </td>
                <td class="px-4 py-3 text-center">
                    <button type="button" data-action="delete-order" data-invoice="${escapeHtml(order.kode_invoice)}" aria-label="Hapus pesanan ${escapeHtml(order.kode_invoice)}" class="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors mx-auto">
                        <i class="fa-solid fa-trash-can text-sm"></i>
                    </button>
                </td>`;
            tbody.appendChild(row);
        });
    } catch (error) {
        handleAdminError(error);
    }
}

async function loadMembers() {
    try {
        const response = await requestJson('/api/admin/members');
        if (!Array.isArray(response.data)) throw new Error('Data member tidak valid.');
        const tbody = document.getElementById('admin-member-table');
        tbody.innerHTML = '';
        response.data.forEach(member => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50 align-top transition-colors';
            const joined = member.created_at
                ? new Date(member.created_at).toLocaleDateString('id-ID')
                : '-';
            row.innerHTML = `
                <td class="px-4 py-3 text-slate-500">${escapeHtml(member.id)}</td>
                <td class="px-4 py-3 font-medium text-slate-900">${escapeHtml(member.nama)}</td>
                <td class="px-4 py-3 text-slate-600">${escapeHtml(member.nomor_hp)}</td>
                <td class="px-4 py-3 text-slate-500 text-xs">${escapeHtml(member.alamat)}</td>
                <td class="px-4 py-3 text-slate-500 text-xs">${escapeHtml(joined)}</td>`;
            tbody.appendChild(row);
        });
    } catch (error) {
        handleAdminError(error);
    }
}

document.getElementById('admin-login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const submit = document.getElementById('admin-login-submit');
    const password = document.getElementById('admin-password');
    const username = document.getElementById('admin-username').value.trim();

    adminLoginFeedback.textContent = '';

    if (!username) {
        adminLoginFeedback.textContent = 'Username wajib diisi.';
        return;
    }
    if (!password.value) {
        adminLoginFeedback.textContent = 'Password wajib diisi.';
        return;
    }

    submit.disabled = true;
    try {
        await requestJson('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password: password.value
            })
        });
        password.value = '';
        showDashboard();
    } catch (error) {
        adminLoginFeedback.textContent = error instanceof TypeError
            ? 'Tidak dapat terhubung ke server. Silakan coba lagi.'
            : error.message;
    } finally {
        submit.disabled = false;
    }
});

document.getElementById('admin-logout-button').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
        await requestJson('/api/admin/logout', { method: 'POST' });
        document.getElementById('admin-login-form').reset();
        showLogin('Anda sudah keluar dari panel admin.');
    } catch (error) {
        handleAdminError(error);
    } finally {
        button.disabled = false;
    }
});

document.getElementById('add-product-button').addEventListener('click', () => {
    productForm.reset();
    document.getElementById('produk-id').value = '';
    document.getElementById('produk-satuan').value = 'kg';
    clearErrors('produk', ['nama', 'harga', 'satuan', 'estimasi', 'deskripsi']);
    productForm.classList.remove('hidden');
});
document.getElementById('cancel-product-button').addEventListener('click', () => {
    productForm.classList.add('hidden');
    clearErrors('produk', ['nama', 'harga', 'satuan', 'estimasi', 'deskripsi']);
});

const produkNamaInput = document.getElementById('produk-nama');
if (produkNamaInput) {
    produkNamaInput.addEventListener('input', () => {
        const val = produkNamaInput.value.trim();
        const errEl = document.getElementById('produk-nama-error');
        if (!errEl) return;
        if (!val) {
            errEl.textContent = '';
            produkNamaInput.classList.remove('border-red-400');
        } else if (/\d/.test(val)) {
            errEl.textContent = 'Nama layanan tidak boleh mengandung angka.';
            produkNamaInput.classList.add('border-red-400');
        } else if (val.replace(/[^a-zA-ZÀ-ž]/g, '').length < 4) {
            errEl.textContent = 'Nama layanan minimal 4 huruf.';
            produkNamaInput.classList.add('border-red-400');
        } else {
            errEl.textContent = '';
            produkNamaInput.classList.remove('border-red-400');
        }
    });
}

const productPriceInput = document.getElementById('produk-harga');
if (productPriceInput) {
    productPriceInput.addEventListener('input', event => {
        const input = event.target;
        const cursorPosition = input.selectionStart || 0;
        const digitsBeforeCursor = input.value.slice(0, cursorPosition).replace(/\D/g, '').length;

        const formatted = formatNumberWithDots(input.value);
        input.value = formatted;

        let newCursor = 0;
        let digitCount = 0;
        for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) digitCount++;
            if (digitCount === digitsBeforeCursor) {
                newCursor = i + 1;
                break;
            }
        }
        if (digitsBeforeCursor === 0) newCursor = 0;
        else if (digitCount < digitsBeforeCursor) newCursor = formatted.length;

        input.setSelectionRange(newCursor, newCursor);

        const errEl = document.getElementById('produk-harga-error');
        if (errEl && input.value.replace(/\D/g, '')) {
            errEl.textContent = '';
            input.classList.remove('border-red-400');
        }
    });
}

document.getElementById('add-order-button').addEventListener('click', () => {
    orderForm.reset();
    clearErrors('adm', ['nama', 'hp', 'layanan', 'status', 'alamat']);
    orderForm.classList.remove('hidden');
});
document.getElementById('cancel-order-button').addEventListener('click', () => {
    orderForm.classList.add('hidden');
    clearErrors('adm', ['nama', 'hp', 'layanan', 'status', 'alamat']);
});

productForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearErrors('produk', ['nama', 'harga', 'satuan', 'estimasi', 'deskripsi']);
    const feedback = document.getElementById('produk-feedback');
    const saveButton = document.getElementById('save-product-button');

    const id = document.getElementById('produk-id').value;
    const nama = document.getElementById('produk-nama').value.trim();
    const hargaRaw = document.getElementById('produk-harga').value.replace(/\D/g, '');
    const harga = Number(hargaRaw);
    const satuan = document.getElementById('produk-satuan').value.trim();
    const estimasi = document.getElementById('produk-estimasi').value.trim();
    const deskripsi = document.getElementById('produk-deskripsi').value.trim();

    const errors = {};

    // Validasi Nama: tidak boleh angka & minimal 4 huruf
    if (!nama) {
        errors.nama = 'Nama layanan wajib diisi.';
    } else if (/\d/.test(nama)) {
        errors.nama = 'Nama layanan tidak boleh mengandung angka.';
    } else if (nama.replace(/[^a-zA-ZÀ-ž]/g, '').length < 4) {
        errors.nama = 'Nama layanan minimal terdiri dari 4 huruf.';
    } else if (nama.length > 100) {
        errors.nama = 'Nama layanan maksimal 100 karakter.';
    }

    // Validasi Harga
    if (!hargaRaw) {
        errors.harga = 'Harga layanan wajib diisi.';
    } else if (Number.isNaN(harga) || harga <= 0) {
        errors.harga = 'Harga layanan harus lebih dari Rp 0.';
    } else if (harga < 500) {
        errors.harga = 'Harga layanan minimal Rp 500.';
    } else if (harga > 100000000) {
        errors.harga = 'Harga layanan maksimal Rp 100.000.000.';
    }

    // Validasi Satuan
    if (!satuan) {
        errors.satuan = 'Satuan layanan wajib diisi (contoh: kg).';
    } else if (satuan.length < 2) {
        errors.satuan = 'Satuan minimal 2 karakter (contoh: kg).';
    } else if (/\d/.test(satuan)) {
        errors.satuan = 'Satuan tidak boleh berupa angka (contoh: kg).';
    } else if (satuan.length > 30) {
        errors.satuan = 'Satuan maksimal 30 karakter.';
    }

    // Validasi Estimasi
    if (!estimasi) {
        errors.estimasi = 'Estimasi pengerjaan wajib diisi (contoh: 2-3 hari, 24 jam).';
    } else if (estimasi.length < 3) {
        errors.estimasi = 'Estimasi minimal 3 karakter (contoh: 1 hari, 24 jam).';
    } else if (estimasi.length > 50) {
        errors.estimasi = 'Estimasi maksimal 50 karakter.';
    }

    // Validasi Deskripsi (opsional)
    if (deskripsi && deskripsi.length < 5) {
        errors.deskripsi = 'Deskripsi minimal 5 karakter jika diisi.';
    } else if (deskripsi.length > 1000) {
        errors.deskripsi = 'Deskripsi maksimal 1000 karakter.';
    }

    if (Object.keys(errors).length > 0) {
        showFieldErrors('produk', errors);
        const firstField = Object.keys(errors)[0];
        const firstInput = document.getElementById(`produk-${firstField}`);
        if (firstInput) firstInput.focus();
        return;
    }

    const payload = {
        nama,
        harga,
        satuan,
        estimasi,
        deskripsi: deskripsi || null
    };

    if (saveButton) saveButton.disabled = true;
    if (feedback) {
        feedback.textContent = 'Menyimpan layanan...';
        feedback.className = 'text-xs text-slate-500';
    }

    try {
        await requestJson(id ? `/api/produk/${encodeURIComponent(id)}` : '/api/produk', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        productForm.classList.add('hidden');
        productForm.reset();
        clearErrors('produk', ['nama', 'harga', 'satuan', 'estimasi', 'deskripsi']);
        await Promise.all([loadProducts(), loadOrders()]);
    } catch (error) {
        if (error.fields) {
            showFieldErrors('produk', error.fields);
        }
        if (feedback) {
            feedback.textContent = error.message;
            feedback.className = 'text-xs text-red-600 font-medium';
        }
        handleAdminError(error);
    } finally {
        if (saveButton) saveButton.disabled = false;
    }
});

orderForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearErrors('adm', ['nama', 'hp', 'layanan', 'status', 'alamat']);
    const feedback = document.getElementById('adm-order-feedback');
    const saveButton = document.getElementById('save-order-button');

    const nama = document.getElementById('adm-nama').value.trim();
    const hp = document.getElementById('adm-hp').value.trim();
    const layanan = document.getElementById('adm-layanan').value;
    const status = document.getElementById('adm-status').value;
    const alamat = document.getElementById('adm-alamat').value.trim();

    const errors = {};

    if (!nama) {
        errors.nama = 'Nama pelanggan wajib diisi.';
    } else if (nama.length < 2) {
        errors.nama = 'Nama pelanggan minimal 2 karakter.';
    } else if (/\d/.test(nama)) {
        errors.nama = 'Nama pelanggan tidak boleh mengandung angka.';
    } else if (!/^[a-zA-ZÀ-ž\s.'-]+$/.test(nama)) {
        errors.nama = 'Nama pelanggan hanya boleh berisi huruf, spasi, dan titik.';
    }

    const cleanHp = hp.replace(/[\s-]/g, '');
    if (!hp) {
        errors.hp = 'Nomor HP wajib diisi.';
    } else if (!/^(?:\+62|62|0)8[1-9]\d{6,11}$/.test(cleanHp)) {
        errors.hp = 'Masukkan nomor HP Indonesia yang valid, contoh: 08123456789.';
    }

    if (!layanan) {
        errors.layanan = 'Pilih salah satu layanan yang tersedia.';
    }

    if (!status) {
        errors.status = 'Pilih status pesanan.';
    }

    if (!alamat) {
        errors.alamat = 'Alamat wajib diisi.';
    } else if (alamat.length < 5) {
        errors.alamat = 'Alamat minimal 5 karakter.';
    } else if (alamat.length > 500) {
        errors.alamat = 'Alamat maksimal 500 karakter.';
    }

    if (Object.keys(errors).length > 0) {
        showFieldErrors('adm', errors);
        const firstField = Object.keys(errors)[0];
        const firstInput = document.getElementById(`adm-${firstField}`);
        if (firstInput) firstInput.focus();
        return;
    }

    const payload = {
        nama_pelanggan: nama,
        nomor_hp: hp,
        layanan,
        status,
        alamat,
        catatan: 'Pencatatan Toko'
    };

    if (saveButton) saveButton.disabled = true;
    if (feedback) {
        feedback.textContent = 'Menyimpan pesanan...';
        feedback.className = 'text-xs text-slate-500';
    }

    try {
        await requestJson('/api/admin/pesanan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        orderForm.classList.add('hidden');
        orderForm.reset();
        clearErrors('adm', ['nama', 'hp', 'layanan', 'status', 'alamat']);
        await loadOrders();
    } catch (error) {
        if (error.fields) {
            const mapped = {};
            if (error.fields.nama_pelanggan) mapped.nama = error.fields.nama_pelanggan;
            if (error.fields.nomor_hp) mapped.hp = error.fields.nomor_hp;
            if (error.fields.layanan) mapped.layanan = error.fields.layanan;
            if (error.fields.status) mapped.status = error.fields.status;
            if (error.fields.alamat) mapped.alamat = error.fields.alamat;
            showFieldErrors('adm', mapped);
        }
        if (feedback) {
            feedback.textContent = error.message;
            feedback.className = 'text-xs text-red-600 font-medium';
        }
        handleAdminError(error);
    } finally {
        if (saveButton) saveButton.disabled = false;
    }
});

document.getElementById('admin-tabel-body').addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = button.dataset.id;
    try {
        if (button.dataset.action === 'edit-product') {
            const product = await requestJson(`/api/produk/${encodeURIComponent(id)}`);
            clearErrors('produk', ['nama', 'harga', 'satuan', 'estimasi', 'deskripsi']);
            document.getElementById('produk-id').value = product.id;
            document.getElementById('produk-nama').value = product.nama;
            document.getElementById('produk-harga').value = formatNumberWithDots(product.harga);
            document.getElementById('produk-satuan').value = product.satuan;
            document.getElementById('produk-estimasi').value = product.estimasi;
            document.getElementById('produk-deskripsi').value = product.deskripsi || '';
            productForm.classList.remove('hidden');
        } else if (button.dataset.action === 'delete-product' && confirm('Yakin ingin menghapus layanan ini?')) {
            await requestJson(`/api/produk/${encodeURIComponent(id)}`, { method: 'DELETE' });
            await Promise.all([loadProducts(), loadOrders()]);
        }
    } catch (error) {
        handleAdminError(error);
    }
});

const adminOrderTable = document.getElementById('admin-tabel-pesanan');

adminOrderTable.addEventListener('keydown', event => {
    const input = event.target.closest('[data-weight-input]');
    if (!input) return;
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        return;
    }
    if (event.key === '.' && !input.value.includes('.')) {
        return;
    }
    if (event.ctrlKey || event.metaKey) return;
    if (!/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        const cell = input.closest('td');
        const message = cell ? cell.querySelector('.weight-save-message') : null;
        if (message) {
            message.textContent = 'Hanya angka yang diperbolehkan.';
            message.className = 'weight-save-message block text-xs mt-1 text-red-600 font-medium';
            setTimeout(() => {
                if (message.textContent === 'Hanya angka yang diperbolehkan.') {
                    message.textContent = '';
                }
            }, 2000);
        }
    }
});

adminOrderTable.addEventListener('input', event => {
    const input = event.target.closest('[data-weight-input]');
    if (!input) return;
    const sanitized = input.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    if (input.value !== sanitized) {
        input.value = sanitized;
    }
    input.classList.remove('border-red-400');
});

adminOrderTable.addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const invoice = button.dataset.invoice;
    try {
        if (button.dataset.action === 'save-weight') {
            const cell = button.closest('td');
            const input = cell.querySelector('[data-weight-input]');
            const message = cell.querySelector('.weight-save-message');
            const rawVal = input.value.trim();

            if (rawVal !== '') {
                if (/[^0-9.]/.test(rawVal) || !/^\d{1,6}(?:\.\d{1,2})?$/.test(rawVal)) {
                    message.textContent = 'Berat tidak boleh huruf, gunakan angka > 0 (contoh: 2.5).';
                    message.className = 'weight-save-message block text-xs mt-1 text-red-600 font-medium';
                    input.classList.add('border-red-400');
                    return;
                }
                const num = Number(rawVal);
                if (Number.isNaN(num) || num <= 0 || num > 999999.99) {
                    message.textContent = 'Berat harus berupa angka lebih dari 0 kg.';
                    message.className = 'weight-save-message block text-xs mt-1 text-red-600 font-medium';
                    input.classList.add('border-red-400');
                    return;
                }
            }

            input.classList.remove('border-red-400');
            const weight = rawVal === '' ? null : Number(rawVal);
            button.disabled = true;
            message.textContent = 'Menyimpan...';
            message.className = 'weight-save-message block text-xs mt-1 text-slate-500';
            await requestJson(`/api/pesanan/${encodeURIComponent(invoice)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ berat_kg: weight })
            });
            input.dataset.savedWeight = weight == null ? '' : String(weight);
            message.textContent = weight == null ? 'Berat dikosongkan' : 'Berat tersimpan';
            message.className = 'weight-save-message block text-xs mt-1 text-emerald-600 font-medium';
        } else if (button.dataset.action === 'delete-order' && confirm(`Yakin ingin menghapus riwayat pesanan ${invoice}?`)) {
            await requestJson(`/api/pesanan/${encodeURIComponent(invoice)}`, { method: 'DELETE' });
            await loadOrders();
        }
    } catch (error) {
        const message = button.closest('td').querySelector('.weight-save-message');
        if (message) {
            message.textContent = error.message || 'Gagal menyimpan berat.';
            message.className = 'weight-save-message block text-xs mt-1 text-red-600 font-medium';
        }
        handleAdminError(error);
    } finally {
        button.disabled = false;
    }
});

document.getElementById('admin-tabel-pesanan').addEventListener('change', async event => {
    const select = event.target.closest('.status-pesanan');
    if (!select || select.value === select.dataset.savedStatus) return;
    const previousStatus = select.dataset.savedStatus;
    const message = select.parentElement.querySelector('.status-save-message');
    select.disabled = true;
    message.textContent = 'Menyimpan...';
    try {
        await requestJson(`/api/pesanan/${encodeURIComponent(select.dataset.kodeInvoice)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: select.value })
        });
        select.dataset.savedStatus = select.value;
        message.textContent = 'Status tersimpan';
    } catch (error) {
        select.value = previousStatus;
        message.textContent = error.message || 'Gagal menyimpan status.';
        handleAdminError(error);
    } finally {
        select.disabled = false;
    }
});

document.getElementById('admin-nav-dashboard').addEventListener('click', () => {
    showAdminView('dashboard');
    loadDashboard();
});
document.getElementById('admin-nav-members').addEventListener('click', () => showAdminView('members'));

async function initializeAdmin() {
    try {
        await requestJson('/api/admin/session');
        showDashboard();
    } catch (error) {
        if (error.status === 401) showLogin();
        else showLogin(error.message || 'Sesi admin tidak dapat diperiksa.');
    }
}

initializeAdmin();
