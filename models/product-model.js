const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    image: Buffer,
    name: String,
    price: Number,
    discount: { type: Number, default: 0 },
    bgcolor: String,
    panelcolor: String,
    textcolor: String,
    flashSale: { type: Boolean, default: false },
    category: String,
    brand: String,
    collections: {
        type: [String],
        default: [],
        enum: ['flash-deals', 'todays-for-you', 'elegant-fashion', 'similar-items']
    }
})

module.exports = mongoose.model('product', productSchema);