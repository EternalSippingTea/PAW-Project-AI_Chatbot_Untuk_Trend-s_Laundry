const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Pesanan extends Model {}

Pesanan.init({
    kode_invoice: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    member_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    nama_pelanggan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nomor_hp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    alamat: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    layanan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    catatan: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Diterima'
    },
    estimasi: {
        type: DataTypes.STRING,
        allowNull: true
    },
    berat_kg: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Pesanan',
    tableName: 'pesanan',
    timestamps: false,
    freezeTableName: true
});

module.exports = Pesanan;