const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!phone || !password || !name) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    let existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this mobile number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const isAdminUser = phone === process.env.ADMIN_PHONE;

    const newUser = await User.create({
      name,
      phone,
      password: hashedPassword,
      isAdmin: isAdminUser,
      role: isAdminUser ? 'admin' : 'customer'
    });

    res.status(201).json({
      success: true,
      token: 'token-' + phone + '-' + Date.now(),
      isAdmin: newUser.isAdmin,
      message: 'Account created successfully'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: 'Phone and password are required' });
    }

    let user = await User.findOne({ phone });

    if (!user && phone === process.env.ADMIN_PHONE && password === process.env.ADMIN_PASSWORD) {
      user = {
        name: 'Admin Manager',
        phone: process.env.ADMIN_PHONE,
        isAdmin: true
      };
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid mobile number or password' });
    }

    let isMatch = false;
    if (phone === process.env.ADMIN_PHONE && password === process.env.ADMIN_PASSWORD) {
      isMatch = true;
    } else if (user.password) {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid mobile number or password' });
    }

    const isAdmin = phone === process.env.ADMIN_PHONE || user.isAdmin;

    res.json({
      success: true,
      token: 'token-' + phone + '-' + Date.now(),
      name: user.name,
      phone: user.phone,
      isAdmin: isAdmin,
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userPhone = req.query.phone || req.headers['x-user-phone'];
    const user = await User.findOne({ phone: userPhone });

    if (user) {
      res.json({
        name: user.name,
        email: user.email || `${user.phone}@shopmatries.com`,
        phone: `+91 ${user.phone}`
      });
    } else {
      res.json({
        name: 'Valued Customer',
        email: 'support@shopmatries.com',
        phone: '+91 0000000000'
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};