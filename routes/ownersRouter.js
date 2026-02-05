const express = require("express");
const router = express.Router();
const ownerModel = require("../models/owner-model");
const jwt = require("jsonwebtoken");
const productModel = require("../models/product-model");

const upload = require("../config/multer-config");
const isOwnerLoggedIn = require("../middlewares/isOwnerLoggedIn");

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

// Owner Login Page
router.get("/login", function (req, res) {
    let error = req.flash("error");
    res.render("owner-login", { error });
});

// Owner Login Handler
router.post("/login", async function (req, res) {
    try {
        let { email, password } = req.body;

        // Find owner by email
        let owner = await ownerModel.findOne({ email: email });

        if (!owner) {
            req.flash("error", "Invalid email or password");
            return res.redirect("/owners/login");
        }

        // Compare password
        const isMatch = await owner.comparePassword(password);

        if (!isMatch) {
            req.flash("error", "Invalid email or password");
            return res.redirect("/owners/login");
        }

        // Generate JWT token
        let token = jwt.sign({ email: owner.email, id: owner._id }, process.env.JWT_KEY);

        // Set cookie
        res.cookie("ownerToken", token);

        // Redirect to admin dashboard
        res.redirect("/owners/admin");
    } catch (err) {
        req.flash("error", "An error occurred during login");
        res.redirect("/owners/login");
    }
});

// Owner Logout
router.get("/logout", function (req, res) {
    res.clearCookie("ownerToken");
    res.redirect("/owners/login");
});

router.get("/admin", isOwnerLoggedIn, async function (req, res) {
    let success = req.flash("success");
    let products = await productModel.find();
    let owner = await ownerModel.findOne();
    res.render("admin", { products, success, owner });
});

router.post("/admin/gallery/upload", isOwnerLoggedIn, upload.single("image"), async function (req, res) {
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

router.get("/admin/gallery/delete/:filename", isOwnerLoggedIn, async function (req, res) {
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

router.post("/admin/flashsale/update", isOwnerLoggedIn, async function (req, res) {
    try {
        const { startDate, startTime, endDate, endTime, isActive } = req.body;

        let owner = await ownerModel.findOne();
        if (!owner) {
            req.flash("error", "Owner not found");
            return res.redirect("/owners/admin");
        }

        // Create proper Date objects and validate
        let startDateTime = null;
        let endDateTime = null;

        if (startDate && startTime) {
            startDateTime = new Date(`${startDate}T${startTime}`);
        }
        if (endDate && endTime) {
            endDateTime = new Date(`${endDate}T${endTime}`);
        }

        owner.flashSale = {
            startTime: startDateTime,
            endTime: endDateTime,
            isActive: isActive === 'on' || isActive === true
        };

        owner.markModified('flashSale');
        await owner.save();
        req.flash("success", "Flash sale settings updated successfully.");
        res.redirect("/owners/admin");

    } catch (err) {
        console.error("Error updating flash sale:", err);
        req.flash("error", "Error updating flash sale settings");
        res.redirect("/owners/admin");
    }
});

router.get("/admin/product/delete/:id", isOwnerLoggedIn, async function (req, res) {
    try {
        await productModel.findByIdAndDelete(req.params.id);
        req.flash("success", "Product deleted successfully.");
        res.redirect("/owners/admin");
    } catch (err) {
        req.flash("error", "Error deleting product.");
        res.redirect("/owners/admin");
    }
});

router.get("/admin/product/edit/:id", isOwnerLoggedIn, async function (req, res) {
    try {
        const product = await productModel.findById(req.params.id);
        if (!product) {
            req.flash("error", "Product not found.");
            return res.redirect("/owners/admin");
        }
        let success = req.flash("success");
        // Reuse createproducts view but pass 'product' to pre-fill
        res.render("createproducts", { success, product: product, editMode: true });
    } catch (err) {
        req.flash("error", "Error loading product for edit.");
        res.redirect("/owners/admin");
    }
});

router.post("/admin/product/update/:id", isOwnerLoggedIn, upload.single("image"), async function (req, res) {
    try {
        let { name, price, discount, bgcolor, panelcolor, textcolor, flashSale, category, brand, collections } = req.body;

        let updateData = {
            name, price, discount, bgcolor, panelcolor, textcolor,
            flashSale: flashSale === 'true',
            category, brand
        };

        // Handle collections
        if (collections) {
            updateData.collections = Array.isArray(collections) ? collections : [collections];
        }

        // Only update image if a new one is uploaded
        if (req.file) {
            updateData.image = req.file.filename;
        }

        await productModel.findByIdAndUpdate(req.params.id, updateData);
        req.flash("success", "Product updated successfully.");
        res.redirect("/owners/admin");

    } catch (err) {
        req.flash("error", "Error updating product.");
        res.redirect("/owners/admin");
    }
});

router.get("/create", isOwnerLoggedIn, function (req, res) {
    let success = req.flash("success");
    res.render("createproducts", { success, product: null, editMode: false });
});


// router.get("/", function (req, res) {
//     res.send("hey its working");
// })

module.exports = router;