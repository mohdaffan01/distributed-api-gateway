


const CLOSED = "CLOSED";
const OPEN = "OPEN";
const HALF_OPEN = "HALF_OPEN";

class CricuitBreaker {
    constructor() {
        this.state = CLOSED;
        this.failureCount = 0;
        this.failureThreshold = 3; // when a user request 3 times on the fail backend then circuit is open 
        this.recoveryTimeout = 10000;

        console.log("Circuit State : " , this.state)
    }
    isOpen() {
        return this.state === OPEN;
    }
    tryRecovery() {
        if (this.state === OPEN) {
            this.state = HALF_OPEN;
        }
    }
    
    recordFailure() {
        this.failureCount++;
        if (this.state === HALF_OPEN) {
            this.state = OPEN;
            return;
        }
        if (this.state === CLOSED && this.failureCount >= this.failureThreshold) {
            this.state = OPEN;
            console.log("Circuit State : OPEN");
        }
    }

    recordSuccess() {
        if (this.state === HALF_OPEN) {
            this.state = CLOSED;
            this.failureCount = 0;

            console.log("Circuit State : CLOSED")
        }
    }
}

export default CricuitBreaker;