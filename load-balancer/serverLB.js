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
let healthyGateways = [...GATEWAYS];


// ---------------- Gateway Health Check ----------------

const checkGatewayHealth = async () => {
  const availableGateways = [];

  for (const gateway of GATEWAYS) {
    try {
      const response = await fetch(`${gateway}/health`);

      if (response.ok) {
        availableGateways.push(gateway);
        console.log(`Healthy Gateway: ${gateway}`);
      } else {
        console.log(`Unhealthy Gateway: ${gateway}`);
      }

    } catch (error) {
      console.log(`Unreachable Gateway: ${gateway}`);
    }
  }

  healthyGateways = availableGateways;

  // Reset index if current index is outside available gateways
  if (currentGateway >= healthyGateways.length) {
    currentGateway = 0;
  }
};


// Check Gateway health every 5 seconds
setInterval(checkGatewayHealth, 5000);

// Initial health check
checkGatewayHealth();


// ---------------- Gateway Selection ----------------

const getNextGateway = () => {

  if (healthyGateways.length === 0) {
    throw new Error("No healthy gateways available");
  }

  const gateway =
    healthyGateways[currentGateway];

  currentGateway =
    (currentGateway + 1) % healthyGateways.length;

  console.log("Selected Gateway:", gateway);

  return gateway;
};


// ---------------- API Proxy ----------------

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


// ---------------- Load Balancer Health ----------------

app.get("/health", (req, res) => {
  res.status(200).json({
    loadBalancer: "OK",
    healthyGateways: healthyGateways.length,
  });
});


// ---------------- Start Server ----------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Load Balancer running on http://localhost:${PORT}`
  );

  console.log("Gateways:", GATEWAYS);
});