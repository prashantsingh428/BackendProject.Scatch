const express = require("express");
const router = express.Router();
const ownerModel = require("../models/owner-model");

const productModel = require("../models/product-model");

const upload = require("../config/multer-config"); // Ensure this is imported

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
    let owner = await ownerModel.findOne();
    res.render("admin", { products, success, owner });
});

router.post("/admin/gallery/upload", upload.single("image"), async function (req, res) {
    try {
        let owner = await ownerModel.findOne();
        if (owner) {
            owner.galleryImages.push(req.file.filename);
            await owner.save();
            req.flash("success", "Gallery image uploaded.");
        }
        res.redirect("/owners/admin");
    } catch (err) {
        req.flash("error", "Error uploading image");
        res.redirect("/owners/admin");
    }
});

router.get("/admin/gallery/delete/:filename", async function (req, res) {
    try {
        let owner = await ownerModel.findOne();
        if (owner) {
            owner.galleryImages = owner.galleryImages.filter(img => img !== req.params.filename);
            await owner.save();
            req.flash("success", "Image removed from gallery.");
        }
        res.redirect("/owners/admin");
    } catch (err) {
        req.flash("error", "Error removing image");
        res.redirect("/owners/admin");
    }
});

router.get("/create", function (req, res) {
    let success = req.flash("success");
    res.render("createproducts", { success });
});


// router.get("/", function (req, res) {
//     res.send("hey its working");
// })

module.exports = router;