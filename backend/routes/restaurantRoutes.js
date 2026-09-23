const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');

// ==========================================
// RESTAURANT / HOTEL ROUTES (Strict DB Mode)
// ==========================================

// GET: Fetch strictly real restaurants from MongoDB Atlas (No fake data)
router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (err) {
    console.error('Failed to fetch restaurants:', err);
    res.status(500).json({ error: 'Failed to fetch restaurants from database' });
  }
});

// POST: Add a new restaurant/hotel directly to MongoDB Atlas
router.post('/restaurants', async (req, res) => {
  try {
    const { name, address, cuisine } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Restaurant name is required' });
    }
    const newRestaurant = await Restaurant.create({
      name,
      address: address || 'Local Area',
      cuisine: cuisine || ['Multi-Cuisine'],
      isOpen: true
    });
    res.status(201).json({ success: true, restaurant: newRestaurant });
  } catch (err) {
    console.error('Failed to add restaurant:', err);
    res.status(500).json({ success: false, error: 'Failed to save restaurant' });
  }
});


// ==========================================
// FOOD ITEM / CATALOG ROUTES
// ==========================================

// GET: Fetch all food items from MongoDB Atlas
router.get('/', async (req, res) => {
  try {
    const foods = await FoodItem.find().sort({ createdAt: -1 });
    res.json(foods);
  } catch (err) {
    console.error('Failed to fetch food items:', err);
    res.status(500).json({ error: 'Failed to fetch food items' });
  }
});

// POST: Add a new food item from the admin panel into MongoDB Atlas
router.post('/', async (req, res) => {
  try {
    console.log('📥 Incoming Food Item Payload:', req.body);

    const englishName = req.body.englishName || req.body.name || req.body.dishName;
    const kannadaName = req.body.kannadaName || '';
    const price = req.body.price || req.body.amount;
    const category = req.body.category || 'General';
    const hotelId = req.body.hotelId || '';
    const hotelName = req.body.hotelName || req.body.hotelNameInput || '';
    const image = req.body.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
    const hotelImage = req.body.hotelImage || ''; // 👈 Fixed: Defined hotelImage safely from payload

    if (!englishName || price === undefined || price === null || price === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Food name and price are required fields', 
        received: req.body 
      });
    }

    const newFoodItem = await FoodItem.create({
      englishName,
      kannadaName,
      name: englishName, 
      price: Number(price),
      category,
      hotelId,
      hotelName,
      image,
      hotelImage, // 👈 Now references the defined variable safely
      available: true
    });

    console.log('✅ Successfully saved to MongoDB Atlas:', newFoodItem);
    res.status(201).json({ success: true, item: newFoodItem });
  } catch (err) {
    console.error('❌ Failed to add food dish to database:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to save food item to database' });
  }
});

// DELETE: Remove food item by ID
router.delete('/:id', async (req, res) => {
  try {
    await FoodItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Food item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete food item' });
  }
});

// PUT: Update food item price by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await FoodItem.findByIdAndUpdate(
      req.params.id,
      { price: Number(req.body.price) },
      { new: true }
    );
    res.json({ success: true, item: updatedItem });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update price' });
  }
});

module.exports = router;