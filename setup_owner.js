const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/scatch")
    .then(() => console.log("MongoDB connected"))
    .catch(err => {
        console.log("Error connecting to MongoDB:", err);
        process.exit(1);
    });

async function createOwner() {
    try {
        // Direct MongoDB operation to avoid the pre-save hook
        const db = mongoose.connection.db;
        const ownersCollection = db.collection('owners');

        // Check if any owner exists
        const existingOwner = await ownersCollection.findOne();

        if (existingOwner) {
            console.log("❌ An owner account already exists!");
            console.log("Email:", existingOwner.email);

            // Update the existing owner's password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("test", salt);

            await ownersCollection.updateOne(
                { _id: existingOwner._id },
                { $set: { email: "test@test.com", password: hashedPassword } }
            );

            console.log("\n✅ Owner credentials updated!");
            console.log("\n📧 Email: test@test.com");
            console.log("🔑 Password: test");
            console.log("\n🔗 Login at: http://localhost:3000/owners/login");
            process.exit(0);
        }

        // Hash password manually
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("test", salt);

        // Insert directly into MongoDB
        await ownersCollection.insertOne({
            fullname: "Admin",
            email: "test@test.com",
            password: hashedPassword,
            isadmin: true,
            products: [],
            galleryImages: []
        });

        console.log("✅ Owner account created successfully!");
        console.log("\n📧 Email: test@test.com");
        console.log("🔑 Password: test");
        console.log("\n🔗 Login at: http://localhost:3000/owners/login");

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

// Wait for connection before running
mongoose.connection.once('open', createOwner);
