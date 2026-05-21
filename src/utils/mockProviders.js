/**
 * Synthetic mock provider API responses for TripAI development and demos.
 * Simulates real third-party travel APIs with randomized data and delays.
 * Replace these functions with real provider HTTP clients in production.
 */

/**
 * Returns a random integer between min and max (inclusive).
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Simulates network latency for mock provider calls.
 * @param {number} [minMs=100] - Minimum delay in milliseconds
 * @param {number} [maxMs=400] - Maximum delay in milliseconds
 * @returns {Promise<void>}
 */
function simulateDelay(minMs = 100, maxMs = 400) {
  const ms = randomInt(minMs, maxMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Builds ISO datetime for a given date offset in hours.
 * @param {string|Date} date - Base date
 * @param {number} hourOffset - Hours from base
 * @returns {string}
 */
function buildDateTime(date, hourOffset) {
  const d = new Date(date);
  d.setHours(d.getHours() + hourOffset);
  return d.toISOString();
}

const FLIGHT_PROVIDERS = ['IndiGo', 'Air India', 'SpiceJet'];
const TRAIN_CLASSES = ['SL', '3A', '2A', '1A'];
const BUS_OPERATORS = ['RedBus', 'SRS Travels', 'VRL'];
const CAB_PROVIDERS = ['Uber', 'Ola', 'Rapido'];

/**
 * Mock flight search — returns 3–5 options with random pricing.
 * @param {string} from - Origin airport/city code
 * @param {string} to - Destination airport/city code
 * @param {string|Date} date - Travel date
 * @param {number} [passengers=1] - Number of passengers
 * @returns {Promise<object[]>}
 */
export async function mockFlightSearch(from, to, date, passengers = 1) {
  await simulateDelay();
  const count = randomInt(3, 5);
  const results = [];

  for (let i = 0; i < count; i++) {
    const provider = FLIGHT_PROVIDERS[i % FLIGHT_PROVIDERS.length];
    const durationMins = randomInt(90, 180);
    const price = randomInt(3500, 12000) * passengers;
    const depHour = randomInt(5, 20);

    results.push({
      id: `FLT-${from}-${to}-${Date.now()}-${i}`,
      provider,
      price,
      duration: `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`,
      durationMinutes: durationMins,
      departureTime: buildDateTime(date, depHour),
      arrivalTime: buildDateTime(date, depHour + Math.ceil(durationMins / 60)),
      availability: randomInt(5, 50),
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      from,
      to,
      passengers,
      type: 'flight',
    });
  }

  return results;
}

/**
 * Mock IRCTC-style train search.
 * @param {string} from - Origin station
 * @param {string} to - Destination station
 * @param {string|Date} date - Travel date
 * @param {string} [travelClass='3A'] - Train class
 * @returns {Promise<object[]>}
 */
export async function mockTrainSearch(from, to, date, travelClass = '3A') {
  await simulateDelay();
  const count = randomInt(3, 4);
  const results = [];

  for (let i = 0; i < count; i++) {
    const cls = TRAIN_CLASSES.includes(travelClass) ? travelClass : TRAIN_CLASSES[i % 4];
    const durationMins = randomInt(360, 1200);
    const price = { SL: 400, '3A': 1200, '2A': 2200, '1A': 4500 }[cls] || 1200;

    results.push({
      id: `TRN-${from}-${to}-${Date.now()}-${i}`,
      provider: 'IRCTC',
      trainNumber: `${randomInt(12000, 29999)}`,
      price: price + randomInt(0, 300),
      duration: `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`,
      durationMinutes: durationMins,
      departureTime: buildDateTime(date, randomInt(4, 14)),
      arrivalTime: buildDateTime(date, randomInt(15, 23)),
      availability: randomInt(0, 80),
      rating: (3.8 + Math.random()).toFixed(1),
      class: cls,
      from,
      to,
      type: 'train',
    });
  }

  return results;
}

/**
 * Mock RedBus-style bus search.
 * @param {string} from - Origin city
 * @param {string} to - Destination city
 * @param {string|Date} date - Travel date
 * @returns {Promise<object[]>}
 */
export async function mockBusSearch(from, to, date) {
  await simulateDelay();
  const count = randomInt(3, 5);
  const results = [];

  for (let i = 0; i < count; i++) {
    const provider = BUS_OPERATORS[i % BUS_OPERATORS.length];
    const durationMins = randomInt(240, 720);

    results.push({
      id: `BUS-${from}-${to}-${Date.now()}-${i}`,
      provider,
      price: randomInt(500, 2500),
      duration: `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`,
      durationMinutes: durationMins,
      departureTime: buildDateTime(date, randomInt(18, 22)),
      arrivalTime: buildDateTime(date, randomInt(4, 8)),
      availability: randomInt(10, 40),
      rating: (3.5 + Math.random() * 1.2).toFixed(1),
      busType: ['AC Sleeper', 'Non-AC Seater', 'Volvo AC'][i % 3],
      from,
      to,
      type: 'bus',
    });
  }

  return results;
}

/**
 * Mock cab search (Uber/Ola/Rapido).
 * @param {string} from - Pickup location
 * @param {string} to - Drop location
 * @returns {Promise<object[]>}
 */
export async function mockCabSearch(from, to) {
  await simulateDelay();
  const results = CAB_PROVIDERS.map((provider, i) => {
    const durationMins = randomInt(20, 90);
    return {
      id: `CAB-${provider}-${Date.now()}-${i}`,
      provider,
      price: randomInt(150, 1200),
      duration: `${durationMins}m`,
      durationMinutes: durationMins,
      departureTime: new Date().toISOString(),
      arrivalTime: new Date(Date.now() + durationMins * 60000).toISOString(),
      availability: randomInt(1, 10),
      rating: (4 + Math.random()).toFixed(1),
      vehicleType: ['Mini', 'Prime Sedan', 'Auto'][i % 3],
      from,
      to,
      type: 'cab',
    };
  });

  return results;
}

/**
 * Mock bike rental search.
 * @param {string} from - Pickup location
 * @param {string} to - Destination (optional route hint)
 * @returns {Promise<object[]>}
 */
export async function mockBikeSearch(from, to) {
  await simulateDelay(80, 200);
  return ['Bounce', 'Vogo', 'Yulu'].map((provider, i) => ({
    id: `BIKE-${provider}-${Date.now()}-${i}`,
    provider,
    price: randomInt(50, 300),
    duration: `${randomInt(15, 60)}m`,
    durationMinutes: randomInt(15, 60),
    departureTime: new Date().toISOString(),
    arrivalTime: new Date(Date.now() + randomInt(15, 60) * 60000).toISOString(),
    availability: randomInt(3, 20),
    rating: (4 + Math.random() * 0.8).toFixed(1),
    from,
    to,
    type: 'bike',
  }));
}

/**
 * Mock local ride options at destination.
 * @param {string} from - Local pickup point
 * @param {string} to - Local destination
 * @returns {Promise<object[]>}
 */
export async function mockLocalRideSearch(from, to) {
  await simulateDelay();
  const cabs = await mockCabSearch(from, to);
  const bikes = await mockBikeSearch(from, to);
  return [...cabs, ...bikes].map((r) => ({ ...r, type: 'localRide' }));
}

/**
 * Mock provider booking confirmation (90% success rate).
 * @param {object} bookingDetails - Booking payload sent to provider
 * @returns {Promise<{success: boolean, providerBookingId: string|null, message: string}>}
 */
export async function mockConfirmBooking(bookingDetails) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const success = Math.random() < 0.9;

  if (success) {
    return {
      success: true,
      providerBookingId: `CONF-${bookingDetails.provider}-${Date.now()}`,
      message: 'Booking confirmed with provider',
    };
  }

  return {
    success: false,
    providerBookingId: null,
    message: 'Provider booking failed — please retry',
  };
}

/**
 * Mock refund initiation for cancelled bookings.
 * @param {string} providerBookingId - Provider reference ID
 * @param {number} amount - Refund amount
 * @returns {Promise<{refundId: string, status: string, amount: number}>}
 */
export async function mockInitiateRefund(providerBookingId, amount) {
  await simulateDelay(150, 300);
  return {
    refundId: `REF-${Date.now()}`,
    status: 'initiated',
    amount,
    providerBookingId,
  };
}

/**
 * Mock hotel search via Booking.com aggregator.
 * @param {string} city - City name
 * @param {object} [_params] - Additional search params
 * @returns {Promise<object[]>}
 */
export async function mockHotelProviderSearch(city, _params = {}) {
  await simulateDelay(200, 500);
  return {
    provider: 'Booking.com',
    city,
    status: 'ok',
    message: 'Use Hotel collection for detailed results',
  };
}

/**
 * Mock Razorpay order creation response.
 * @param {number} amount - Amount in INR
 * @param {string} currency - Currency code
 * @returns {Promise<object>}
 */
export async function mockCreatePaymentOrder(amount, currency = 'INR') {
  await simulateDelay(100, 250);
  return {
    orderId: `order_${Date.now()}`,
    amount: amount * 100,
    currency,
    paymentUrl: `https://mock-razorpay.tripai/pay/${Date.now()}`,
    status: 'created',
  };
}
