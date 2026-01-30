const mongoose = require('mongoose');
require('dotenv').config();
const productModel = require('./models/product-model');

async function updateProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scatch");
        console.log("Connected to DB");

        const products = await productModel.find();

        for (let p of products) {
            let cat = 'All'; // Default
            const name = p.name.toLowerCase();

            if (name.includes('bag')) {
                cat = 'Bags';
            } else if (name.includes('boot') || name.includes('shoe')) {
                cat = 'Shoes';
            } else if (name.includes('jacket') || name.includes('blazer') || name.includes('sweater')) {
                cat = 'Shirt'; // Mapping to Shirt for now to make icon work, or could correspond to Clothing
                // sidebar says Clothing, icons say Shirt/T-Shirt. 
                // Let's randomize or just pick one. 
                // Let's also set brand randomly for testing.
            } else if (name.includes('hat') || name.includes('watch')) {
                cat = 'Accessories';
            } else {
                cat = 'T-Shirt'; // Default others to T-Shirt
            }

            p.category = cat;

            // Random brand for testing brand filter
            const brands = ['Nike', 'Adidas', 'Puma', 'Zara'];
            p.brand = brands[Math.floor(Math.random() * brands.length)];

            await p.save();
            console.log(`Updated ${p.name} -> ${cat} (${p.brand})`);
        }

        console.log("All products updated.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

updateProducts();
