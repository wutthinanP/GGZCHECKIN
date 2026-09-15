/**
 * Realtime Event Broadcaster using Server-Sent Events (SSE)
 */

const clients = new Set();

/**
 * Register a client response stream for SSE
 */
const addClient = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  const clientId = Date.now() + '-' + Math.random();
  const client = { id: clientId, res, userId: req.user?.id, role: req.user?.role_name };
  clients.add(client);

  // Send initial connection ping
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Heartbeat ping every 25 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
};

/**
 * Broadcast an event to all connected clients (or specific role/user)
 * @param {string} eventType - e.g. 'ATTENDANCE_UPDATE', 'REQUEST_UPDATE', 'NOTIFICATION_UPDATE'
 * @param {object} payload - payload data
 */
const broadcast = (eventType, payload = {}) => {
  const data = JSON.stringify({ type: eventType, payload, timestamp: new Date().toISOString() });
  for (const client of clients) {
    try {
      client.res.write(`event: message\ndata: ${data}\n\n`);
    } catch (err) {
      clients.delete(client);
    }
  }
};

module.exports = { addClient, broadcast };
