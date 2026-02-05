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


    user.fullname = req.body.fullname;
    const jwt = require("jsonwebtoken");
    if (req.body.email !== user.email) {
        user.email = req.body.email;
        let token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_KEY);
        res.cookie("token", token);
    }

    user.contact = req.body.contact;
    user.dob = req.body.dob;
    user.address = req.body.address;
    user.username = req.body.username
    user.state = req.body.state;
    user.city = req.body.city;
    user.country = "India";

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
        const productId = item.product ? item.product.toString() : item.toString();
        return productId === req.params.productid;
    });

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
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
    let user = await userModel.findOne({ email: req.user.email }); user.cart = user.cart.filter(item => {
        if (!item) return false;
        if (item.product) {
            return item.product.toString() !== req.params.id;
        }
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

    let needsMigration = false;
    if (user.cart.length > 0) {
        if (!user.cart[0].product && !user.cart[0].quantity) {
            needsMigration = true;
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
        user.cart = user.cart.filter(item => item.product);
        user.cart.forEach(item => {
            const itemTotal = (Number(item.product.price) - Number(item.product.discount)) * item.quantity;
            bill += itemTotal;
        });
        bill += 20;
    }

    res.render("cart", { user, bill });
});

router.get("/checkout", isLoggedIn, async function (req, res) {
    let user = await userModel
        .findOne({ email: req.user.email })
        .populate("cart.product");

    let bill = 0;
    if (user.cart.length > 0) {
        // Filter out any items without product data
        user.cart = user.cart.filter(item => item.product);
        user.cart.forEach(item => {
            const price = Number(item.product.price) || 0;
            const discount = Number(item.product.discount) || 0;
            const quantity = Number(item.quantity) || 1;
            const itemTotal = (price - discount) * quantity;
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

        const cartItem = user.cart.find(item => {
            const id = item.product ? (item.product._id || item.product).toString() : item.toString();
            return id === productId;
        });

        if (cartItem) {
            console.log(`Updating quantity for ${productId}. Old: ${cartItem.quantity}, New: ${quantity}`);
            cartItem.quantity = Math.max(1, parseInt(quantity)); // Ensure minimum quantity of 1

            user.markModified('cart');

            await user.save();
            console.log("Cart saved.");

            await user.populate('cart.product');
            let bill = 0;
            user.cart.forEach(item => {
                if (item.product) {
                    const price = Number(item.product.price) || 0;
                    const discount = Number(item.product.discount) || 0;
                    const quantity = Number(item.quantity) || 1;
                    const itemTotal = (price - discount) * quantity;
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

router.get("/account", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate("wishlist");
    res.render("myaccount", { user });
});

router.get("/logout", isLoggedIn, function (req, res) {
    res.cookie("token", "");
    res.redirect("/");
});
module.exports = router;




