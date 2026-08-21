
import redisClient from "../config/redis.js";

const CLOSED = "CLOSED";
const OPEN = "OPEN";
const HALF_OPEN = "HALF_OPEN";

class CricuitBreaker {
    // Set the initial Circuit Breaker settings
    constructor() {
        this.state = CLOSED;
        this.failureCount = 0;
        this.failureThreshold = 3; // when a user request 3 times on the fail backend then circuit is open 
        this.recoveryTimeout = 10000;

        console.log("Circuit State : ", this.state)
    }
    getStateKey(backend) {// Create the Redis key for the backend state
        return `circuit:${backend}:state`
    }
    getFailureKey(backend) {// Create the Redis key for the backend failures
        return `circuit:${backend}:failure`
    }

    async getState(backend) { // Get the backend's current state from Redis
        const key = this.getStateKey(backend);
        const state = await redisClient.get(key);

        if (!state) {
            await redisClient.set(key, CLOSED);
            return CLOSED;
        }
        return state;
    }

    async isOpen(backend) {// Check if the backend's circuit is open
        const state = await this.getState(backend);
        return state === OPEN;
    }

    async tryRecovery(backend) {// Change OPEN circuit to HALF_OPEN for recovery
        const state = await this.getState(backend);
        if (state === OPEN) {
            await redisClient.set(this.getStateKey(backend), HALF_OPEN);
            console.log(`Circuit ${backend}: OPEN → HALF_OPEN`);
            return HALF_OPEN;
        }
        return state;
    }


    async recordFailure(backend) {// Record a failure and open the circuit after 3 failures
        const state = await this.getState(backend);
        const failureKey = this.getFailureKey(backend);

        // HALF_OPEN request failed
        if (state === HALF_OPEN) {
            await redisClient.set(this.getStateKey(backend), OPEN);
            console.log(`Circuit ${backend}: HALF_OPEN --> OPEN`);
            return;
        }

        // Increase failure count in Redis
        const failureCount = await redisClient.incr(failureKey);

        console.log(`Backend ${backend} failure count: ${failureCount}`);

        // Open circuit after three failures
        if (state === CLOSED && failureCount >= this.failureThreshold) {
            await redisClient.set(
                this.getStateKey(backend),
                OPEN
            );

            console.log(`Circuit ${backend}: CLOSED → OPEN`);
        }
    }

    async recordSuccess(backend) {// Record success and close the circuit after recovery
    
        const state = await this.getState(backend);

        if (state === HALF_OPEN) {
            await redisClient.set(this.getStateKey(backend), CLOSED);
            await redisClient.set(this.getFailureKey(backend), 0);
            console.log(`Circuit ${backend}: HALF_OPEN --> CLOSED`);
            return;
        }
        // Successful request while CLOSED
        if (state === CLOSED) {
            await redisClient.set(this.getFailureKey(backend), 0);
        }
    }
}

export default CricuitBreaker;