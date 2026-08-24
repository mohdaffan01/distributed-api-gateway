# Distributed API Gateway

A distributed API Gateway built with **Node.js** and **Express**, designed to handle API traffic efficiently and reliably across multiple backend services.

The gateway sits between clients and backend servers, routing requests intelligently while protecting the system from overload and failure — the same core problems that real-world gateways like Kong, NGINX, and AWS API Gateway solve.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started (Local Setup)](#getting-started-local-setup)
- [Running with Docker](#running-with-docker)
- [Testing the API](#testing-the-api)
- [Project Structure](#project-structure)
- [Learning Goals](#learning-goals)

---

## Overview

The main goal of this project is to understand how an API Gateway improves **scalability, performance, fault tolerance, and resilience** — under normal traffic, high traffic, and partial service failures.

It's built as a multi-instance, distributed system (not a single gateway process), so it also explores how shared state, coordination, and failure detection work across multiple gateway nodes.

---

## Features

| Feature | Purpose |
|---|---|
| **Load Balancing** | Distributes incoming traffic across gateway/backend instances |
| **Health-Aware Routing** | Skips unhealthy instances based on live health checks |
| **Rate Limiting** | Protects backend services from being overwhelmed |
| **Redis Caching / Shared State** | Keeps state consistent across distributed gateway instances |
| **Circuit Breaker** | Stops sending traffic to a failing service until it recovers |
| **Backpressure Handling** | Prevents system overload during traffic spikes |
| **Request Timeouts** | Avoids hanging requests and cascading failures |
| **Multiple Backend Servers** | Simulates a realistic multi-service backend |
| **Distributed Gateway Instances** | Multiple gateway nodes working behind a load balancer |

---

## Architecture

```
Client
  │
  ▼
Load Balancer  (http://localhost:5000)
  │
  ▼
Gateway Instances  (multiple, health-aware)
  │
  ▼
Backend Servers  (multiple, load-balanced)
  │
  ▼
Redis  (shared state: rate limits, health, circuit breaker status)
```

- The **Load Balancer** is the single entry point for clients.
- It forwards requests to one of several **Gateway instances**, chosen based on health.
- Each **Gateway** applies rate limiting, circuit breaking, and backpressure logic before forwarding to a **Backend server**.
- **Redis** stores shared state (health status, rate-limit counters, circuit breaker state) so all gateway instances stay in sync.

---

## Tech Stack

- **Node.js** + **Express.js** — Gateway, Load Balancer, and Backend servers
- **Redis** — Shared state across distributed instances
- **Docker & Docker Compose** — Containerized multi-service setup
- **k6** — Load testing and traffic simulation
- **JavaScript** — Core language throughout

---

## Getting Started (Local Setup)

### 1. Clone the repository

```bash
git clone https://github.com/mohdaffan01/distributed-api-gateway.git
cd distributed-api-gateway
```

### 2. Install dependencies

Install dependencies for each component separately:

```bash
cd backend
npm install

cd ../gateway
npm install

cd ../load-balancer
npm install
```

### 3. Configure environment variables

Create `.env` files for the **Gateway** and **Load Balancer**, containing the backend and gateway URLs (ports, service addresses, etc.).

### 4. Start Redis

Make sure Redis is running locally on:

```
localhost:6379
```

### 5. Start the Backend Servers

Run each backend server on its configured port.

### 6. Start the Gateway Servers

Run each Gateway instance.

### 7. Start the Load Balancer

Run the Load Balancer on:

```
http://localhost:5000
```

### 8. Test the API

```bash
curl http://localhost:5000/api/users
```

---

## Running with Docker

### Prerequisites

Install:

- Docker Desktop
- Git

Verify installation:

```bash
docker --version
docker compose version
```

### 1. Clone the repository

```bash
git clone https://github.com/mohdaffan01/distributed-api-gateway.git
cd distributed-api-gateway
```

### 2. Build the images

```bash
docker build -t api-backend:latest ./backend
docker build -t api-gateway:latest ./gateway
docker build -t api-load-balancer:latest ./load-balancer
```

### 3. Start the complete system

```bash
docker compose up -d
```

This starts:

- 4 Backend Servers
- 3 Gateway Instances
- 1 Load Balancer
- 1 Redis Server

### 4. Check container status

```bash
docker compose ps
```

All containers should show `Up`.

### 5. Stop the system

```bash
docker compose down
```

---

## Testing the API

**Load Balancer base URL:**

```
http://localhost:5000
```

**Health check:**

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "loadBalancer": "OK"
}
```

**Sample API request:**

```bash
curl http://localhost:5000/api/users
```

Expected response:

```json
{
  "success": true,
  "count": 5,
  "users": [ ... ]
}
```

---

```bash
docker compose down
```

## Project Structure

```
distributed-api-gateway/
├── backend/           # Backend service(s)
├── gateway/            # Gateway instances (rate limiting, circuit breaker, backpressure)
├── load-balancer/      # Entry point, health-aware routing
├── docker-compose.yml  # Multi-service orchestration
└── README.md
```

---

## Learning Goals

This project was built to understand, hands-on, how production API gateways handle:

- Traffic distribution across multiple service instances
- Failure isolation using circuit breakers
- Overload protection using backpressure and rate limiting
- Coordination across distributed nodes using Redis as shared state
- Resilience testing under load using k6

---

## License

This project is open source and available for learning purposes.
