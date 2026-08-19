import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { rateLimiter } from './middleware/rateLimiter.js';
import { cache } from './middleware/cache.js';
import redisClient from './config/redis.js';
import CricuitBreaker from './middleware/circuitBreaker.js';

const app = express();

const PORT = process.env.PORT || 4000;
const BACKENDS = [
  'http://localhost:3001', // index [0]
  'http://localhost:3002', // index [1]
  'http://localhost:3003'  // index [2]
];

const healthyBackends = new Set();


// create a instance of cicuit Breaker
const circuitBreaker = new CricuitBreaker();
setTimeout(() => {
  circuitBreaker.tryRecovery();
  console.log("Circuit state:", circuitBreaker.state);
}, 10000);

const checkBackendHealth = async (backend) => {
  try {
    const response = await fetch(`${backend}/health`);

    if (response.ok) {
      healthyBackends.add(backend);
      console.log(`Healthy: ${backend}`);
    } else {
      healthyBackends.delete(backend);
      console.log(`Unhealthy: ${backend}`);
    }
  } catch (error) {
    healthyBackends.delete(backend);
    console.log(`Unhealthy: ${backend}`);
  }
};
BACKENDS.forEach(checkBackendHealth);

let currentBackend = 0; // Index of the current backend to use

const getNextBackend = () => { // round robin function
  const availableBackends = BACKENDS.filter((backend) =>
    healthyBackends.has(backend)
  );
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
    router: () => { // router use round robin for selecting  the backend
      return getNextBackend();
    },
    changeOrigin: true,
    proxyTimeout: 5000, // if backend not respond to 5 sec sec then send a error message

    pathRewrite: (path) => {
      return `/api${path}`;
    },

    on: {
      proxyReq: (proxyReq, req) => {
        proxyReq.removeHeader("if-none-match");
        proxyReq.removeHeader("if-modified-since");

        console.log(`Proxying: ${req.method} ${req.originalUrl}`);
      },

      proxyRes: (proxyRes, req) => {
        console.log(`Backend response: ${proxyRes.statusCode}`);

        if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
          circuitBreaker.recordSuccess();
        }

        if (req.cacheKey && proxyRes.statusCode === 200) {
          let body = "";

          proxyRes.on("data", (chunk) => {
            body += chunk.toString();
          });

          proxyRes.on("end", async () => {
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
          });
        }
      },

      error: (err, req, res) => {

        circuitBreaker.recordFailure();
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
app.listen(PORT, () => {
  console.log(`Gateway running on http://localhost:${PORT}`);
  // console.log(`Backend: ${BACKEND_URL}`);
  console.log('Backends:', BACKENDS);
});