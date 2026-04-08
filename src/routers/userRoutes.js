const router = require("express").Router();
const { register, login, logout, updateUserStatus, getAllUsers, getMe, getUserById, updateRole, deleteUser } = require("../controllers/user");
const authUser = require("../middleware/authUser");
const validateRole = require("../middleware/authRole");
const { sensitiveLimiter } = require("../middleware/rateLimiter");

router.post("/register", sensitiveLimiter, register);
router.post("/login", sensitiveLimiter, login);
router.post("/logout", authUser, logout);

router.get("/me", authUser, getMe);

router.put("/status/:id", authUser, validateRole("Admin"), updateUserStatus);

router.get("/all", authUser, validateRole("Admin"), getAllUsers);

router.get("/:id", authUser, validateRole("Admin"), getUserById);

router.put("/role/:id", authUser, validateRole("Admin"), updateRole);

router.delete("/:id", authUser, validateRole("Admin"), deleteUser);

module.exports = router;
