const mongoose = require('mongoose');

const changedBySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        date: {
            type: Date,
            default: Date.now,
        },
        changeItem: [
            {
                field: String,
                oldValue: mongoose.Schema.Types.Mixed
            }
        ]
    },
    { _id: false }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Record:
 *       type: object
 *       required:
 *         - createdBy
 *         - amount
 *         - type
 *         - category
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the record
 *         createdBy:
 *           type: string
 *           description: The id of the user who created the record
 *         amount:
 *           type: number
 *           description: Transaction amount
 *         type:
 *           type: string
 *           enum: [income, expense]
 *         category:
 *           type: string
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         changedBy:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId: {type: string}
 *               date: {type: string, format: date-time}
 *               changeItem:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field: {type: string}
 *                     oldValue: {type: string}
 */
const recordSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ['income', 'expense'],
            required: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        changedBy: [changedBySchema],
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true, }
);

const Record = mongoose.model('Record', recordSchema);
module.exports = Record;
