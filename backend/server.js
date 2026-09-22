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
const Offer = require('./models/Offer'); // 👈 Import the Offer model for database persistence

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Make socket instance globally accessible in routes
app.set('io', io);

// Connect to MongoDB Atlas (shopmatries database)
connectDB();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Global storage stores
let currentDeliveryFee = 30;
let customMenuStore = [];

// Delivery Fee Endpoints
app.get('/api/settings/delivery-fee', (req, res) => {
  res.json({ deliveryFee: currentDeliveryFee });
});

app.put('/api/settings/delivery-fee', (req, res) => {
  if (req.body.deliveryFee !== undefined) {
    currentDeliveryFee = Number(req.body.deliveryFee);
  }
  res.json({ success: true, deliveryFee: currentDeliveryFee });
});

// Offers Endpoints (Synced directly with MongoDB Atlas)
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

// Custom Menu Endpoints
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

// Mount modular routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Socket.io Real-Time Connection Handler
orderSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Shopmatries Backend Server running smoothly on port ${PORT}`);
});