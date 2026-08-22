import "dotenv/config";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const PORT = process.env.PORT || 5000;

const GATEWAYS = [
  process.env.GATEWAY_1,
  process.env.GATEWAY_2,
  process.env.GATEWAY_3,
];

let currentGateway = 0;

const getNextGateway = () => {
  const gateway = GATEWAYS[currentGateway];

  currentGateway =
    (currentGateway + 1) % GATEWAYS.length;

  console.log("Selected Gateway:", gateway);

  return gateway;
};

app.use(
  "/api",
  createProxyMiddleware({
    target: GATEWAYS[0],

    router: () => {
      return getNextGateway();
    },

    changeOrigin: true,

    pathRewrite: (path) => {
      return `/api${path}`;
    },
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({
    loadBalancer: "OK",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Load Balancer running on http://localhost:${PORT}`);
  console.log("Gateways:", GATEWAYS);
});