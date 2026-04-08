const router = require("express").Router();
const authUser = require("../middleware/authUser");
const validateRole = require("../middleware/authRole");
const {
    getSummary,
    getCategoryTotals,
    getRecentActivity,
    getRecentActivityOneDay,
    getMonthlyTrends,
    getWeeklyTrends,
    getDashboardRecords
} = require("../controllers/dashboard");

router.get("/summary", authUser, validateRole("Admin", "Analyst", "Viewer"), getSummary);         // totals + net balance

router.get("/categories", authUser, validateRole("Admin", "Analyst", "Viewer"), getCategoryTotals);  // category-wise breakdown

router.get("/recent/hour", authUser, validateRole("Admin", "Analyst", "Viewer"), getRecentActivity);  // last N records

router.get("/recent/day", authUser, validateRole("Admin", "Analyst", "Viewer"), getRecentActivityOneDay);  // last N records

router.get("/trends/weekly", authUser, validateRole("Admin", "Analyst", "Viewer"), getWeeklyTrends);  // last N records

router.get("/trends/monthly", authUser, validateRole("Admin", "Analyst", "Viewer"), getMonthlyTrends);   // month-by-month for a year

router.get("/records", authUser, validateRole("Admin", "Analyst", "Viewer"), getDashboardRecords);    // detailed records for dashboard

module.exports = router;
