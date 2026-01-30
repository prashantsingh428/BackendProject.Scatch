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

async function createOwner() {
    try {
        // Check if owner already exists
        const existingOwner = await ownerModel.findOne();

        if (existingOwner) {
            console.log("❌ An owner account already exists!");
            console.log("Email:", existingOwner.email);
            console.log("\nIf you forgot your password, you'll need to delete the existing owner from the database first.");
            process.exit(0);
        }

        // Create new owner
        const owner = await ownerModel.create({
            fullname: "Admin",
            email: "admin@example.com",
            password: "admin123",  // This will be hashed automatically
            isadmin: true
        });

        console.log("✅ Owner account created successfully!");
        console.log("\n📧 Email:", owner.email);
        console.log("🔑 Password: admin123");
        console.log("\n🔗 Login at: http://localhost:3000/owners/login");
        console.log("\n⚠️  IMPORTANT: Please change the password after first login!");

        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating owner:", err);
        process.exit(1);
    }
}

createOwner();
