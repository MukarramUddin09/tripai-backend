/**
 * Shared seed data and functions for TripAI database bootstrap.
 * Used automatically on server start when collections are empty.
 */

import Hotel from '../models/Hotel.js';
import Entertainment from '../models/Entertainment.js';
import ProviderRegistry from '../models/ProviderRegistry.js';
import User from '../models/User.js';
import logger from './logger.js';

const DEMO_USER = {
  name: 'Aarav Sharma',
  email: 'demo@tripai.com',
  password: 'demo123456',
  phone: '9876543210',
};

const HOTEL_CITIES = [
  {
    city: 'Mumbai',
    coords: [72.8777, 19.076],
    hotels: [
      { name: 'Taj Mahal Palace', address: 'Apollo Bunder, Colaba', starRating: 5, pricePerNight: 25000, provider: 'Booking.com' },
      { name: 'Hotel Sea Queen', address: 'Juhu Beach Road', starRating: 4, pricePerNight: 6500, provider: 'OYO' },
    ],
  },
  {
    city: 'Delhi',
    coords: [77.209, 28.6139],
    hotels: [
      { name: 'The Imperial New Delhi', address: 'Janpath, Connaught Place', starRating: 5, pricePerNight: 18000, provider: 'Booking.com' },
      { name: 'Bloomrooms @ Link Road', address: 'Karol Bagh', starRating: 3, pricePerNight: 3200, provider: 'OYO' },
    ],
  },
  {
    city: 'Goa',
    coords: [73.8278, 15.2993],
    hotels: [
      { name: 'W Goa', address: 'Vagator Beach', starRating: 5, pricePerNight: 22000, provider: 'Booking.com' },
      { name: 'Beach Shack Resort', address: 'Calangute', starRating: 3, pricePerNight: 4500, provider: 'direct' },
    ],
  },
  {
    city: 'Ooty',
    coords: [76.6932, 11.4064],
    hotels: [
      { name: 'Savoy Ooty', address: 'Sylks Road', starRating: 4, pricePerNight: 12000, provider: 'Booking.com' },
      { name: 'Hill View Cottage', address: 'Charring Cross', starRating: 3, pricePerNight: 3800, provider: 'direct' },
    ],
  },
  {
    city: 'Jaipur',
    coords: [75.7873, 26.9124],
    hotels: [
      { name: 'Rambagh Palace', address: 'Bhawani Singh Road', starRating: 5, pricePerNight: 35000, provider: 'Booking.com' },
      { name: 'Pink City Heritage Inn', address: 'MI Road', starRating: 3, pricePerNight: 2800, provider: 'OYO' },
    ],
  },
];

/**
 * Builds standard room types for a hotel.
 * @param {number} basePrice - Base nightly price
 * @returns {object[]}
 */
function buildRooms(basePrice) {
  return [
    { type: 'Standard', beds: 1, capacity: 2, price: basePrice, availability: 8 },
    { type: 'Deluxe', beds: 2, capacity: 3, price: Math.round(basePrice * 1.4), availability: 5 },
    { type: 'Suite', beds: 2, capacity: 4, price: Math.round(basePrice * 2.2), availability: 2 },
  ];
}

/**
 * Builds sample veg/non-veg menus.
 * @returns {object}
 */
function buildMenu() {
  return {
    veg: [
      { name: 'Paneer Butter Masala', price: 320 },
      { name: 'Dal Tadka', price: 180 },
      { name: 'Veg Biryani', price: 280 },
    ],
    nonVeg: [
      { name: 'Chicken Tikka', price: 380 },
      { name: 'Mutton Rogan Josh', price: 520 },
      { name: 'Fish Curry', price: 450 },
    ],
  };
}

/**
 * Seeds hotels if the collection is empty.
 * @returns {Promise<number>} Number of documents inserted
 */
export async function seedHotelsIfEmpty() {
  const count = await Hotel.countDocuments();
  if (count > 0) return 0;

  const docs = [];
  for (const { city, coords, hotels } of HOTEL_CITIES) {
    for (const h of hotels) {
      docs.push({
        ...h,
        city,
        amenities: ['WiFi', 'AC', 'Parking', 'Restaurant', 'Pool'].slice(0, h.starRating + 1),
        images: [
          `https://picsum.photos/seed/${encodeURIComponent(h.name)}/800/600`,
          `https://picsum.photos/seed/${encodeURIComponent(h.name)}2/800/600`,
        ],
        rooms: buildRooms(h.pricePerNight),
        menu: buildMenu(),
        providerId: `PRV-${city}-${Date.now()}`,
        rating: 3.5 + h.starRating * 0.3,
        totalReviews: Math.floor(Math.random() * 500) + 50,
        isActive: true,
        location: { type: 'Point', coordinates: coords },
      });
    }
  }

  await Hotel.insertMany(docs);
  logger.info(`[Bootstrap] Seeded ${docs.length} hotels`);
  return docs.length;
}

