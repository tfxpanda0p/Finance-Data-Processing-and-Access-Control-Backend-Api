const logger = require("../config/logger");

// Accept one or more allowed roles: validateRole("Admin") or validateRole("Admin", "Analyst")
const validateRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            const userRole = req.user?.role;
            if (!allowedRoles.includes(userRole)) {
                logger.warn(
                    `Forbidden access by userId: ${req.user?.userId}, role: ${userRole}`
                );
                return res.status(403).json({
                    success: false,
                    message: `Forbidden: Only ${allowedRoles.join(" or ")} can access this`,
                });
            }
            next();
        } catch (err) {
            logger.error(`Role validation error: ${err.message}`);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    };
};

module.exports = validateRole;