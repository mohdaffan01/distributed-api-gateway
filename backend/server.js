import express from 'express';
import userController from './controller/user.controller.js';

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || "backend-default";


app.get('/', (req, res) => {
  res.send('Welcome to the API Gateway');
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 5000));
  res.status(200).json({
    message: 'if you want to check health of server the use /health ',
    status: 'healthy',
    service: 'api-server'
  });
});

//health check 
app.get("/health", (req, res) => {
  res.json({
    status: "healthy"
  });
});

// Server info endpoint
app.get("/api/server-info", async (req, res) => {

  console.log("Slow request started");
  await new Promise(resolve => setTimeout(resolve, 8000));
  console.log("Slow request finished");

  res.json({
    server: SERVER_ID,
    port: PORT
  });
});

// User routes
app.get('/api/users', userController.getAllUsers);
app.get('/api/users/:id', userController.getUserById);

app.listen(PORT,"0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});