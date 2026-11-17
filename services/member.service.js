const { Member } = require('../models');

module.exports = {
    getByPhone: async nomorHp => Member.findOne({ where: { nomor_hp: nomorHp } }),
    getById: async id => {
        const member = await Member.findByPk(id, {
            attributes: ['id', 'nama', 'nomor_hp', 'alamat', 'created_at']
        });
        return member ? member.get({ plain: true }) : null;
    },
    getAll: async () => {
        const members = await Member.findAll({
            attributes: ['id', 'nama', 'nomor_hp', 'alamat', 'created_at'],
            order: [['created_at', 'DESC'], ['id', 'DESC']]
        });
        return members.map(member => member.get({ plain: true }));
    },
    create: async data => Member.create(data)
};