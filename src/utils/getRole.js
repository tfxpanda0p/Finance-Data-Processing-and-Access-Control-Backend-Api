const crypto = require("crypto");
const logger = require("../config/logger");

const getRole = (key) => {
    let role = 'Viewer';
    if (key) {
        const validAnalystKey = process.env.ANALYST_PASS || "";
        const validAdminKey = process.env.ADMIN_PASS || "";

        const isAnalystMatch = key.length === validAnalystKey.length &&
            key.length > 0 &&
            crypto.timingSafeEqual(Buffer.from(key), Buffer.from(validAnalystKey));

        const isAdminMatch = key.length === validAdminKey.length &&
            key.length > 0 &&
            crypto.timingSafeEqual(Buffer.from(key), Buffer.from(validAdminKey));

        if (isAdminMatch) {
            return 'Admin';
        } else if (isAnalystMatch) {
            return 'Analyst';
        } else {
            return null;
        }
    }
    return role;
}

module.exports = getRole;