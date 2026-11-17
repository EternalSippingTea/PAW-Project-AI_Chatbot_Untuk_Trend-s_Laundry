module.exports = function toPlainObject(instance) {
    return instance ? instance.get({ plain: true }) : undefined;
};
