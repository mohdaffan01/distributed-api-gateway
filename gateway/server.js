import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { rateLimiter } from './middleware/rateLimiter.js';
import { cache } from './middleware/cache.js';
import redisClient from './config/redis.js';

const app = express();

// const PORT = process.env.PORT || 4000;
// const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

const PORT = process.env.PORT || 4000;
const BACKENDS = [
  'http://localhost:3001', // index [0]
  'http://localhost:3002', // index [1]
  'http://localhost:3003'  // index [2]
];
let currentBackend = 0; // Index of the current backend to use

const getNextBackend = () => { //Round Robin function 
  const backend = BACKENDS[currentBackend];

  console.log("Selected backend:", backend);

  currentBackend = (currentBackend + 1) % BACKENDS.length;
  return backend;
}

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
    router : ()=> { // router use round robin for selecting  the backend
      return getNextBackend();
    },
    changeOrigin: true,

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

      error: (err) => {
        console.error('Proxy error:', err.message);
      }
    }
  })
);

app.listen(PORT, () => {
  console.log(`Gateway running on http://localhost:${PORT}`);
  // console.log(`Backend: ${BACKEND_URL}`);
  console.log('Backends:', BACKENDS);
});