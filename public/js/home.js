const serviceList = document.getElementById('home-service-list');
const chatMessages = document.getElementById('chat-messages');

function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function getServiceIcon(name) {
    const lower = (name || '').toLowerCase();
    if (lower.includes('kilat') || lower.includes('express')) return 'fa-solid fa-bolt';
    if (lower.includes('setrika')) return 'fa-solid fa-temperature-high';
    if (lower.includes('kering')) return 'fa-solid fa-wind';
    if (lower.includes('sepatu')) return 'fa-solid fa-shoe-prints';
    if (lower.includes('selimut') || lower.includes('bed')) return 'fa-solid fa-bed';
    if (lower.includes('jas') || lower.includes('formal')) return 'fa-solid fa-user-tie';
    return 'fa-solid fa-shirt';
}

async function loadServices() {
    try {
        const response = await fetch('/api/produk');
        if (!response.ok) throw new Error('Daftar layanan belum dapat dimuat. Silakan coba lagi.');
        const services = await response.json();
        if (!Array.isArray(services)) throw new Error('Data layanan tidak valid.');
        if (services.length === 0) {
            serviceList.innerHTML = '<p class="text-slate-500 col-span-full">Belum ada layanan yang tersedia.</p>';
            return;
        }

        serviceList.innerHTML = services.map(service => `
            <article class="bg-white rounded-xl border border-slate-200 p-5 hover:border-sky-200 transition-colors group">
                <div class="flex items-start gap-3 mb-3">
                    <div class="w-9 h-9 bg-sky-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 transition-colors">
                        <i class="${getServiceIcon(service.nama)} text-sky-600 text-sm"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold text-slate-900">${escapeHtml(service.nama)}</h3>
                        <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">${escapeHtml(service.deskripsi || '')}</p>
                    </div>
                </div>
                <div class="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span class="font-bold text-slate-900">Rp${Number(service.harga).toLocaleString('id-ID')}<span class="text-xs text-slate-400 font-normal">/${escapeHtml(service.satuan)}</span></span>
                    <span class="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2.5 py-1 rounded-md font-medium">
                        <i class="fa-regular fa-clock text-[10px]"></i>
                        ${escapeHtml(service.estimasi)}
                    </span>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Gagal memuat layanan:', error);
        serviceList.innerHTML = `<p class="text-red-600 col-span-full">${escapeHtml(error.message || 'Daftar layanan belum dapat dimuat.')}</p>`;
    }
}

function appendMessage(text, isUser = false) {
    if (isUser) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex justify-end';
        const message = document.createElement('p');
        message.className = 'text-sm bg-sky-600 text-white rounded-xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%]';
        message.textContent = text;
        wrapper.appendChild(message);
        chatMessages.appendChild(wrapper);
    } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex gap-2';
        wrapper.innerHTML = `
            <div class="w-6 h-6 bg-sky-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="fa-solid fa-robot text-sky-600 text-[10px]"></i>
            </div>
        `;
        const message = document.createElement('p');
        message.className = 'text-sm bg-white border border-slate-200 text-slate-700 rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%] whitespace-pre-line';
        message.textContent = text;
        wrapper.appendChild(message);
        chatMessages.appendChild(wrapper);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

const chatbotContainer = document.getElementById('chatbot-container');
const chatbotButton = document.getElementById('chatbot-fab');
const toggleChat = open => {
    chatbotContainer.classList.toggle('hidden', !open);
    chatbotButton.classList.toggle('hidden', open);
};

chatbotButton.addEventListener('click', () => toggleChat(true));
document.getElementById('chatbot-header').addEventListener('click', () => toggleChat(false));

document.getElementById('chat-form').addEventListener('submit', async event => {
    event.preventDefault();
    const input = document.getElementById('chat-message');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    appendMessage(message, true);
    const sendButton = document.getElementById('chat-send');
    sendButton.disabled = true;
    let loadingMessage;

    try {
        const invoice = message.match(/\bTLK[\s-]?\d{4}\b/i);
        if (invoice) {
            const response = await fetch(`/api/pesanan/${encodeURIComponent(invoice[0])}`);
            const data = await response.json();
            if (!response.ok) {
                appendMessage(data.error || 'Invoice tidak ditemukan.');
            } else {
                const beratDisplay = data.berat_kg != null && data.berat_kg !== ''
                    ? `${data.berat_kg} kg`
                    : 'Belum ditimbang';
                const lines = [
                    `Invoice: ${data.kode_invoice}`,
                    `Nama Pemesan: ${data.nama_pelanggan || '-'}`,
                    `Status Cucian: [ ${data.status} ]`,
                    `Layanan: ${data.layanan}`,
                    `Berat: ${beratDisplay}`
                ];
                appendMessage(lines.join('\n'));
            }
            return;
        }

        const loadingWrapper = document.createElement('div');
        loadingWrapper.className = 'flex gap-2';
        loadingWrapper.innerHTML = `
            <div class="w-6 h-6 bg-sky-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="fa-solid fa-robot text-sky-600 text-[10px]"></i>
            </div>
        `;
        loadingMessage = document.createElement('p');
        loadingMessage.className = 'text-sm bg-white border border-slate-200 rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%] text-slate-400';
        loadingMessage.textContent = 'Asisten sedang menyiapkan jawaban...';
        loadingMessage.setAttribute('role', 'status');
        loadingWrapper.appendChild(loadingMessage);
        chatMessages.appendChild(loadingWrapper);
        loadingMessage = loadingWrapper;
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        if (!response.ok || !data.success || !data.data || typeof data.data.reply !== 'string') {
            throw new Error(data.error || 'Asisten AI tidak dapat menjawab saat ini.');
        }
        appendMessage(data.data.reply);
    } catch (error) {
        appendMessage(error instanceof TypeError
            ? 'Tidak dapat terhubung ke server aplikasi. Pastikan server berjalan lalu coba lagi.'
            : error.message || 'Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
        if (loadingMessage) loadingMessage.remove();
        sendButton.disabled = false;
        input.focus();
    }
});

loadServices();

if (window.location.hash === '#chat') {
    toggleChat(true);
}