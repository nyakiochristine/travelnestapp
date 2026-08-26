const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['traveller', 'business', 'admin'], default: 'traveller' },
    businessVerificationStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    isEmailVerified: { type: Boolean, default: false },
    verificationTokenHash: { type: String, select: false },
    verificationExpiresAt: { type: Date, select: false },

    profilePicture: { type: String, default: '/images/default-avatar.png' },
    bio: { type: String, maxlength: 500, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    facebook: { type: String, default: '' },

    totalItineraries: { type: Number, default: 0 },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('User', userSchema);
