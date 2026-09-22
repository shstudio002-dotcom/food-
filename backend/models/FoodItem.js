const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
    englishName: { type: String, required: true },
    kannadaName: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    hotelId: { type: String },
    hotelName: { type: String },
    hotelNameInput: { type: String },
    description: String,
    image: String,
    available: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Food", foodSchema);