const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendEmail, isEmailConfigured } = require('../utils/email');

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const validPassword = password => typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
const newToken = () => crypto.randomBytes(32).toString('hex');

router.post('/register', async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();
    if (!name || name.length < 2) return res.status(400).json({ error: 'Enter your full name.' });
    if (!EMAIL_PATTERN.test(email || '')) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (!validPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters and contain a letter and a number.' });
    if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    const verificationToken = newToken();
    await User.create({ name, email, password, isEmailVerified: false, verificationTokenHash: crypto.createHash('sha256').update(verificationToken).digest('hex'), verificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    const verificationLink = `${clientUrl}/verify-email/${verificationToken}`;
    const delivered = await sendEmail({ to: email, subject: 'Verify your TravelNest email', text: `Welcome to TravelNest. Verify your email: ${verificationLink}`, html: `<p>Welcome to TravelNest.</p><p><a href="${verificationLink}">Verify your email</a></p><p>This link expires in 24 hours.</p>` });
    if (!delivered) console.log('Email verification link:', verificationLink);
    res.status(201).json({ message: delivered ? 'Account created. Check your email to verify your account.' : 'Account created. Email delivery is not configured yet.', ...(isEmailConfigured() ? {} : { verificationLink }) });
  } catch (error) { res.status(500).json({ error: 'Could not create your account.' }); }
});

router.get('/verify-email/:token', async (req, res) => {
  const verificationTokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ verificationTokenHash, verificationExpiresAt: { $gt: new Date() } });
  if (!user) return res.status(400).json({ error: 'This verification link is invalid or has expired.' });
  user.isEmailVerified = true; user.verificationTokenHash = undefined; user.verificationExpiresAt = undefined;
  await user.save();
  res.json({ message: 'Email verified. You can now log in.' });
});

router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();
    if (!EMAIL_PATTERN.test(email || '') || !password) return res.status(400).json({ error: 'Enter a valid email address and password.' });
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Incorrect email or password.' });
    if (user.isEmailVerified === false) return res.status(403).json({ error: 'Verify your email before logging in.' });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (error) { res.status(500).json({ error: 'Could not log you in.' }); }
});

router.post('/forgot-password', async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email || '')) return res.status(400).json({ error: 'Enter a valid email address.' });
  const user = await User.findOne({ email });
  const message = 'If that address is registered, a reset link has been created.';
  if (!user) return res.json({ message });
  await PasswordReset.deleteMany({ userId: user._id });
  const token = newToken();
  await PasswordReset.create({ userId: user._id, token: crypto.createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
  const resetLink = `${clientUrl}/reset-password/${token}`;
  const delivered = await sendEmail({ to: email, subject: 'Reset your TravelNest password', text: `Reset your TravelNest password: ${resetLink}`, html: `<p>Reset your TravelNest password.</p><p><a href="${resetLink}">Reset password</a></p><p>This link expires in 30 minutes.</p>` });
  if (!delivered) console.log('Password reset link:', resetLink);
  res.json({ message: delivered ? message : 'Email delivery is not configured yet.', ...(isEmailConfigured() ? {} : { resetLink }) });
});

router.post('/reset-password/:token', async (req, res) => {
  const password = req.body.password?.trim();
  if (!validPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters and contain a letter and a number.' });
  const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const reset = await PasswordReset.findOne({ token, expiresAt: { $gt: new Date() } });
  if (!reset) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  const user = await User.findById(reset.userId);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  user.password = password; await user.save(); await PasswordReset.deleteMany({ userId: user._id });
  res.json({ message: 'Password reset successfully. Please log in.' });
});

module.exports = router;
