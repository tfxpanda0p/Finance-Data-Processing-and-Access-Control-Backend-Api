const jwt = require("jsonwebtoken");
const logger = require("../config/logger");
const User = require("../models/User");

const authUser = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        logger.warn(`No token — ${req.method} ${req.originalUrl}`);
        return res.status(401).json({
            success: false,
            message: "Unauthorized: No token provided",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded?.userId || !decoded?.role) {
            logger.warn("Malformed token payload");
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid token payload",
            });
        }
        
        const userRecord = await User.findById(decoded.userId);
        if (!userRecord) {
            return res.status(401).json({ success: false, message: "Unauthorized: User no longer exists" });
        }
        if (userRecord.status === 'inactive') {
            logger.warn(`Forbidden access attempt by inactive user: ${decoded.userId}`);
            return res.status(403).json({ success: false, message: "Forbidden: Account is inactive" });
        }

        req.user = decoded;
        next();
    } catch (err) {
        logger.warn(`Auth error [${err.name}]: ${err.message}`);

        const message =
            err.name === "TokenExpiredError" ? "Session expired, please log in again" :
                err.name === "JsonWebTokenError" ? "Unauthorized: Invalid token" :
                    err.name === "NotBeforeError" ? "Unauthorized: Token not yet active" :
                        "Unauthorized";

        return res.status(401).json({ success: false, message });
    }
}

module.exports = authUser;