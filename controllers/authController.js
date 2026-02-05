const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");

module.exports.registerUser = async function (req, res) {
    try {
        let { email, password, fullname } = req.body;

        let existingUser = await userModel.findOne({ email });
        if (existingUser)
            return res.status(409).send("You already have an account, please login.");

        bcrypt.genSalt(10, function (err, salt) {
            if (err) return res.send(err.message);

            bcrypt.hash(password, salt, async function (err, hash) {
                if (err) return res.send(err.message);

                let user = await userModel.create({
                    email,
                    password: hash,
                    fullname,
                });

                let token = generateToken(user);
                res.cookie("token", token, { httpOnly: true });
                res.send("user created successfully");
            });
        });

    } catch (err) {
        res.send(err.message);
    }
};

module.exports.loginUser = async function (req, res) {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (!user) return res.send("Email or password incorrect");

    bcrypt.compare(password, user.password, function (err, result) {
        if (err) return res.send(err.message);

        if (result) {
            let token = generateToken(user);
            res.cookie("token", token, { httpOnly: true });
            res.redirect("/shop");
        } else {
            res.send("Email or password incorrect");
        }
    });
};

module.exports.logout = function (req, res) {
    res.clearCookie("token");
    res.redirect("/");
};
