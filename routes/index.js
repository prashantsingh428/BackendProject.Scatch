const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedin");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");

const ownerModel = require("../models/owner-model");

router.get("/", function (req, res) {
    let error = req.flash("error");
    res.render("index", { error, isLoggedIn: false });
});

router.get("/login", function (req, res) {
    let error = req.flash("error");
    res.render("login", { error, isLoggedIn: false });
});

router.get("/register", function (req, res) {
    let error = req.flash("error");
    res.render("register", { error, isLoggedIn: false });
});

router.get("/shop", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let products = await productModel.find();
    let flashSaleProducts = await productModel.find({ flashSale: true });
    let owner = await ownerModel.findOne(); // Fetch the first owner/admin
    let success = req.flash("success");
    res.render("shop", { products, flashSaleProducts, success, user, owner });
});

router.get("/addtocart/:productid", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    user.cart.push(req.params.productid)
    await user.save();
    req.flash("success", "Added to cart");
    res.redirect("/shop")
})

router.get("/addtowishlist/:productid", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    if (user.wishlist.indexOf(req.params.productid) === -1) {
        user.wishlist.push(req.params.productid);
        req.flash("success", "Added to wishlist");
    } else {
        user.wishlist.pull(req.params.productid);
        req.flash("success", "Removed from wishlist");
    }
    await user.save();
    res.redirect("/shop");
});

router.get("/removefromwishlist/:productid", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    user.wishlist.pull(req.params.productid);
    await user.save();
    req.flash("success", "Removed from wishlist");
    res.redirect("/account?active=wishlist");
});

router.get("/cart/delete/:id", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });

    // Remove the item from the cart array using filter or pull
    // Using simple array filter for now since it's an array of ObjectIds
    // Note: Mongoose might return objects, so we compare strings
    // Or we can use $pull operator with findOneAndUpdate for better atomicity, but let's stick to standard JS for consistency with this codebase style

    // Removing one instance of the item or all? usually remove button removes the item line. 
    // If multiple distinct items are listing, we remove specifically that one. 
    // However, the cart logic seems to push IDs. 
    // Let's use $pull to remove the ID.

    // Better Approach: User wants to remove "this product".
    // user.cart.pull(req.params.id); 

    // Wait, let's look at how user.cart is structured. It's populated in /cart but here it is just IDs.
    // Let's use filter to be safe in JS side if we want to remove just that one instance if duplicates exist? 
    // Usually 'remove' means take it out.
    // Let's allow $pull to remove it.

    // Actually, simply:
    user.cart.pull(req.params.id);
    await user.save();

    req.flash("success", "Item removed from cart");
    res.redirect("/cart");
});

router.get("/cart", isLoggedIn, async function (req, res) {
    let user = await userModel
        .findOne({ email: req.user.email })
        .populate("cart")

    let bill = 0;
    if (user.cart.length > 0) {
        // Calculate total MRP and Discount for all items
        user.cart.forEach(item => {
            bill += Number(item.price) - Number(item.discount);
        });
        // Add Platform Fee
        bill += 20;
    }
    res.render("cart", { user, bill });
});

router.get("/account", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate("wishlist");
    res.render("myaccount", { user });
});

router.get("/logout", isLoggedIn, function (req, res) {
    res.cookie("token", "");
    res.redirect("/");
});
module.exports = router;




