const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Member extends Model {}

Member.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nama: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    nomor_hp: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    alamat: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Member',
    tableName: 'member',
    timestamps: false,
    freezeTableName: true
});

module.exports = Member;