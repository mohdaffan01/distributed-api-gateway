import redisClient from "../config/redis.js";

const CACHE_TTL = 30;

export const cache = async (req, res, next) => {
  try {
    const key = `cache:${req.originalUrl}`;

    const cachedData = await redisClient.get(key);

    if (cachedData) {
      console.log("Cache HIT:", key);

      return res.status(200).json(JSON.parse(cachedData));
    }

    console.log("Cache MISS:", key);

    req.cacheKey = key;

    next();
  } catch (error) {
    console.error("Cache error:", error);
    next();
  }
};