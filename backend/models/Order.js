const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  items: [
    {
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  totalPrice: { type: Number, required: true },
  deliveryFee: { type: Number, default: 30 },
  status: { type: String, default: 'Hub' },
  progress: { type: Number, default: 0 },
  paymentMode: { type: String, default: 'COD' },
  time: { type: String, default: 'Just now' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);