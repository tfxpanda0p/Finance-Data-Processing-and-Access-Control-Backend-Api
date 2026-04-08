const User = require("../models/User");
const Record = require("../models/Record");
const sendTokenResponse = require("../utils/sendToken");
const genToken = require("../config/genToken");
const logger = require("../config/logger");
const { validateRegister, validateLogin } = require("../utils/validate")
const getRole = require("../utils/getRole");

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, key]
 *             properties:
 *               name: {type: string}
 *               email: {type: string, format: email}
 *               password: {type: string}
 *               key: {type: string, description: "AdminKey or AnalystKey for elevated roles"}
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or Invalid key
 */
const register = async (req, res) => {
    logger.info(`Registeration endpoint hit... by ${req.body.email}`);
    try {
        const { error } = validateRegister(req.body);
        if (error) {
            logger.error(`Error in register controller: ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { name, email, password, key } = req.body;

        const exsistingUser = await User.findOne({ email });
        if (exsistingUser) {
            logger.warn(`User already exists with this email ${email}`);
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const role = getRole(key);
        if (!role) {
            logger.error(`Error in register controller: Invalid Key provided by ${name} with email ${email}`);
            return res.status(400).json({ success: false, message: "Invalid Key" });
        }

        const user = new User({ name, email, password, role });
        const token = await genToken(user);
        await user.save();

        logger.info(`User registered successfully: ${user._id}`);
        return sendTokenResponse(user, token, 201, res, {
            message: `User registered successfully :- ${user._id}`
        });

    } catch (err) {
        logger.error(`Error in register controller: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: {type: string, format: email}
 *               password: {type: string}
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account inactive
 */
const login = async (req, res) => {
    logger.info(`Login endpoint hit... by ${req.body.email}`);
    try {
        const { error } = validateLogin(req.body);
        if (error) {
            logger.error(`Error in login controller: ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            logger.warn(`User not found with this email ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.status === 'inactive') {
            logger.warn(`Inactive user login attempt: ${email}`);
            return res.status(403).json({ success: false, message: 'Account is inactive. Please contact your administrator.' });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logger.warn(`Invalid password provided for user ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = await genToken(user);
        logger.info(`User logged in successfully: ${user._id}`);
        return sendTokenResponse(user, token, 200, res, {
            message: `User logged in successfully :- ${user._id}`
        });
    } catch (err) {
        logger.error(`Error in login controller: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
const logout = async (req, res) => {
    logger.info(`Logout endpoint hit... by ${req.user.userId}`);
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
        });
        logger.info(`User logged out successfully :- ${req.user?.userId || "Unknown"}`);
        res.status(200).json({ success: true, message: 'User logged out successfully' });
    } catch (err) {
        logger.error(`Error in logoutUser controller: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/users/{id}/status:
 *   put:
 *     summary: Update user status (active/inactive)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: {type: string, enum: [active, inactive]}
 *     responses:
 *       200:
 *         description: Status updated
 */
const updateUserStatus = async (req, res) => {
    logger.info(`Update user status endpoint hit... by ${req.user.userId}`);
    try {
        const id = req.params.id;
        const status = req.body.status;

        if (!['active', 'inactive'].includes(status)) {
            logger.error(`Error in updateUserStatus: Invalid status value provided by ${req.user.userId}`);
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const userToUpdate = await User.findById(id).select("-password");
        if (!userToUpdate) {
            logger.error(`Error in updateUserStatus: User not found with ID ${id}`);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        userToUpdate.status = status;
        await userToUpdate.save();

        logger.info(`User ${id} status updated to ${status} by admin ${req.user.userId}`);
        res.status(200).json({ success: true, message: `User status updated to ${status}`, data: userToUpdate });
    } catch (err) {
        logger.error(`Error in updateUserStatus: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: {type: integer, default: 1}
 *       - in: query
 *         name: limit
 *         schema: {type: integer, default: 5}
 *     responses:
 *       200:
 *         description: List of users retrieved
 */
const getAllUsers = async (req, res) => {
    logger.info(`Get all users endpoint hit... by ${req.user.userId}`);
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 5);
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find().skip(skip).limit(limit).select("-password").populate("records"),
            User.countDocuments(),
        ]);

        const totalPages = Math.ceil(total / limit);

        logger.info(`All users fetched successfully: page ${page}/${totalPages}, count ${users.length}`);
        res.status(200).json({
            success: true,
            message: 'All users fetched successfully',
            data: users,
            pagination: { total, totalPages, currentPage: page, limit },
        });
    } catch (err) {
        logger.error(`Error in getAllUsers controller: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 */
const getMe = async (req, res) => {
    logger.info(`Get me endpoint hit... By ${req.user.userId}`);
    try {
        const user = await User.findById(req.user.userId).select("-password").populate("records", "-_id -user -__v -createdAt -updatedAt");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        logger.error(`Error in getMe controller: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: User found
 */
const getUserById = async (req, res) => {
    logger.info(`Get user by ID endpoint hit for ID: ${req.params.id} By ${req.user.userId}`);
    try {
        const id = req.params.id || req.user.userId;
        const user = await User.findById(id).select("-password").populate("records");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        logger.error(`Error in getUserById controller: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: {type: string, enum: [Admin, Analyst, Viewer]}
 *     responses:
 *       200:
 *         description: Role updated
 */
const updateRole = async (req, res) => {
    logger.info(`Update role endpoint hit... by ${req.user.userId}`);
    try {
        const role = req.body.role;

        if (!['Admin', 'Analyst', 'Viewer'].includes(role)) {
            logger.error(`Error in updateRole: Invalid role value provided by ${req.user.userId}`);
            return res.status(400).json({ success: false, message: 'Invalid role value' });
        }

        const userToUpdate = await User.findById(req.params.id).select("-password -records");
        if (!userToUpdate) {
            logger.error(`Error in updateRole: User not found with ID ${req.params.id}`);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        userToUpdate.role = role;
        await userToUpdate.save();

        logger.info(`User ${id} access updated to ${access} by admin ${req.user.userId}`);
        res.status(200).json({ success: true, message: `User access updated to ${access}`, data: userToUpdate });
    } catch (err) {
        logger.error(`Error in updateAccess: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *       - in: query
 *         name: confirm
 *         required: true
 *         schema: {type: string, enum: [Yes, No]}
 *     responses:
 *       200:
 *         description: User deleted
 */
const deleteUser = async (req, res) => {
    logger.info(`Delete user endpoint hit... by ${req.user.userId}`);
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            logger.error(`User not found: ${req.params.id}`);
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if (!req.query.confirm) {
            return res.status(400).json({
                success: false,
                message: "Please confirm deletion by adding ?confirm=Yes or ?confirm=No"
            });
        }
        if (req.query.confirm === "No") {
            return res.status(200).json({
                success: true,
                message: "User not deleted"
            });
        }
        if (req.query.confirm !== "Yes") {
            return res.status(400).json({
                success: false,
                message: "Invalid confirm value. Use Yes or No"
            });
        }
        await Record.deleteMany({ userId: user._id });
        await user.deleteOne();
        logger.info(`User deleted successfully: ${user._id} deleted by ${req.user.userId}`);
        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (err) {
        logger.error(`Error in deleteUser controller: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = { register, login, logout, updateUserStatus, getAllUsers, getUserById, getMe, updateRole, deleteUser };