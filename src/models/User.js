/**
 * User model for TripAI authentication and profile management.
 * Handles password hashing via pre-save hook and comparePassword method.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, MEAL_PREFERENCES } from '../config/constants.js';
import { env } from '../config/env.js';

const preferencesSchema = new mongoose.Schema(
  {
    meal: { type: String, enum: MEAL_PREFERENCES, default: 'veg' },
    budget: { type: Number, min: 0, default: 10000 },
    preferredTransport: {
      type: [String],
      default: ['flight', 'train'],
    },
    alertCities: { type: [String], default: [] },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '0000000000',
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'user',
    },
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

/**
 * Pre-save hook: hash password when modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.password && this.googleId) return next();
  if (!this.password) {
    return next(new Error('Password is required for email registration'));
  }
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(env.bcryptSaltRounds);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compares plain-text password with stored hash.
 * @param {string} candidatePassword - Plain password to verify
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Returns user object without sensitive fields.
 * @returns {object}
 */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
