const mongoose = require('mongoose');

const geoFenceSchema = new mongoose.Schema({
  centerLat: { type: Number, required: true },
  centerLng: { type: Number, required: true },
  radiusMeters: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('GeoFence', geoFenceSchema);