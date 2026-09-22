const mongoose = require('mongoose'); 

const RestaurantSchema = new mongoose.Schema({ 
  name: { type: String, required: true }, 
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, 
  cuisine: [String], 
  address: { type: String, required: true }, 
  isOpen: { type: Boolean, default: true }, 
  image: String 
}, { timestamps: true }); 

module.exports = mongoose.model('Restaurant', RestaurantSchema);