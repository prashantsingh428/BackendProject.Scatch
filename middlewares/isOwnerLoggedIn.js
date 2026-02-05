const jwt = require("jsonwebtoken");
const ownerModel = require("../models/owner-model");

module.exports = async function isOwnerLoggedIn(req, res, next) {
    if (!req.cookies.ownerToken) {
        return res.redirect("/owners/login");
    }

    try {
        const decoded = jwt.verify(req.cookies.ownerToken, process.env.JWT_KEY);

        const owner = await ownerModel
            .findOne({ email: decoded.email })
            .select("-password");

        if (!owner) {
            res.clearCookie("ownerToken");
            return res.redirect("/owners/login");
        }
        req.owner = owner;

       
        res.locals.owner = owner;

        next();
    } catch (err) {
        res.clearCookie("ownerToken");
        return res.redirect("/owners/login");
    }
};
