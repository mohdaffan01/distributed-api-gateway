import redisClient from "../config/redis.js";

const RATE_LIMIT = 5000;
const WINDOW_SECONDS = 60;

export const rateLimiter = async (req, res, next) => {
  try {
    const clientIP = req.ip;

    const key = `rate-limit:${clientIP}`; // Use a unique key for each client IP

    const count = await redisClient.incr(key); // Increment the request count for the client IP

    if (count === 1) {
      await redisClient.expire(key, WINDOW_SECONDS);
    }

    if (count > RATE_LIMIT) { 
      return res.status(429).json({
        error: "Too many requests",
      });
    }

    next(); // Proceed to the next middleware or route handler if the request is within the rate limit
  } catch (error) {
    console.error("Rate limiter error:", error);

    next();
  }
};