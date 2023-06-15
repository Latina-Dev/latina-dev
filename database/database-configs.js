const mongoose = require('mongoose');
require('dotenv').config();

async function connectDb() {
    try {
        console.log("Connection started");

        await mongoose.connect(process.env.MONGO_URL);

        console.log("Connection sucessful")
    } catch (error) {
        console.log(error)
    }
}

module.exports = connectDb