const mongoose = require("mongoose");
const argon2 = require("argon2");
const logger = require("../config/logger");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The email of the user
 *         role:
 *           type: string
 *           enum: [Viewer, Analyst, Admin]
 *           description: The role of the user
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: The current status of the account
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Viewer', 'Analyst', 'Admin'],
        default: 'Viewer'
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    records: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Record",
    }]
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    try {
        this.password = await argon2.hash(this.password);
    } catch (err) {
        logger.error('Error hashing password:', err);
        throw err;
    }
});

userSchema.methods.comparePassword = async function (password) {
    try {
        return await argon2.verify(this.password, password);
    } catch (err) {
        logger.error('Error verifying password:', err);
        return false;
    }
};

module.exports = mongoose.model('User', userSchema);
