const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedin");
const { registerUser, loginUser, logout } = require("../controllers/authController");

router.get("/", function (req, res) {
    res.send("Heyyy its all done");
});

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Logout
router.post("/logout", logout);

module.exports = router;
