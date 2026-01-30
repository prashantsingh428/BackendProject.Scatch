const mongoose = require('mongoose');
require('dotenv').config();
const productModel = require('./models/product-model');

async function verifyFilter() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scatch");
        console.log("Connected to DB");

        const category = 'T-Shirt';
        console.log(`Checking filter for category: ${category}`);

        const products = await productModel.find({ category: category });
        console.log(`Found ${products.length} products.`);
        products.forEach(p => console.log(`- ${p.name} (${p.category})`));

        if (products.length === 0) {
            console.log("Filter returned 0 results. Checking if any products have category set...");
            const all = await productModel.find({});
            console.log(`Total products: ${all.length}`);
            if (all.length > 0 && !all[0].category) {
                console.log("SCHEMA ISSUE? Accessing 'category' field on product returned undefined?");
                console.log("Sample doc:", all[0]);
            } else {
                console.log("Sample categories:", all.map(p => p.category).slice(0, 5));
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyFilter();
