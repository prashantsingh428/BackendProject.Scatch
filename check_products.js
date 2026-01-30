const mongoose = require('mongoose');
require('dotenv').config();
const productModel = require('./models/product-model');

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scatch"); // Assuming local connection from typical .env or app.js
        console.log("Connected to DB");

        const products = await productModel.find();
        console.log(`Found ${products.length} products.`);
        products.forEach(p => {
            console.log(`- Name: ${p.name}, Category: '${p.category}'`);
        });

        if (products.length > 0 && !products[0].category) {
            console.log("\n[!] WARNING: Products seem to be missing categories. Filtering will return empty results.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkProducts();
