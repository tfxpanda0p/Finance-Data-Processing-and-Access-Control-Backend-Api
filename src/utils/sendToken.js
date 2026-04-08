const sendTokenResponse = (user, token, statusCode, res, additionalData = {}) => {
    const options = {
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15min
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            ...additionalData,
            data: {
                id: user._id,
                name: user.name,
                role: user.role
            }
        });
};

module.exports = sendTokenResponse;