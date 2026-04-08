const jwt = require("jsonwebtoken");
const logger = require("./logger");

const genToken = async (user) => {
    try {
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );

        return token;
    }
    catch (err) {
        logger.error(`Error generating token: ${err.message}`);
        throw err;
    }
};

module.exports = genToken;