/**
 * Seeds entertainment venues if the collection is empty.
 * @returns {Promise<number>}
 */
export async function seedEntertainmentIfEmpty() {
  const count = await Entertainment.countDocuments();
  if (count > 0) return 0;

  const venues = [
    { name: 'Gateway of India Tour', city: 'Mumbai', type: 'tourist', entryFee: 0, popularity: 95 },
    { name: 'PVR Icon Phoenix', city: 'Mumbai', type: 'movie', entryFee: 350, popularity: 80 },
    { name: 'Red Fort Heritage Walk', city: 'Delhi', type: 'tourist', entryFee: 50, popularity: 90 },
    { name: 'Kingdom of Dreams', city: 'Delhi', type: 'show', entryFee: 2500, popularity: 85 },
    { name: 'Dudhsagar Falls Trek', city: 'Goa', type: 'tourist', entryFee: 500, popularity: 88 },
    { name: 'Club Cubana', city: 'Goa', type: 'show', entryFee: 1500, popularity: 75 },
    { name: 'Ooty Botanical Garden', city: 'Ooty', type: 'tourist', entryFee: 30, popularity: 82 },
    { name: 'Amer Fort Light Show', city: 'Jaipur', type: 'show', entryFee: 200, popularity: 92 },
  ];

  const docs = venues.map((v) => ({
    ...v,
    description: `Experience ${v.name} in ${v.city}`,
    location: `${v.city} city center`,
    openingHours: '09:00 - 21:00',
    images: [`https://picsum.photos/seed/${encodeURIComponent(v.name)}/800/500`],
    ticketTiers: [
      { name: 'General', price: v.entryFee || 100, capacity: 200, available: 150 },
      { name: 'Premium', price: (v.entryFee || 100) * 2, capacity: 50, available: 40 },
    ],
    isActive: true,
  }));

  await Entertainment.insertMany(docs);
  logger.info(`[Bootstrap] Seeded ${docs.length} entertainment venues`);
  return docs.length;
}

/**
 * Seeds provider registry if empty.
 * @returns {Promise<number>}
 */
export async function seedProvidersIfEmpty() {
  const count = await ProviderRegistry.countDocuments();
  if (count > 0) return 0;

  const providers = [
    { name: 'IndiGo', type: 'flight', score: 4.2 },
    { name: 'Air India', type: 'flight', score: 3.8 },
    { name: 'SpiceJet', type: 'flight', score: 3.9 },
    { name: 'IRCTC', type: 'train', score: 3.5 },
    { name: 'RedBus', type: 'bus', score: 4.0 },
    { name: 'Uber', type: 'cab', score: 4.3 },
    { name: 'Ola', type: 'cab', score: 4.1 },
    { name: 'Booking.com', type: 'hotel', score: 4.5 },
    { name: 'OYO', type: 'hotel', score: 3.7 },
  ];

  await ProviderRegistry.insertMany(
    providers.map((p) => ({ ...p, status: 'active', totalRatings: 100 })),
  );
  logger.info(`[Bootstrap] Seeded ${providers.length} providers`);
  return providers.length;
}

/**
 * Runs all bootstrap seeders when collections are empty.
 * @returns {Promise<void>}
 */
/**
 * Creates demo user for frontend auto-login if missing.
 * @returns {Promise<number>}
 */
export async function seedDemoUserIfEmpty() {
  const exists = await User.findOne({ email: DEMO_USER.email });
  if (exists) return 0;
  await User.create(DEMO_USER);
  logger.info('[Bootstrap] Demo user created (demo@tripai.com / demo123456)');
  return 1;
}

/**
 * Runs all bootstrap seeders when collections are empty.
 * @returns {Promise<void>}
 */
export async function runBootstrap() {
  await Promise.all([
    seedHotelsIfEmpty(),
    seedEntertainmentIfEmpty(),
    seedProvidersIfEmpty(),
    seedDemoUserIfEmpty(),
  ]);
}
