import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';

import { rateLimiter } from './middleware/rateLimiter.js';
import { cache } from './middleware/cache.js';
import redisClient from './config/redis.js';
import CricuitBreaker from './middleware/circuitBreaker.js';
import backpressure from './middleware/backpressure.js';

const app = express();


const PORT = process.env.PORT || 4000;
const BACKENDS = [
  process.env.BACKEND_1,
  process.env.BACKEND_2,
  process.env.BACKEND_3
];

// create a instance of cicuit Breaker
const circuitBreaker = new CricuitBreaker();
setInterval(() => {
  BACKENDS.forEach(async (backend) => {
    const state = await circuitBreaker.getState(backend);

    if (state === "OPEN") {
      await circuitBreaker.tryRecovery(backend);
    }
  });
}, 10000);

const checkBackendHealth = async (backend) => {
  try {
    const response = await fetch(`${backend}/health`);
    const key = `backend-health:${backend}`;
    if (response.ok) {
      await redisClient.set(key, "healthy");
      console.log(`Healthy: ${backend}`);
    } else {
      await redisClient.set(key, "unhealthy");
      console.log(`Unhealthy: ${backend}`);
    }
  } catch (error) {
    const key = `backend-health:${backend}`;

    await redisClient.set(key, "unhealthy");

    console.log(`Unhealthy: ${backend}`);
  }
};

setInterval(() => {
  BACKENDS.forEach(checkBackendHealth);
}, 5000);

let currentBackend = 0; // Index of the current backend to use

const getNextBackend = async () => {
  const availableBackends = [];
  for (const backend of BACKENDS) {
    const key = `backend-health:${backend}`;
    const status = await redisClient.get(key);
    const circuitOpen = await circuitBreaker.isOpen(backend);
    if (status === "healthy" && !circuitOpen) {
      availableBackends.push(backend);
    }
  }
  if (availableBackends.length === 0) {
    throw new Error("No healthy backends available");
  }
  const backend = availableBackends[currentBackend % availableBackends.length];
  console.log("Selected backend:", backend);
  currentBackend = (currentBackend + 1) % availableBackends.length;
  return backend;
};

// Rate Limiter
app.use(rateLimiter);

//backpressure
app.use(backpressure);

// Gateway health
app.get('/health', (req, res) => {
  res.status(200).json({
    gateway: 'OK'
  });
});

// Cache users endpoint
app.get('/api/users', cache);

// API proxy
app.use(
  '/api',
  createProxyMiddleware({
    // target: BACKEND_URL,
    target: BACKENDS[0], //this not mean that all request use the first backend
    router: async (req) => {
      const backend = await getNextBackend();
      req.selectedBackend = backend;
      return backend;
    },
    changeOrigin: true,
    proxyTimeout: 10000,

    pathRewrite: (path) => {
      return `/api${path}`;
    },

    on: {
      proxyReq: (proxyReq, req) => {
        proxyReq.removeHeader("if-none-match");
        proxyReq.removeHeader("if-modified-since");

        console.log(`Proxying: ${req.method} ${req.originalUrl}`);
      },

      proxyRes: (proxyRes, req, res) => {
        console.log(`Backend response: ${proxyRes.statusCode}`);

        let body = "";

        proxyRes.on("data", (chunk) => {
          console.log("Receiving data...");
          body += chunk.toString();
        });

        proxyRes.on("end", async () => {
          console.log("Backend response ended");

          if (
            req.cacheKey &&
            proxyRes.statusCode === 200
          ) {
            try {
              await redisClient.setEx(
                req.cacheKey,
                30,
                body
              );

              console.log("Cached:", req.cacheKey);
            } catch (error) {
              console.error("Cache save error:", error);
            }
          }

          if (
            proxyRes.statusCode >= 200 &&
            proxyRes.statusCode < 300
          ) {
            await circuitBreaker.recordSuccess(
              req.selectedBackend
            );
          }
        });
      },

      error: async (err, req, res) => {
        await circuitBreaker.recordFailure(req.selectedBackend);
        console.error("Proxy error:", err.message);
        if (err.code === "ECONNRESET") {
          console.log("Backend request timed out");

          return res.status(504).json({
            error: "Gateway Timeout",
            message: "Backend took too long to respond"
          });
        }
        if (!res.headersSent) {
          res.status(502).json({
            error: "Bad Gateway",
            message: "Backend service failed"
          });
        }
      }

    }
  })
);



app.get('/test-recovery', (req, res) => {
  circuitBreaker.tryRecovery();

  console.log("Circuit state:", circuitBreaker.state);

  res.json({
    state: circuitBreaker.state
  });
});


//--------------------------------------listen --------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Gateway running on http://localhost:${PORT}`);
  console.log('Backends:', BACKENDS);
});