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

    // Migrate old cart format if needed AND consolidate duplicates
    if (user.cart.length > 0 && !user.cart[0].product && !user.cart[0].quantity) {
        const productMap = new Map();
        user.cart.forEach(productId => {
            const idString = productId.toString();
            if (productMap.has(idString)) {
                productMap.get(idString).quantity++;
            } else {
                productMap.set(idString, {
                    product: productId,
                    quantity: 1
                });
            }
        });
        user.cart = Array.from(productMap.values());
    }

    // Check if item already exists in cart
    const existingItem = user.cart.find(item => {
        // Handle both old and new format gracefully
        const productId = item.product ? item.product.toString() : item.toString();
        return productId === req.params.productid;
    });

    if (existingItem) {
        // If exists, increment quantity
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        // If not, add new item with quantity 1
        user.cart.push({
            product: req.params.productid,
            quantity: 1
        });
    }

    user.markModified('cart');
    await user.save();

    // Calculate total quantity for response
    const totalQuantity = user.cart.reduce((total, item) => total + (item.quantity || 1), 0);

    // Handle AJAX request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({
            success: true,
            message: "Added to cart",
            cartCount: totalQuantity
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

    // Remove the item from cart array (with new schema, cart items are objects)
    user.cart = user.cart.filter(item => {
        // Handle potential nulls or mixed schema types safely
        if (!item) return false;

        // If the item has a product reference (new schema)
        if (item.product) {
            return item.product.toString() !== req.params.id;
        }
        // If the item itself is an ID (legacy schema, though unlikely given new structure)
        else {
            return item.toString() !== req.params.id;
        }
    });

    await user.save();

    req.flash("success", "Item removed from cart");
    res.redirect("/cart");
});

router.get("/cart", isLoggedIn, async function (req, res) {
    let user = await userModel
        .findOne({ email: req.user.email })
        .populate("cart.product");

    // Handle migration from old cart format
    let needsMigration = false;
    if (user.cart.length > 0) {
        // Check if old format (direct ObjectIds instead of {product, quantity})
        if (!user.cart[0].product && !user.cart[0].quantity) {
            needsMigration = true;

            // Migrate old format to new format AND consolidate duplicates
            const productMap = new Map();
            user.cart.forEach(productId => {
                const idString = productId.toString();
                if (productMap.has(idString)) {
                    productMap.get(idString).quantity++;
                } else {
                    productMap.set(idString, {
                        product: productId,
                        quantity: 1
                    });
                }
            });

            // Convert map to array
            user.cart = Array.from(productMap.values());
            await user.save();

            // Reload with populated products
            user = await userModel
                .findOne({ email: req.user.email })
                .populate("cart.product");
        }
    }

    let bill = 0;
    if (user.cart.length > 0) {
        // Calculate total with quantities, skip items without product data
        user.cart = user.cart.filter(item => item.product); // Remove any null/undefined products
        user.cart.forEach(item => {
            const itemTotal = (Number(item.product.price) - Number(item.product.discount)) * item.quantity;
            bill += itemTotal;
        });
        // Add Platform Fee
        bill += 20;
    }

    res.render("cart", { user, bill });
});

<<<<<<< HEAD
=======
router.get("/checkout", isLoggedIn, async function (req, res) {
    let user = await userModel
        .findOne({ email: req.user.email })
        .populate("cart.product");

    let bill = 0;
    if (user.cart.length > 0) {
        // Filter out any items without product data
        user.cart = user.cart.filter(item => item.product);
        user.cart.forEach(item => {
            const itemTotal = (Number(item.product.price) - Number(item.product.discount)) * item.quantity;
            bill += itemTotal;
        });
        bill += 20;
    }
    res.render("checkout", { user, bill });
});

// Update cart quantity endpoint
router.post("/cart/updatequantity", isLoggedIn, async function (req, res) {
    try {
        const { productId, quantity } = req.body;
        let user = await userModel.findOne({ email: req.user.email });

        // Find the cart item and update quantity
        const cartItem = user.cart.find(item => {
            // Handle if product is object or id 
            const id = item.product ? (item.product._id || item.product).toString() : item.toString();
            return id === productId;
        });

        if (cartItem) {
            console.log(`Updating quantity for ${productId}. Old: ${cartItem.quantity}, New: ${quantity}`);
            cartItem.quantity = Math.max(1, parseInt(quantity)); // Ensure minimum quantity of 1

            // Explicitly mark modified just in case
            user.markModified('cart');

            await user.save();
            console.log("Cart saved.");

            // Recalculate bill
            await user.populate('cart.product');
            let bill = 0;
            user.cart.forEach(item => {
                if (item.product) {
                    const itemTotal = (Number(item.product.price) - Number(item.product.discount)) * item.quantity;
                    bill += itemTotal;
                }
            });
            bill += 20; // Platform fee

            return res.json({
                success: true,
                quantity: cartItem.quantity,
                bill: bill
            });
        }

        res.json({ success: false, message: "Item not found in cart" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Error updating quantity" });
    }
});

// TEMPORARY: Cleanup cart duplicates route
router.get("/cleanup-cart", isLoggedIn, async function (req, res) {
    try {
        let user = await userModel.findOne({ email: req.user.email });

        console.log("Original cart length:", user.cart.length);
        console.log("Original cart:", JSON.stringify(user.cart, null, 2));

        // Consolidate duplicates in the cart (even if already in new format)
        const productMap = new Map();

        user.cart.forEach(item => {
            let productId;
            let quantity;

            // Handle both old and new format
            if (item.product) {
                // New format
                productId = item.product.toString();
                quantity = item.quantity || 1;
            } else {
                // Old format
                productId = item.toString();
                quantity = 1;
            }

            if (productMap.has(productId)) {
                productMap.get(productId).quantity += quantity;
            } else {
                productMap.set(productId, {
                    product: productId,
                    quantity: quantity
                });
            }
        });

        // Convert map back to array
        user.cart = Array.from(productMap.values());
        await user.save();

        console.log("Cleaned cart length:", user.cart.length);
        console.log("Cleaned cart:", JSON.stringify(user.cart, null, 2));

        req.flash("success", `Cart cleaned! Reduced from duplicates to ${user.cart.length} unique items`);
        res.redirect("/cart");
    } catch (error) {
        console.error("Error cleaning cart:", error);
        req.flash("error", "Error cleaning cart");
        res.redirect("/cart");
    }
});

>>>>>>> 9ab3a03 (feat: redesign UI with premium dark/gold theme, fix shop and help center layouts)
router.get("/account", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate("wishlist");
    res.render("myaccount", { user });
});

router.get("/logout", isLoggedIn, function (req, res) {
    res.cookie("token", "");
    res.redirect("/");
});
module.exports = router;




