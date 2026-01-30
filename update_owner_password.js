const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/scatch")
    .then(() => console.log("MongoDB connected"))
    .catch(err => {
        console.log("Error connecting to MongoDB:", err);
        process.exit(1);
    });

const ownerModel = require("./models/owner-model");
const bcrypt = require("bcrypt");

async function updateOwnerPassword() {
    try {
        // Find the owner
        const owner = await ownerModel.findOne({ email: "test@test.com" });

        if (!owner) {
            console.log("❌ No owner found with email test@test.com");
            console.log("\nAvailable owners:");
            const allOwners = await ownerModel.find();
            allOwners.forEach(o => console.log("  - Email:", o.email));
            process.exit(1);
        }

        console.log("✅ Found owner:", owner.email);

        // Manually hash the password and update directly (bypass the pre-save hook)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("test", salt);

        await ownerModel.updateOne(
            { email: "test@test.com" },
            { $set: { password: hashedPassword } }
        );

        console.log("✅ Password updated successfully!");
        console.log("\n📧 Email: test@test.com");
        console.log("🔑 Password: test");
        console.log("\n🔗 Login at: http://localhost:3000/owners/login");

        process.exit(0);
    } catch (err) {
        console.error("❌ Error updating password:", err);
        process.exit(1);
    }
}

updateOwnerPassword();
