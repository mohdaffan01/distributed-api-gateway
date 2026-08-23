# Distributed API Gateway

## Run with Docker

### Prerequisites

Install:

- Docker Desktop
- Git

Verify:

```bash
docker --version
docker compose version
```

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd distributed-api-gateway
```

### 2. Build the Images

```bash
docker build -t api-backend:latest ./backend
docker build -t api-gateway:latest ./gateway
docker build -t api-load-balancer:latest ./load-balancer
```

### 3. Start the Complete System

```bash
docker compose up -d
```

This starts:

- 4 Backend Servers
- 3 Gateway Instances
- 1 Load Balancer
- 1 Redis Server

### 4. Check Containers

```bash
docker compose ps
```

All containers should show `Up`.

### 5. Test the API

**Load Balancer:**

```
http://localhost:5000
```

**Health check:**

```bash
curl http://localhost:5000/health
```

Expected:

```json
{
  "loadBalancer": "OK"
}
```

**Test API:**

```bash
curl http://localhost:5000/api/users
```

Expected:

```json
{
  "success": true,
  "count": 5,
  "users": [...]
}
```

### Stop the System

```bash
docker compose down
```

