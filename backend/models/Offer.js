const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  tag: { 
    type: String, 
    default: 'FLAT 50% OFF' 
  },
  title: { 
    type: String, 
    required: true, 
    default: 'FLAT 50% OFF' 
  },
  subtitle: { 
    type: String, 
    required: true, 
    default: 'On your first 3 food orders!' 
  },
  speed: { 
    type: String, 
    default: '30 Min' 
  },
  bgMedia: { 
    type: String, 
    default: '' // Stores image/video URL or Base64 string 
  },
  mediaType: { 
    type: String, 
    default: '' // 'image' or 'video' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);