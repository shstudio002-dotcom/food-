const FoodItem = require('../models/FoodItem');

// Get all food items
exports.getFoods = async (req, res) => {
  try {
    const foods = await FoodItem.find();
    res.status(200).json(foods);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch food catalog' });
  }
};

// Add new food dish
exports.addFood = async (req, res) => {
  try {
    const { kannadaName, englishName, name, category, hotelImage, price, image, hotelName, restaurant, hotelId } = req.body;
    const dishName = englishName || name;

    const newFood = new FoodItem({
      name: dishName,
      kannadaName: kannadaName || dishName,
      category: category || 'Hotels',
      price: Number(price),
      image: image || '',
      hotelName: hotelName || restaurant || '',
      hotelId: hotelId || '',
      hotelImage: hotelImage || '',
      inStock: true
    });

    await newFood.save();
    res.status(201).json({ success: true, item: newFood });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add food dish' });
  }
};

// Update food price or details
exports.updateFood = async (req, res) => {
  try {
    const { price, name, kannadaName, category, image, hotelName, hotelImage } = req.body;
    const updated = await FoodItem.findByIdAndUpdate(
      req.params.id,
      { 
        ...(price !== undefined && { price: Number(price) }), 
        ...(name && { name }), 
        ...(kannadaName && { kannadaName }), 
        ...(category && { category }),
        ...(image && { image }),
        ...(hotelName && { hotelName }),
        ...(hotelImage && { hotelImage })
      },
      { new: true }
    );
    res.status(200).json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update food item' });
  }
};

// Delete food item
exports.deleteFood = async (req, res) => {
  try {
    await FoodItem.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Food item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete food item' });
  }
};