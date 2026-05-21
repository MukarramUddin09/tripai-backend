/**
 * WebSocket server for real-time availability sync (ws package, not socket.io).
 * Broadcasts synthetic availability updates every 8 seconds to subscribed clients.
 * Replace mock broadcast logic with real provider webhook handlers in production.
 */

import { WebSocketServer } from 'ws';
import logger from './logger.js';

/** @type {WebSocketServer|null} */
let wss = null;

/** @type {Map<import('ws').WebSocket, {city: string, categories: string[]}>} */
const subscriptions = new Map();

/** @type {NodeJS.Timeout|null} */
let broadcastInterval = null;

/** @type {NodeJS.Timeout|null} */
let heartbeatInterval = null;

/**
 * Returns a random integer between min and max (inclusive).
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates synthetic flight/train availability update payload.
 * In production, subscribe to IRCTC/ airline webhook feeds instead.
 * @param {string} city - Subscribed city context
 * @returns {object}
 */
function generateTransportUpdate(city) {
  const routes = ['HYD-MUM', 'DEL-BLR', 'MAA-GOI', 'CCU-JAI'];
  return {
    type: 'availability_update',
    provider: Math.random() > 0.5 ? 'IRCTC' : 'IndiGo',
    route: routes[randomInt(0, routes.length - 1)],
    city,
    seatsLeft: randomInt(0, 50),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generates synthetic hotel room availability update.
 * Replace with Booking.com webhook push in production.
 * @returns {object}
 */
function generateHotelUpdate() {
  return {
    type: 'availability_update',
    provider: 'Booking.com',
    hotelId: `hotel_${randomInt(1000, 9999)}`,
    roomsLeft: randomInt(0, 10),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Broadcasts mock availability updates to all subscribed clients.
 * @returns {void}
 */
function broadcastAvailabilityUpdates() {
  for (const [ws, sub] of subscriptions.entries()) {
    if (ws.readyState !== ws.OPEN) continue;

    const messages = [];

    if (sub.categories.includes('flight') || sub.categories.includes('train')) {
      messages.push(generateTransportUpdate(sub.city));
    }
    if (sub.categories.includes('hotel')) {
      messages.push(generateHotelUpdate());
    }

    for (const msg of messages) {
      ws.send(JSON.stringify(msg));
    }
  }
}

/**
 * Handles incoming WebSocket messages from clients.
 * @param {import('ws').WebSocket} ws - Client socket
 * @param {Buffer|string} raw - Raw message data
 * @returns {void}
 */
function handleMessage(ws, raw) {
  try {
    const data = JSON.parse(raw.toString());

    if (data.type === 'subscribe') {
      subscriptions.set(ws, {
        city: data.city || 'Mumbai',
        categories: data.categories || ['hotel', 'flight'],
      });
      ws.send(JSON.stringify({ type: 'subscribed', city: data.city, categories: data.categories }));
      logger.debug(`WebSocket subscribed: ${data.city}`);
      return;
    }

    if (data.type === 'PING') {
      ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
    }
  } catch (err) {
    logger.warn('Invalid WebSocket message', { message: err.message });
  }
}

/**
 * Attaches WebSocket server to the existing HTTP server.
 * @param {import('http').Server} httpServer - Node HTTP server instance
 * @returns {WebSocketServer}
 */
export function initWebSocketServer(httpServer) {
  if (wss) {
    shutdownWebSocketServer();
  }

  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('error', (err) => {
    logger.error('WebSocket server error', { message: err.message });
  });

  wss.on('connection', (ws) => {
    logger.info('WebSocket client connected');

    ws.on('message', (raw) => handleMessage(ws, raw));

    ws.on('close', () => {
      subscriptions.delete(ws);
      logger.debug('WebSocket client disconnected — subscription removed');
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error', { message: err.message });
      subscriptions.delete(ws);
    });

    ws.send(JSON.stringify({ type: 'connected', message: 'TripAI availability stream ready' }));
  });

  broadcastInterval = setInterval(broadcastAvailabilityUpdates, 8000);

  heartbeatInterval = setInterval(() => {
    for (const [ws] of subscriptions.entries()) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'PING', timestamp: new Date().toISOString() }));
      }
    }
  }, 30000);

  logger.info('WebSocket server initialized at /ws');
  return wss;
}

/**
 * Stops WebSocket intervals and closes all connections.
 * @returns {void}
 */
export function shutdownWebSocketServer() {
  if (broadcastInterval) clearInterval(broadcastInterval);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  subscriptions.clear();
  wss?.close();
}
