const dataPesanan = [
    { kodeInvoice: "TLK-0231", layanan: "Cuci Kering", status: "Sedang dicuci", estimasi: "2 hari" },
    { kodeInvoice: "TLK-0232", layanan: "Cuci + Setrika", status: "Menunggu antrean", estimasi: "2 hari" },
    { kodeInvoice: "TLK-0233", layanan: "Cuci Express", status: "Siap diambil", estimasi: "1 hari" }
];

module.exports = {
    getByKodeInvoice: (kodeInvoice) => dataPesanan.find(
        (pesanan) => pesanan.kodeInvoice === kodeInvoice.trim().toUpperCase()
    )
};
