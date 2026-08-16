import express from 'express';
import userController from './controller/user.controller.js';

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || "backend-default";


app.get('/', (req, res) => {
  res.send('Welcome to the API Gateway');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-server'
  });
});
// Server info endpoint
app.get("/api/server-info", (req, res) => {
  res.json({
    server: SERVER_ID,
    port: PORT
  });
});

// User routes
app.get('/api/users', userController.getAllUsers);
app.get('/api/users/:id', userController.getUserById);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});