const sequelize = require('../config/database');
const Produk = require('./produk.model');
const Pesanan = require('./pesanan.model');
const Member = require('./member.model');

Member.hasMany(Pesanan, { foreignKey: 'member_id', as: 'pesanan' });
Pesanan.belongsTo(Member, { foreignKey: 'member_id', as: 'member' });

module.exports = { sequelize, Produk, Pesanan, Member };