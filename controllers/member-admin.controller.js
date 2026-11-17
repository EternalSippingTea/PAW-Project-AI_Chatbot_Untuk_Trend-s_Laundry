const memberService = require('../services/member.service');

module.exports = {
    getMembers: async (req, res) => {
        try {
            const members = await memberService.getAll();
            return res.status(200).json({ success: true, data: members });
        } catch (error) {
            console.error('Gagal mengambil daftar member:', error);
            return res.status(500).json({
                success: false,
                error: 'Gagal mengambil daftar member.'
            });
        }
    }
};
