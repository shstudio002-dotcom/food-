const mongoose = require('mongoose'); 

const RestaurantSchema = new mongoose.Schema({ 
  name: { type: String, required: true }, 
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, 
  cuisine: [String], 
  address: { type: String, required: true }, 
  isOpen: { type: Boolean, default: true }, 
  image: String,
  // Added fields for automatic schedule & manual override control
  autoMode: { type: Boolean, default: true },
  isManuallyOpen: { type: Boolean, default: true },
  operatingHours: {
    type: Object,
    default: {
      Monday: { open: '08:00', close: '22:00', closed: false },
      Tuesday: { open: '08:00', close: '22:00', closed: false },
      Wednesday: { open: '08:00', close: '22:00', closed: false },
      Thursday: { open: '08:00', close: '22:00', closed: false },
      Friday: { open: '08:00', close: '23:00', closed: false },
      Saturday: { open: '08:00', close: '23:00', closed: false },
      Sunday: { open: '08:00', close: '22:00', closed: false }
    }
  }
}, { timestamps: true }); 

module.exports = mongoose.model('Restaurant', RestaurantSchema);