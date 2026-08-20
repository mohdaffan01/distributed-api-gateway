


const MAX_CONCURRENT_REQUESTS = 2;
const MAX_QUEUE_SIZE = 3;

let activeRequests = 0;
const requestQueue = [];

const processNext = () => {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return;
  }

  if (requestQueue.length === 0) {
    return;
  }

  const { req, res, next } = requestQueue.shift();

  activeRequests++;

  console.log("Processing queued request");
  console.log("Active requests:", activeRequests);
  console.log("Queue size:", requestQueue.length);

  res.on("finish", () => {
    activeRequests--;

    console.log("Request Completed!");
    console.log("Active requests:", activeRequests);

    processNext();
  });

  next();
};

const backpressure = (req, res, next) => {

  // Process request if capacity is available
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;

    console.log("Request Accepted!");
    console.log("Active requests:", activeRequests);

    res.on("finish", () => {
      activeRequests--;

      console.log("Request Completed!");
      console.log("Active requests:", activeRequests);

      processNext();
    });

    next();
    return;
  }

  // Reject if queue is full
  if (requestQueue.length >= MAX_QUEUE_SIZE) {
    console.log("Queue Full! Request Rejected!");

    return res.status(503).json({
      error: "Service Unavailable",
      message: "Server is busy. Please try again later."
    });
  }

  // Add request to queue
  requestQueue.push({ req, res, next });

  console.log("Request Queued!");
  console.log("Queue size:", requestQueue.length);
};

export default backpressure;
