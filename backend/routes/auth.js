const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { log } = require('../middleware/logger');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password, role = 'cashier', name } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if username already exists
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({
      username: username.trim(),
      password,
      role,
      name: (name || username).trim(),
      email: email || null,
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find by username (case-insensitive)
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username.trim()}$`, 'i') },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is disabled' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log login activity
    await log(user, 'login', { username });

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON(), // password is stripped by toJSON()
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', verifyToken, async (req, res) => {
  const { email, name } = req.body;

  try {
    const update = {};
    if (email !== undefined) update.email = email;
    if (name !== undefined) update.name = name;

    await User.findByIdAndUpdate(req.user._id, update, { runValidators: true });
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', verifyToken, async (req, res) => {
  await log(req.user, 'logout', {});
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/verify
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      role: req.user.role,
    },
  });
});

module.exports = router;