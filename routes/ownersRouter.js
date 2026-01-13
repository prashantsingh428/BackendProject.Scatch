const express = require("express");
const router = express.Router();
const ownerModel = require("../models/owner-model");

const productModel = require("../models/product-model");

if (process.env.NODE_ENV === "development") {
    router.post("/create", async function (req, res) {
        let owners = await ownerModel.find();
        if (owners.length > 0) {
            return res
                .status(503)
                .send("You don't have permission to create a new owner.");
        }

        let { fullname, email, password } = req.body;

        let createdOwner = await ownerModel.create({
            fullname,
            email,
            password,
        });

        res.send(createdOwner);
    });
}


router.get("/admin", async function (req, res) {
    let success = req.flash("success");
    let products = await productModel.find();
    res.render("admin", { products, success });
});

router.get("/create", function (req, res) {
    let success = req.flash("success");
    res.render("createproducts", { success });
});


// router.get("/", function (req, res) {
//     res.send("hey its working");
// })

module.exports = router;