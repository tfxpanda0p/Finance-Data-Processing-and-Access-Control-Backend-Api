const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     DeletedRecord:
 *       type: object
 *       required:
 *         - recordId
 *         - recordData
 *         - deletedBy
 *       properties:
 *         _id:
 *           type: string
 *         recordId:
 *           type: string
 *         recordData:
 *           type: object
 *         deletedAt:
 *           type: string
 *           format: date-time
 *         deletedBy:
 *           type: string
 */
const deletedRecordSchema = new mongoose.Schema({
    recordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Records",
        required: true,
    },
    recordData: {
        type: mongoose.Schema.Types.Mixed,
        ref: "Records",
        required: true,
    },
    deletedAt: {
        type: Date,
        default: Date.now,
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
});

const DeletedRecord = mongoose.model("DeletedRecord", deletedRecordSchema);
module.exports = DeletedRecord;