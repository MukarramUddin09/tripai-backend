/**
 * Hotel seeder CLI — manual re-seed (clears and re-inserts hotels).
 * Normal dev uses automatic bootstrap on server start.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hotel from '../models/Hotel.js';
import { seedHotelsIfEmpty } from './seedData.js';

dotenv.config();

/**
 * CLI entry: force re-seed hotels.
 * @returns {Promise<void>}
 */
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI required');
    process.exit(1);
  }

  await mongoose.connect(uri);
  await Hotel.deleteMany({});
  const count = await seedHotelsIfEmpty();
  console.log(`Seeded ${count} hotels`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
