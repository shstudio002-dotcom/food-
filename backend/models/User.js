const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  role: { 
    type: String, 
    enum: ['customer', 'restaurant', 'delivery', 'admin'], 
    default: 'customer' 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);