const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    image: Buffer,
    name: String,
    price: Number,
    discount: { type: Number, default: 0 },
    bgcolor: String,
    panelcolor: String,
    textcolor: String,
    flashSale: { type: Boolean, default: false }
})

module.exports = mongoose.model('product', productSchema);