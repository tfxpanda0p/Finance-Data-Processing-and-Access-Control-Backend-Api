const Record = require("../models/Record");
const logger = require("../config/logger");

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary totals
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema: {type: string, format: date}
 *       - in: query
 *         name: dateTo
 *         schema: {type: string, format: date}
 *     responses:
 *       200:
 *         description: Summary totals retrieved
 */
const getSummary = async (req, res) => {
    logger.info(`Dashboard summary endpoint hit...by ${req.user.userId}`);
    try {
        const { dateFrom, dateTo } = req.query;
        const matchStage = { ...buildDateMatch(dateFrom, dateTo) };

        const result = await Record.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$type",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        let totalIncome = 0, totalExpenses = 0, incomeCount = 0, expenseCount = 0;
        result.forEach(({ _id, total, count }) => {
            if (_id === "income") { totalIncome = total; incomeCount = count; }
            if (_id === "expense") { totalExpenses = total; expenseCount = count; }
        });

        res.status(200).json({
            success: true,
            message: "Dashboard summary fetched successfully",
            data: {
                totalIncome,
                totalExpenses,
                netBalance: totalIncome - totalExpenses,
                incomeCount,
                expenseCount,
                totalTransactions: incomeCount + expenseCount,
            },
        });
    } catch (err) {
        logger.error(`Error in getSummary: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     summary: Get category-wise totals
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
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
 *         description: Category totals retrieved
 */
const getCategoryTotals = async (req, res) => {
    logger.info(`Dashboard category totals endpoint hit... by ${req.user.userId}`);
    try {
        const { dateFrom, dateTo } = req.query;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 5);
        const skip = (page - 1) * limit;
        const matchStage = { ...buildDateMatch(dateFrom, dateTo) };

        const data = await Record.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { category: "$category", type: "$type" },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
            {
                $group: {
                    _id: "$_id.category",
                    breakdown: {
                        $push: { type: "$_id.type", total: "$total", count: "$count" },
                    },
                    categoryTotal: { $sum: "$total" },
                },
            },
            { $sort: { categoryTotal: -1 } },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    categoryTotal: 1,
                    breakdown: 1,
                },
            },
        ]);

        const total = data.length;
        const totalPages = Math.ceil(total / limit);
        const paginated = data.slice(skip, skip + limit);

        res.status(200).json({
            success: true,
            message: "Category totals fetched successfully",
            data: paginated,
            pagination: { total, totalPages, currentPage: page, limit },
        });
    } catch (err) {
        logger.error(`Error in getCategoryTotals: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @swagger
 * /api/dashboard/recent/hour:
 *   get:
 *     summary: Get recent activity from last hour
 *     tags: [Dashboard]
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
 *         description: Recent activity retrieved
 */
const getRecentActivity = async (req, res) => {
    logger.info(`Dashboard recent activity endpoint hit (last 1 hour only)...by ${req.user.userId}`);
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 5);
        const skip = (page - 1) * limit;

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const filter = { createdAt: { $gte: oneHourAgo } };

        const [records, total] = await Promise.all([
            Record.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("amount type category date description")
                .populate("createdBy", "name -_id"),
            Record.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            success: true,
            message: "Recent activity (last 1 hour) fetched successfully",
            data: records,
            pagination: { total, totalPages, currentPage: page, limit },
        });
    } catch (err) {
        logger.error(`Error in getRecentActivity: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @swagger
 * /api/dashboard/recent/day:
 *   get:
 *     summary: Get recent activity from last day
 *     tags: [Dashboard]
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
 *         description: Recent activity retrieved
 */
const getRecentActivityOneDay = async (req, res) => {
    logger.info(`Dashboard recent activity endpoint hit (last 1 day only)...by ${req.user.userId}`);
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 5);
        const skip = (page - 1) * limit;

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const filter = { createdAt: { $gte: oneDayAgo } };

        const [records, total, summary] = await Promise.all([
            Record.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("amount type category date description")
                .populate("createdBy", "name -_id"),
            Record.countDocuments(filter),
            Record.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: "$type",
                        total: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        let totalIncome = 0, totalExpenses = 0, incomeCount = 0, expenseCount = 0;
        summary.forEach(({ _id, total, count }) => {
            if (_id === "income") { totalIncome = total; incomeCount = count; }
            if (_id === "expense") { totalExpenses = total; expenseCount = count; }
        });

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            message: "Recent activity (last 1 day) fetched successfully",
            summary: {
                totalIncome,
                totalExpenses,
                netBalance: totalIncome - totalExpenses,
                incomeCount,
                expenseCount,
            },
            data: records,
            pagination: { total, totalPages, currentPage: page, limit },
        });
    } catch (err) {
        logger.error(`Error in getRecentActivityOneDay: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/dashboard/trends/weekly:
 *   get:
 *     summary: Get weekly trends
 *     tags: [Dashboard]
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
 *         description: Weekly trends retrieved
 */
const getWeeklyTrends = async (req, res) => {
    logger.info(`Dashboard recent activity endpoint hit (last 1 week only)...by ${req.user.userId}`);
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 5);
        const skip = (page - 1) * limit;

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const filter = { createdAt: { $gte: oneWeekAgo } };

        const [records, total, summary] = await Promise.all([
            Record.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("amount type category date description")
                .populate("createdBy", "name -_id"),
            Record.countDocuments(filter),
            Record.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: "$type",
                        total: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        let totalIncome = 0, totalExpenses = 0, incomeCount = 0, expenseCount = 0;
        summary.forEach(({ _id, total, count }) => {
            if (_id === "income") { totalIncome = total; incomeCount = count; }
            if (_id === "expense") { totalExpenses = total; expenseCount = count; }
        });

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            message: "Recent activity (last 1 week) fetched successfully",
            summary: {
                totalIncome,
                totalExpenses,
                netBalance: totalIncome - totalExpenses,
                incomeCount,
                expenseCount,
            },
            data: records,
            pagination: { total, totalPages, currentPage: page, limit },
        });
    } catch (err) {
        logger.error(`Error in getRecentActivityOneWeek: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * @swagger
 * /api/dashboard/trends/monthly:
 *   get:
 *     summary: Get monthly trends
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: {type: integer}
 *       - in: query
 *         name: page
 *         schema: {type: integer, default: 1}
 *     responses:
 *       200:
 *         description: Monthly trends retrieved
 */
const getMonthlyTrends = async (req, res) => {
    logger.info(`Dashboard monthly trends endpoint hit...by ${req.user.userId}`);
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 3;
        const skip = (page - 1) * limit;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11

        let numMonths = 12;
        if (year === currentYear) {
            numMonths = currentMonth + 1;
        } else if (year > currentYear) {
            numMonths = 0;
        }

        const data = await Record.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`),
                    },
                },
            },
            {
                $group: {
                    _id: { month: { $month: "$date" }, type: "$type" },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.month": 1 } },
            {
                $group: {
                    _id: "$_id.month",
                    entries: {
                        $push: { type: "$_id.type", total: "$total", count: "$count" },
                    },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    month: "$_id",
                    entries: 1,
                },
            },
        ]);

        // Normalise: make sure every month has both income & expense keys
        const allMonths = Array.from({ length: numMonths }, (_, i) => {
            const monthName = new Date(year, i, 1).toLocaleString("default", { month: "long" });
            const found = data.find((d) => d.month === i + 1) || { entries: [] };
            const income = found.entries.find((e) => e.type === "income") || { total: 0, count: 0 };
            const expense = found.entries.find((e) => e.type === "expense") || { total: 0, count: 0 };

            if (income.count === 0 && expense.count === 0) {
                return {
                    month: i + 1,
                    monthName,
                    records: "no records found",
                };
            }

            return {
                month: i + 1,
                monthName,
                income: { total: income.total, count: income.count },
                expense: { total: expense.total, count: expense.count },
                net: income.total - expense.total,
            };
        });

        const total = allMonths.length;
        const totalPages = Math.ceil(total / limit);
        const paginatedMonths = allMonths.slice(skip, skip + limit);

        res.status(200).json({
            success: true,
            message: `Monthly trends for ${year} (page ${page}) fetched successfully`,
            year,
            data: paginatedMonths,
            pagination: { total, totalPages, currentPage: page, limit },
        });
    } catch (err) {
        logger.error(`Error in getMonthlyTrends: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @swagger
 * /api/dashboard/records:
 *   get:
 *     summary: Get detailed dashboard records
 *     tags: [Dashboard]
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
 *         description: Dashboard records retrieved
 */
const getDashboardRecords = async (req, res) => {
    logger.info("Dashboard detailed records endpoint hit...");
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 5);
        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            Record.find()
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .select()
                .populate("createdBy", "name")
                .populate("changedBy.userId", "name"),
            Record.countDocuments(),
        ]);

        const formattedRecords = records.map(record => ({
            _id: record._id,
            createdBy: record.createdBy ? record.createdBy.name : "Unknown",
            amount: record.amount,
            type: record.type,
            category: record.category,
            description: record.description,
            date: record.date,
            changedBy: (record.changedBy || []).map(cb => ({
                name: cb.userId ? cb.userId.name : "Unknown",
                date: cb.date,
                changeItem: cb.changeItem || []
            })),
        }));

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            message: "Dashboard records fetched successfully",
            data: formattedRecords,
            pagination: { total, totalPages, currentPage: page, limit },
        });
    } catch (err) {
        logger.error(`Error in getDashboardRecords: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDateMatch(dateFrom, dateTo) {
    if (!dateFrom && !dateTo) return {};
    const date = {};
    if (dateFrom) date.$gte = new Date(dateFrom);
    if (dateTo) date.$lte = new Date(dateTo);
    return { date };
}

module.exports = {
    getSummary,
    getCategoryTotals,
    getRecentActivity,
    getRecentActivityOneDay,
    getWeeklyTrends,
    getMonthlyTrends,
    getDashboardRecords
};
