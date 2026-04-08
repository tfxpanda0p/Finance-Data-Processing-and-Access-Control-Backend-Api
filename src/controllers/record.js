const Record = require("../models/Record");
const User = require("../models/User");
const logger = require("../config/logger");
const { validateCreateRecord, validateUpdateRecord } = require("../utils/validate");
const DeletedRecord = require("../models/DeletedRecords");

/**
 * @swagger
 * /api/records/create:
 *   post:
 *     summary: Create a new financial record (Admin only)
 *     tags: [Records]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category]
 *             properties:
 *               amount: {type: number}
 *               type: {type: string, enum: [income, expense]}
 *               category: {type: string}
 *               description: {type: string}
 *               date: {type: string, format: date-time}
 *     responses:
 *       201:
 *         description: Record created
 *       400:
 *         description: Validation error
 */
const createRecord = async (req, res) => {
    logger.info(`Create record endpoint hit... by ${req.user.userId}`);
    try {
        const { error } = validateCreateRecord(req.body);
        if (error) {
            logger.error(`Validation error: ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const { amount, type, category, description } = req.body;
        const userId = req.user.userId;
        const record = await Record.create({
            createdBy: userId,
            amount,
            type,
            category,
            description
        });
        await User.findByIdAndUpdate(userId, {
            $addToSet: { records: record._id } // prevents duplicates
        });
        logger.info(`Record created successfully: ${record._id} created by ${userId}`);
        res.status(201).json({
            success: true,
            message: 'Record created successfully',
            data: { _id: record._id, ...record.toObject() }
        });
    } catch (err) {
        logger.error(`Error in createRecord controller: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/records/update/{id}:
 *   put:
 *     summary: Update an existing record (Admin only)
 *     tags: [Records]
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
 *             properties:
 *               amount: {type: number}
 *               type: {type: string, enum: [income, expense]}
 *               category: {type: string}
 *               description: {type: string}
 *               date: {type: string, format: date-time}
 *     responses:
 *       201:
 *         description: Record updated
 */
const updateRecord = async (req, res) => {
    logger.info(`Update record endpoint hit... by ${req.user.userId}`);
    try {
        const { error } = validateUpdateRecord(req.body);
        if (error) {
            logger.error(`Validation error: ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const record = await Record.findById(req.params.id);
        if (!record) {
            logger.error(`Record not found: ${req.params.id}`);
            return res.status(404).json({ success: false, message: 'Record not found' });
        }
        const { amount, type, category, description } = req.body;
        const changeItem = [];

        if (amount !== undefined && amount !== record.amount) {
            changeItem.push({ field: "amount", oldValue: record.amount });
            record.amount = amount;
        }
        if (type !== undefined && type !== record.type) {
            changeItem.push({ field: "type", oldValue: record.type });
            record.type = type;
        }
        if (category !== undefined && category !== record.category) {
            changeItem.push({ field: "category", oldValue: record.category });
            record.category = category;
        }
        if (description !== undefined && description !== record.description) {
            changeItem.push({ field: "description", oldValue: record.description });
            record.description = description;
        }

        if (changeItem.length > 0) {
            record.changedBy.push({ userId: req.user.userId, changeItem });
            await record.save();
        }

        logger.info(`Record updated successfully: ${record._id} updated by ${req.user.userId}`);
        res.status(201).json({
            success: true,
            message: 'Record updated successfully',
            data: { _id: record._id, ...record.toObject() }
        });
    } catch (err) {
        logger.error(`Error in updateRecord controller: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Delete a record (Admin only)
 *     tags: [Records]
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
 *         description: Record deleted
 */
const deleteRecord = async (req, res) => {
    logger.info(`Delete record endpoint hit... by ${req.user.userId}`);
    try {
        const record = await Record.findById(req.params.id);
        if (!record) {
            logger.error(`Record not found: ${req.params.id}`);
            return res.status(404).json({
                success: false,
                message: "Record not found"
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
                message: "Record not deleted"
            });
        }
        if (req.query.confirm !== "Yes") {
            return res.status(400).json({
                success: false,
                message: "Invalid confirm value. Use Yes or No"
            });
        }
        const deletedRecord = new DeletedRecord({
            recordId: record._id,
            recordData: record,
            deletedBy: req.user.userId,
        });
        await deletedRecord.save();
        // only if confirm === "Yes"
        await User.findByIdAndUpdate(record.createdBy, {
            $pull: { records: record._id }
        });
        await record.deleteOne();
        logger.info(`Record deleted successfully: ${record._id} deleted by ${req.user.userId}`);
        return res.status(200).json({
            success: true,
            message: "Record deleted successfully"
        });

    } catch (err) {
        logger.error(`Error in deleteRecord controller: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * @swagger
 * /api/records/all:
 *   get:
 *     summary: Get all financial records (Admin only)
 *     tags: [Records]
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
 *         description: List of records retrieved
 */
const getAllRecords = async (req, res) => {
    logger.info(`Get all records endpoint hit... by ${req.user.userId}`);
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 5);
        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            Record.find().skip(skip).limit(limit).select("-createdAt -updatedAt -__v").lean(),
            Record.countDocuments(),
        ]);

        const totalPages = Math.ceil(total / limit);

        logger.info(`All records fetched successfully: page ${page}/${totalPages}, count ${records.length} by ${req.user.userId}`);
        res.status(200).json({
            success: true,
            message: 'All records fetched successfully',
            data: records,
            pagination: { total, totalPages, currentPage: page, limit },
        });
    } catch (err) {
        logger.error(`Error in getAllRecords controller: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/records/filter:
 *   get:
 *     summary: Filter records by type, category, or date
 *     tags: [Records]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: {type: string, enum: [income, expense]}
 *       - in: query
 *         name: category
 *         schema: {type: string}
 *       - in: query
 *         name: search
 *         schema: {type: string, description: "Search in category or description"}
 *       - in: query
 *         name: dateFrom
 *         schema: {type: string, format: date}
 *       - in: query
 *         name: dateTo
 *         schema: {type: string, format: date}
 *       - in: query
 *         name: page
 *         schema: {type: integer, default: 1}
 *       - in: query
 *         name: limit
 *         schema: {type: integer, default: 5}
 *     responses:
 *       200:
 *         description: Filtered records retrieved
 */
const filterRecords = async (req, res) => {
    logger.info(`Filter records endpoint hit... by ${req.user.userId}`);
    try {
        const { type, category, dateFrom, dateTo, search } = req.query;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 5);
        const skip = (page - 1) * limit;

        // Build filter object from whichever query params were provided
        const filter = {};
        if (type) filter.type = type;  // 'income' | 'expense', validated by schema
        
        if (search) {
            filter.$or = [
                { category: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        } else if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }

        if (dateFrom || dateTo) {
            filter.date = {};
            if (dateFrom) filter.date.$gte = new Date(dateFrom);
            if (dateTo) filter.date.$lte = new Date(dateTo);
        }

        const [records, total] = await Promise.all([
            Record.find(filter)
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .select("-createdAt -__v")
                .populate("createdBy", "-password")
                .lean(),

            Record.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit);

        logger.info(`Filter records: page ${page}/${totalPages}, count ${records.length} by ${req.user.userId}`);
        res.status(200).json({
            success: true,
            message: 'Records filtered successfully',
            data: records,
            filters: { type, category, dateFrom, dateTo },
            pagination: { total, totalPages, currentPage: page, limit },
        });
    } catch (err) {
        logger.error(`Error in filterRecords controller: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get record by ID
 *     tags: [Records]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Record details retrieved
 */
const getRecordById = async (req, res) => {
    logger.info(`Get record by ID endpoint hit... by ${req.user.userId}`);
    try {
        const record = await Record.findById(req.params.id);
        if (!record) {
            logger.error(`Record not found: ${req.params.id}`);
            return res.status(404).json({ success: false, message: 'Record not found' });
        }
        logger.info(`Record fetched successfully: ${record._id} by ${req.user.userId}`);
        res.status(200).json({
            success: true,
            message: 'Record fetched successfully',
            data: { _id: record._id, ...record.toObject() }
        });
    } catch (err) {
        logger.error(`Error in getRecordById controller: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}


/**
 * @swagger
 * /api/records/export:
 *   get:
 *     summary: Export all records to CSV (Admin/Analyst)
 *     tags: [Records]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: CSV file generated
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
const exportRecords = async (req, res) => {
    logger.info(`Export records endpoint hit... by ${req.user.userId}`);
    try {
        const records = await Record.find().sort({ date: -1 }).lean();

        let csv = "ID,Amount,Type,Category,Date,Description,CreatedBy\n";
        records.forEach(record => {
            const date = record.date ? new Date(record.date).toISOString() : "";
            const desc = record.description ? record.description.replace(/"/g, '""') : "";
            csv += `${record._id},${record.amount},${record.type},${record.category},${date},"${desc}",${record.createdBy}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=financial_records.csv');
        res.status(200).send(csv);
    } catch (err) {
        logger.error(`Error in exportRecords: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { createRecord, updateRecord, deleteRecord, getAllRecords, filterRecords, getRecordById, exportRecords };