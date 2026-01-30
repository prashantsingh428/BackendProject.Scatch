const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedin");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const upload = require("../config/multer-config");

const ownerModel = require("../models/owner-model");

router.post("/update-profile-picture", isLoggedIn, upload.single("image"), async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    user.picture = req.file.filename;
    await user.save();
    res.redirect("/account");
});

router.post("/update-profile", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });

    // Update fields
    user.fullname = req.body.fullname;
    // user.email = req.body.email; // Keeping email update optional or maybe not allowing it if it identifies the user, but prompt said "update my email". If email changes, login might be affected if based on email. The prompt says "update my email". Let's assume it's allowed.
    // However, if we change email, isLoggedIn middleware based on cookie might break if token encodes email? 
    // isLoggedin uses decoded.email. If we change email in DB but not in token, it's fine for current session but might be weird.
    // Let's allow it but we might need to update the token? Or just let them save it.
    // Wait, isLoggedin finds user by decoded.email. 
    // If I change user.email in DB, next time isLoggedin runs:
    // decoded.email (OLD) -> findOne({email: OLD}) -> returns NULL (since DB has NEW).
    // So changing email will effectively log them out or cause errors on next request.
    // I should probably NOT allow email change without re-login or NOT allow it at all in this simple flow.
    // User request: "update my email". 
    // I will allow it but I warn them / or I should update the token. 
    // Simpler: Just update it. The user will be logged out on next request because user not found.
    // Actually, `isLoggedIn` checks `req.user`.
    // Let's just update it. If they get logged out, that's somewhat expected security behavior for email change.

    // Let's check `isLoggedIn.js`: `const user = await userModel.findOne({ email: decoded.email })`. 
    // Yes, changing email will break the session. 
    // I will comment out email update for safety or handle it? 
    // Handing it properly requires generating new token. 
    // I'll update it and set a new cookie if I can, or just let them be logged out.
    // "update my email" -> I'll implementation it.

    // Actually, to make it seamless, I should issue a new token.
    const jwt = require("jsonwebtoken");
    if (req.body.email !== user.email) {
        user.email = req.body.email;
        // Generate new token
        let token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_KEY);
        res.cookie("token", token);
    }

    user.contact = req.body.contact;
    user.dob = req.body.dob;
    user.address = req.body.address;
    user.username = req.body.username;
    user.state = req.body.state;
    user.city = req.body.city;
    user.country = "India"; // Forcing India as per previous request/UI, or taking from body if we want flexibility. User said "my country name ... also show". The form has it fixed to India. Let's save "India".

    await user.save();
    res.redirect("/account");
});

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

router.get("/about", isLoggedIn, function (req, res) {
    res.render("about");
});

router.get("/shop", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });

    let { sortby, category, brand, min_price, max_price, page } = req.query;
    let currentPage = parseInt(page) || 1;
    let productsPerPage = 6;
    let skip = (currentPage - 1) * productsPerPage;

    let query = {};

    if (category && category !== 'All') {
        query.category = category;
    }
    if (brand) {
        if (Array.isArray(brand)) {
            query.brand = { $in: brand };
        } else {
            query.brand = brand;
        }
    }

    // Price filtering
    if (min_price || max_price) {
        query.price = {};
        if (min_price) query.price.$gte = Number(min_price);
        if (max_price) query.price.$lte = Number(max_price);
    }

    // Sorting
    let sort = {};
    if (sortby === 'popular') {
        sort = { discount: -1 };
    } else if (sortby === 'newest') {
        sort = { _id: -1 };
    } else if (sortby === 'price_low') {
        sort = { price: 1 };
    } else if (sortby === 'price_high') {
        sort = { price: -1 };
    }

    let totalProducts = await productModel.countDocuments(query);
    let totalPages = Math.ceil(totalProducts / productsPerPage);
    let products = await productModel.find(query).sort(sort).skip(skip).limit(productsPerPage);

    // Legacy flash sale products
    let flashSaleProducts = await productModel.find({ flashSale: true });

    // Collection-based products
    let flashDealsProducts = await productModel.find({ collections: 'flash-deals' });
    let todaysForYouProducts = await productModel.find({ collections: 'todays-for-you' });
    let elegantFashionProducts = await productModel.find({ collections: 'elegant-fashion' });
    let similarItemsProducts = await productModel.find({ collections: 'similar-items' });

    let owner = await ownerModel.findOne(); // Fetch the first owner/admin
    let success = req.flash("success");
    res.render("shop", {
        products,
        flashSaleProducts,
        flashDealsProducts,
        todaysForYouProducts,
        elegantFashionProducts,
        similarItemsProducts,
        success,
        user,
        owner,
        currentPage,
        totalPages,
        totalProducts
    });
});

router.get("/category/:categoryName", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let categoryName = req.params.categoryName;

    let { sortby, brand, min_price, max_price, page } = req.query;
    let currentPage = parseInt(page) || 1;
    let productsPerPage = 6;
    let skip = (currentPage - 1) * productsPerPage;

    let query = { category: categoryName };

    if (brand) {
        if (Array.isArray(brand)) {
            query.brand = { $in: brand };
        } else {
            query.brand = brand;
        }
    }

    // Price filtering
    if (min_price || max_price) {
        query.price = {};
        if (min_price) query.price.$gte = Number(min_price);
        if (max_price) query.price.$lte = Number(max_price);
    }

    // Sorting
    let sort = {};
    if (sortby === 'popular') {
        sort = { discount: -1 };
    } else if (sortby === 'newest') {
        sort = { _id: -1 };
    } else if (sortby === 'price_low') {
        sort = { price: 1 };
    } else if (sortby === 'price_high') {
        sort = { price: -1 };
    }

    let totalProducts = await productModel.countDocuments(query);
    let totalPages = Math.ceil(totalProducts / productsPerPage);
    let products = await productModel.find(query).sort(sort).skip(skip).limit(productsPerPage);

    res.render("category", { products, categoryName, totalProducts, currentPage, totalPages, user });
});

router.get("/addtocart/:productid", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    user.cart.push(req.params.productid)
    await user.save();

    // Handle AJAX request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({
            success: true,
            message: "Added to cart",
            cartCount: user.cart.length
        });
    }

    req.flash("success", "Added to cart");
    res.redirect("/shop")
})

router.get("/addtowishlist/:productid", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let action = "";

    if (user.wishlist.indexOf(req.params.productid) === -1) {
        user.wishlist.push(req.params.productid);
        action = "added";
    } else {
        user.wishlist.pull(req.params.productid);
        action = "removed";
    }
    await user.save();

    // Handle AJAX request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({
            success: true,
            message: action === "added" ? "Added to wishlist" : "Removed from wishlist",
            action: action,
            wishlistCount: user.wishlist.length
        });
    }

    req.flash("success", action === "added" ? "Added to wishlist" : "Removed from wishlist");
    res.redirect("/shop");
});

router.get("/removefromwishlist/:productid", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    user.wishlist.pull(req.params.productid);
    await user.save();

    // Handle AJAX request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({
            success: true,
            message: "Removed from wishlist",
            wishlistCount: user.wishlist.length
        });
    }

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




