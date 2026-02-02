const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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
    flashSale: {
        startTime: Date,
        endTime: Date,
        isActive: { type: Boolean, default: false }
    }
});

// Hash password before saving
ownerSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// Method to compare password
ownerSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("owner", ownerSchema);
