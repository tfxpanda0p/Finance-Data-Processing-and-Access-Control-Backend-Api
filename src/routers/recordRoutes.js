const router = require("express").Router();
const authUser = require("../middleware/authUser");
const validateRole = require("../middleware/authRole");
const { createRecord, updateRecord, deleteRecord, getAllRecords, filterRecords, getRecordById, exportRecords } = require("../controllers/record");

// Admin only — mutating operations
router.post("/create", authUser, validateRole("Admin"), createRecord);
router.put("/update/:id", authUser, validateRole("Admin"), updateRecord);
router.delete("/delete/:id", authUser, validateRole("Admin"), deleteRecord);

// Admin only — full record list
router.get("/all", authUser, validateRole("Admin"), getAllRecords);

// Admin & Analyst — filter/search records
router.get("/filter", authUser, validateRole("Admin", "Analyst"), filterRecords);

// Admin & Analyst — export records
router.get("/export", authUser, validateRole("Admin", "Analyst"), exportRecords);

// Admin & Analyst — single record lookup
router.get("/:id", authUser, validateRole("Admin", "Analyst"), getRecordById);


module.exports = router;