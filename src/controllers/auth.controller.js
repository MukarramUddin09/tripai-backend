/**
 * Authentication controller for TripAI user registration, login, and profile management.
 */

import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { tokenBlacklist } from '../middlewares/auth.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Generates a signed JWT access token.
 * @param {object} user - User document
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

/**
 * Resolves user role from email — admin for configured admin email.
 * @param {string} email
 * @returns {'admin'|'user'}
 */
function resolveRole(email) {
  return email?.toLowerCase() === env.adminEmail ? 'admin' : 'user';
}

/**
 * POST /api/auth/google — Sign in or register via Google ID token.
 */
export async function googleAuth(req, res) {
  const { credential } = req.body;
  if (!credential) throw new AppError('Google credential required', 400);
  if (!env.googleClientId) throw new AppError('Google OAuth not configured', 503);

  const client = new OAuth2Client(env.googleClientId);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new AppError('Google account email not available', 400);

  const email = payload.email.toLowerCase();
  const role = resolveRole(email);

  let user = await User.findOne({ $or: [{ email }, { googleId: payload.sub }] });

  if (user) {
    user.googleId = payload.sub;
    user.name = user.name || payload.name || email.split('@')[0];
    user.avatar = payload.picture || user.avatar;
    user.role = role;
    await user.save();
  } else {
    user = await User.create({
      name: payload.name || email.split('@')[0],
      email,
      googleId: payload.sub,
      avatar: payload.picture,
      role,
      phone: '0000000000',
    });
  }

  const token = generateToken(user);
  sendSuccess(res, {
    message: 'Google sign-in successful',
    data: { token, user: user.toSafeObject() },
  });
}

/**
 * POST /api/auth/register — Register a new user account.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function register(req, res) {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: resolveRole(email),
  });
  const token = generateToken(user);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: { token, user: user.toSafeObject() },
  });
}

/**
 * POST /api/auth/login — Authenticate user and return JWT.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user);
  sendSuccess(res, {
    message: 'Login successful',
    data: { token, user: user.toSafeObject() },
  });
}

/**
 * POST /api/auth/logout — Blacklist current JWT (mock Redis Map).
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function logout(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // TODO: Replace tokenBlacklist Map with Redis SET + TTL matching JWT expiry
    const decoded = jwt.decode(token);
    const expiryMs = decoded?.exp ? decoded.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
    tokenBlacklist.set(token, expiryMs);
  }

  sendSuccess(res, { message: 'Logged out successfully', data: null });
}

/**
 * GET /api/auth/me — Return current authenticated user profile.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function getMe(req, res) {
  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  sendSuccess(res, { data: user.toSafeObject(), message: 'Profile retrieved' });
}

/**
 * PUT /api/auth/profile — Update user profile fields.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function updateProfile(req, res) {
  const allowed = ['name', 'phone', 'avatar', 'preferences'];
  const updates = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user.userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  sendSuccess(res, { data: user.toSafeObject(), message: 'Profile updated' });
}

/**
 * POST /api/auth/change-password — Change password after verifying old one.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user.userId).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, { message: 'Password changed successfully', data: null });
}
