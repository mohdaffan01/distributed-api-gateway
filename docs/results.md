

# Distributed API Gateway - Benchmark Results

## Overview

These benchmarks evaluate the behavior of the Distributed API Gateway under
different Gateway and Backend instance configurations.

The goal is to understand how horizontal scaling affects:

- Request success rate
- Rate limiting behavior
- Throughput
- Latency
- System stability under concurrent load

## Test Environment

| Parameter | Value |
|---|---:|
| Virtual Users | 100 |
| Iterations | 5,000 |
| Total Requests per Test | 5,000 |
| Load Testing Tool | k6 |
| Gateway | Distributed API Gateway |
| Rate Limiting | Enabled |
| Backpressure | Enabled |

> **B** = Backend instances  
> **G** = Gateway instances

## Benchmark Results

| Metric | 4B + 3G | 2B + 3G | 1B + 3G | 3B + 2G | 3B + 1G | 1B + 1G |
| ---------------- | --------: | --------: | --------: | --------: | --------: | --------: |
| **VUs** | 100 | 100 | 100 | 100 | 100 | 100 |
| **Iterations** | 5,000 | 5,000 | 5,000 | 5,000 | 5,000 | 5,000 |
| **200 OK** | 4,921 | 3,606 | 1,450 | 4,917 | 2,958 | 5 |
| **429** | 20 | 36 | 33 | 30 | 7 | 18 |
| **Other Status** | 59 | 1,358 | 3,517 | 53 | 2,035 | 4,977 |
| **Failure Rate** | 1.58% | 27.88% | 71.00% | 1.66% | 40.83% | 99.90% |
| **Throughput** | 1,079.76 req/s | 1,097.55 req/s | 798.29 req/s | 1,195.25 req/s | 711.79 req/s | 529.59 req/s |
| **Avg Latency** | 91.50 ms | 89.98 ms | 98.34 ms | 82.59 ms | 138.68 ms | 97.54 ms |
| **p95 Latency** | 135.87 ms | 120.40 ms | 120.52 ms | 109.09 ms | 170.64 ms | 99.82 ms |
| **Max Latency** | 2.18 s | 2.30 s | 6.24 s | 2.05 s | 3.02 s | 9.42 s |

## Observations

### 1. Backend scaling

Increasing the number of backend instances significantly improves request
success under load.

The `4B + 3G` configuration achieved:

- 4,921 successful requests
- 1.58% failure rate
- 1,079.76 req/s throughput
- 135.87 ms p95 latency

In contrast, the `1B + 3G` configuration produced a 71.00% failure rate.

This indicates that backend capacity becomes a significant bottleneck when
the number of backend instances is reduced.

### 2. Gateway scaling

Comparing configurations with different numbers of Gateway instances shows
the effect of distributing incoming traffic across gateway replicas.

The `3B + 2G` configuration achieved the highest throughput in this test:

**1,195.25 req/s**

with a relatively low p95 latency of:

**109.09 ms**

### 3. Single-instance configuration

The `1B + 1G` configuration performed significantly worse than the
multi-instance configurations:

- 5 successful requests
- 99.90% failure rate
- 529.59 req/s throughput
- 9.42 s maximum latency

This demonstrates the importance of horizontal scaling for handling
concurrent traffic.

## Key Findings

| Finding | Result |
|---|---|
| Best throughput | 3B + 2G |
| Lowest failure rate | 4B + 3G |
| Lowest p95 latency | 3B + 2G |
| Worst configuration | 1B + 1G |
| Backend bottleneck | Clearly visible with 1 backend |
| Horizontal scaling benefit | Significant |

## Conclusion

The benchmark demonstrates that distributing traffic across multiple Gateway
and Backend instances improves the resilience and scalability of the API
Gateway.

The results also show that adding Gateway instances alone cannot compensate
for insufficient Backend capacity. Backend saturation becomes visible through
higher failure rates, increased latency, and reduced throughput.

The `3B + 2G` configuration provided the highest measured throughput, while
`4B + 3G` provided the lowest failure rate.

These results provide a baseline for further experiments involving higher
concurrency, larger request volumes, and different rate-limiting and
backpressure configurations.

## Next Experiments

- Increase VUs beyond 100
- Increase total iterations
- Test different rate-limit thresholds
- Test different queue sizes
- Test different maximum concurrent request limits
- Measure CPU and memory usage of Gateway and Backend containers
- Compare behavior with and without Redis
- Compare behavior with and without backpressure