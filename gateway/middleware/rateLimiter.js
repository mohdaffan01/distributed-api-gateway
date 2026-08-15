const clients = new Map(); //map --> 

const RATE_LIMIT = 100;
const WINDOW_MS = 60 * 1000; // 1 minute

export const rateLimiter = (req, res, next) => {
  const clientIP = req.ip; // Get the client's IP address

  const now = Date.now();

  const client = clients.get(clientIP); // Get the client data from the map

  if (!client) { // If the client is not in the map, add them with a count of 1 and set the reset time
    clients.set(clientIP, {
      count: 1,
      resetTime: now + WINDOW_MS
    });

    return next();
  }

  if (now >= client.resetTime) { // If the reset time has passed, reset the count and set a new reset time
    client.count = 1;
    client.resetTime = now + WINDOW_MS;

    return next();
  }

  if (client.count >= RATE_LIMIT) { // If the client has exceeded the rate limit, return a 429 response
    return res.status(429).json({
      error: "Too many requests"
    });
  }

  client.count++;

  next();
};