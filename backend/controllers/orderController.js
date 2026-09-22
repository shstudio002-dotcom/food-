const Order = require('../models/Order');

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customerName, phone, totalPrice, items, address } = req.body;
    const newOrder = new Order({
      customerName: customerName || 'Customer',
      phone: phone || '9108626303',
      totalPrice: Number(totalPrice),
      items: items || [],
      address: address || '[GPS: 13.9466, 75.5428] Shivamogga',
      status: 'Hub',
      progress: 0
    });

    await newOrder.save();
    res.status(201).json({ success: true, order: newOrder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { status, progress } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status, progress },
      { new: true }
    );
    res.status(200).json({ success: true, order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order checkpoint' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Order delivered and cleared from database' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
};