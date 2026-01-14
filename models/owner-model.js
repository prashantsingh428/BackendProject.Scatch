const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema({
    fullname: {
        type: String,
        minLength: 3,
        maxLength: 30,
        trim: true
    },
    email: String,
    password: String,
    isadmin: Boolean,
    products: { type: Array, default: [] },
    contact: Number,
    picture: String,
    gstin: String,
    galleryImages: { type: Array, default: [] },
});

module.exports = mongoose.model("owner", ownerSchema);
