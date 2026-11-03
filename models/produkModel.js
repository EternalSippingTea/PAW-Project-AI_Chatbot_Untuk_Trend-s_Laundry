const dataProduk = [
    { id: 1, nama: "Cuci Kering", deskripsi: "Cuci dan keringkan pakaian, dilipat rapi.", harga: 6000, satuan: "kg", estimasi: "2 hari" },
    { id: 2, nama: "Cuci + Setrika", deskripsi: "Cuci, keringkan, dan setrika pakaian.", harga: 8000, satuan: "kg", estimasi: "2 hari" },
    { id: 3, nama: "Cuci Express", deskripsi: "Layanan kilat untuk cucian yang dibutuhkan segera.", harga: 12000, satuan: "kg", estimasi: "1 hari" },
    { id: 4, nama: "Setrika Saja", deskripsi: "Khusus setrika untuk pakaian yang sudah bersih.", harga: 5000, satuan: "kg", estimasi: "1 hari" }
];

module.exports = {
    getAllProduk: () => dataProduk
};