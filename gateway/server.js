import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

const PORT = process.env.PORT || 4000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Gateway health
app.get('/health', (req, res) => {
  res.status(200).json({
    gateway: 'OK'
  });
});

// API proxy
app.use(
  '/api',
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,

    pathRewrite: (path) => {
      return `/api${path}`;
    },

    on: {
      proxyReq: (proxyReq, req) => {
        console.log(`Proxying: ${req.method} ${req.originalUrl}`);
      },

      proxyRes: (proxyRes) => {
        console.log(`Backend response: ${proxyRes.statusCode}`);
      },

      error: (err) => {
        console.error('Proxy error:', err.message);
      }
    }
  })
);

app.listen(PORT, () => {
  console.log(`Gateway running on http://localhost:${PORT}`);
  console.log(`Backend: ${BACKEND_URL}`);
});