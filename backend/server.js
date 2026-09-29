require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const orderRoutes = require('./routes/orderRoutes');
const orderSocket = require('./socket/orderSocket');
const Offer = require('./models/Offer'); // Offer model for database persistence[cite: 6]
const Restaurant = require('./models/Restaurant'); // Restaurant model for operating hours[cite: 6]
const GeoFence = require('./models/GeoFence'); // GeoFence model for database persistence[cite: 6]

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Make socket instance globally accessible in routes[cite: 6]
app.set('io', io);

// Connect to MongoDB Atlas (shopmatries database)[cite: 6]
connectDB();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Global storage stores
let currentDeliveryFee = 30;
let currentRatePerKm = 5; // 👈 Added ratePerKm global store variable
let customMenuStore = [];

// 🚀 Root Status Endpoint (Fixes 404 Not Found on Render root URL)[cite: 6]
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'Shopmatries Food Delivery Backend is Live and Running Smoothly! 🚀',
    timestamp: new Date().toISOString()
  });
});

// 🔐 Admin Login Authentication Endpoint[cite: 6]
app.post('/api/admin/login', (req, res) => {
  try {
    const { passcode } = req.body;
    const adminPasscode = process.env.ADMIN_PASSCODE || 'mahendarmidari';

    if (passcode === adminPasscode) {
      return res.json({ success: true, token: 'admin_secure_session_active' });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid passcode' });
    }
  } catch (err) {
    console.error('Server login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delivery Fee & Rate Per KM Endpoints (Updated)
app.get('/api/settings/delivery-fee', (req, res) => {
  res.json({ deliveryFee: currentDeliveryFee, ratePerKm: currentRatePerKm });
});

app.put('/api/settings/delivery-fee', (req, res) => {
  if (req.body.deliveryFee !== undefined) {
    currentDeliveryFee = Number(req.body.deliveryFee);
  }
  if (req.body.ratePerKm !== undefined) {
    currentRatePerKm = Number(req.body.ratePerKm);
  }
  res.json({ success: true, deliveryFee: currentDeliveryFee, ratePerKm: currentRatePerKm });
});

// Geo-Fence Endpoints (Synced directly with MongoDB Atlas)[cite: 6]
app.get('/api/settings/geofence', async (req, res) => {
  try {
    const zone = await GeoFence.findOne().sort({ updatedAt: -1 });
    
    if (!zone) {
      return res.status(404).json({ message: 'No geo-fence zone configured yet.' });
    }
    
    res.status(200).json(zone);
  } catch (err) {
    console.error('Error fetching geo-fence:', err);
    res.status(500).json({ error: 'Server error while fetching geo-fence settings.' });
  }
});

app.put('/api/settings/geofence', async (req, res) => {
  try {
    const { centerLat, centerLng, radiusMeters } = req.body;

    if (centerLat == null || centerLng == null || radiusMeters == null) {
      return res.status(400).json({ error: 'Missing required geo-fence parameters.' });
    }

    let zone = await GeoFence.findOne();
    
    if (zone) {
      zone.centerLat = centerLat;
      zone.centerLng = centerLng;
      zone.radiusMeters = radiusMeters;
      await zone.save();
    } else {
      zone = await GeoFence.create({ centerLat, centerLng, radiusMeters });
    }

    res.status(200).json({ 
      success: true,
      message: 'Geo-fence successfully saved & synced!', 
      zone 
    });
  } catch (err) {
    console.error('Error saving geo-fence:', err);
    res.status(500).json({ error: 'Server error while saving geo-fence settings.' });
  }
});

// ⏰ Restaurant Operating Hours & Status Endpoint[cite: 6]
app.put('/api/restaurants/:id/hours', async (req, res) => {
  try {
    const { autoMode, isManuallyOpen, operatingHours } = req.body;
    const updatedRest = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { autoMode, isManuallyOpen, operatingHours },
      { new: true }
    );
    if (!updatedRest) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    res.json({ success: true, restaurant: updatedRest });
  } catch (err) {
    console.error('Failed to update restaurant hours:', err);
    res.status(500).json({ success: false, error: 'Failed to update operating hours' });
  }
});

// Offers Endpoints (Synced directly with MongoDB Atlas)[cite: 6]
app.get('/api/offers', async (req, res) => {
  try {
    let offer = await Offer.findOne();
    if (!offer) {
      offer = await Offer.create({
        tag: 'FLAT 50% OFF',
        title: 'FLAT 50% OFF',
        subtitle: 'On your first 3 food orders!',
        speed: '30 Min',
        bgMedia: '',
        mediaType: ''
      });
    }
    res.json(offer);
  } catch (err) {
    console.error('Failed to fetch offer:', err);
    res.status(500).json({ error: 'Failed to fetch offer from database' });
  }
});

app.put('/api/offers', async (req, res) => {
  try {
    const { tag, title, subtitle, speed, bgMedia, mediaType } = req.body;
    let offer = await Offer.findOne();

    if (!offer) {
      offer = await Offer.create({
        tag: tag || 'FLAT 50% OFF',
        title: title || 'FLAT 50% OFF',
        subtitle: subtitle || 'On your first 3 food orders!',
        speed: speed || '30 Min',
        bgMedia: bgMedia || '',
        mediaType: mediaType || ''
      });
    } else {
      offer.tag = tag !== undefined ? tag : offer.tag;
      offer.title = title !== undefined ? title : offer.title;
      offer.subtitle = subtitle !== undefined ? subtitle : offer.subtitle;
      offer.speed = speed !== undefined ? speed : offer.speed;
      offer.bgMedia = bgMedia !== undefined ? bgMedia : offer.bgMedia;
      offer.mediaType = mediaType !== undefined ? mediaType : offer.mediaType;

      await offer.save();
    }

    res.json({ success: true, offer });
  } catch (err) {
    console.error('Failed to update offer:', err);
    res.status(500).json({ success: false, error: 'Failed to save offer update to database' });
  }
});

// Custom Menu Endpoints[cite: 6]
app.get('/api/custom-menu', (req, res) => {
  res.json(customMenuStore);
});

app.post('/api/custom-menu', (req, res) => {
  const newItem = { _id: 'custom-' + Date.now(), ...req.body };
  customMenuStore.unshift(newItem);
  res.status(201).json({ success: true, item: newItem });
});

app.delete('/api/custom-menu/:id', (req, res) => {
  customMenuStore = customMenuStore.filter(i => (i._id || i.id) !== req.params.id);
  res.json({ success: true });
});

// Mount modular routes[cite: 6]
app.use('/api/auth', authRoutes);
app.use('/api/foods', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Socket.io Real-Time Connection Handler[cite: 6]
orderSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Shopmatries Backend Server running smoothly on port ${PORT}`);
});