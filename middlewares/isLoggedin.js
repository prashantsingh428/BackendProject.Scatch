const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");

module.exports = async function isLoggedIn(req, res, next) {
    if (!req.cookies.token) {
        return res.redirect("/login");
    }

    try {
        // Decode JWT
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);

        // Find user from database
        const user = await userModel
            .findOne({ email: decoded.email })
            .select("-password");

        if (!user) {
            res.clearCookie("token");
            return res.redirect("/login");
        }

        // Attach user to request
        req.user = user;

        // Make user available to all views
        res.locals.user = user;

        next();
    } catch (err) {
        res.clearCookie("token");
        return res.redirect("/login");
    }
};


// safjksdf