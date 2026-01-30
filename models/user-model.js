const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        minLength: 3,
        maxLength: 30,
        trim: true
    },
    email: String,
    password: String,
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
    },],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
    },],
    orders: { type: Array, default: [] },
    contact: Number,
    dob: String,
    username: String,
    address: String,
    state: String,
    city: String,
    country: String,
    products: { type: Array, default: [] },
    picture: String,
});

module.exports = mongoose.model('user', userSchema);
