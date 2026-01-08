const mongoose  = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/scatch')

const ownerSchema = new mongoose.Schema({
    fullname: {
        type: String,minLength: 3,maxLength: 30,trim: true
    },   
    email: String,
    password: String,
    isadmin: Boolean,
    products: { type: Array, default: [] },
    contact: number,
    picture : String,
    gstin: String,
});

mongoose.model('owner' , ownerSchema);