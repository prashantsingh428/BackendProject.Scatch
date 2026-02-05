const express = require('express');
const router = express.Router();
const upload = require("../config/multer-config");
const productModel = require("../models/product-model");

router.post("/create", upload.single("image"), async function (req, res) {
    try {
        let { name, price, discount, bgcolor, panelcolor, textcolor, flashSale, category, brand, collections } = req.body;

        // Handle collections - ensure it's an array
        let collectionsArray = [];
        if (collections) {
            collectionsArray = Array.isArray(collections) ? collections : [collections];
        }

        let product = await productModel.create({
            image: req.file.filename,
            name,
            price,
            discount,
            bgcolor,
            panelcolor,
            textcolor,
            flashSale: flashSale === 'true',
            category: category || 'Other',
            brand: brand || 'Other',
            collections: collectionsArray
        });
        req.flash("success", "Product created successfully.");
        res.redirect("/owners/admin");
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/products/create"); 
    }
});

module.exports = router;