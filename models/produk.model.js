const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Produk extends Model {}

Produk.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nama: {
        type: DataTypes.STRING,
        allowNull: false
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    harga: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    satuan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estimasi: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Produk',
    tableName: 'produk',
    timestamps: false,
    freezeTableName: true
});

module.exports = Produk;