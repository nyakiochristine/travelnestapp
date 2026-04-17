const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const PasswordReset = require('../models/PasswordReset');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Register route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email and password' });
    }

    const cleanPassword = password.trim();

    const newUser = new User({
      name,
      email,
      password: cleanPassword
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const cleanPassword = password.trim();

    console.log('🔑 Login attempt:', { email: email || 'MISSING', passwordLength: cleanPassword.length });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log('👤 User found:', user ? user.email : 'NONE');

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('🔐 Comparing input len', cleanPassword.length, 'vs hash len', user.password.length);

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    console.log('✅ MATCH RESULT:', isMatch, 'for', email);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Please provide your email' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success to avoid exposing whether email exists
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    await PasswordReset.deleteMany({ userId: user._id });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await PasswordReset.create({
      userId: user._id,
      token: resetToken,
      expiresAt
    });

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    console.log('Password reset link:', resetLink);

    res.json({
      message: 'Password reset link generated',
      resetLink
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Please provide a new password' });
    }

    const resetRequest = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRequest) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = await User.findById(resetRequest.userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    user.password = password.trim();
    await user.save();

    await PasswordReset.deleteMany({ userId: user._id });

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;