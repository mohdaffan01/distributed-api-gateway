flowchart TD
    Client([Client])
    LB[Load Balancer]
    GW1[Gateway 1]
    GW2[Gateway 2]
    GW3[Gateway 3]

    Client --> LB
    LB --> GW1
    LB --> GW2
    LB --> GW3

    %% Gateway internal flow - representative for all 3 instances
    Receive[Receive Client Request]
    RateCheck{Rate Limit Exceeded?}
    Return429([Return 429 Too Many Requests])
    BPCheck{Queue Full / Backpressure?}
    Return503Q([Return 503 Service Unavailable])
    SelectBackend[Select Healthy Backend - Round Robin]
    HealthCheck{Backend Healthy?}
    SelectAnother[Select Another Healthy Backend]
    NoHealthy{No Healthy Backend Exists?}
    Return503N([Return 503 Service Unavailable])
    CBCheck{Circuit Breaker State?}
    CBOpenBlock[Do Not Send Request - Circuit OPEN]
    Return503CB([Return 503 Service Unavailable])
    CBHalfTest[Allow Test Request - HALF-OPEN]
    SendBackend[Send Request to Selected Backend]
    TimeoutCheck{Backend Responds in Time?}
    Return504([Record Failure - Return 504 Gateway Timeout])
    BackendProcess[Backend Processes Request]
    BackendResp[Backend Sends Response to Gateway]
    GWResp([Gateway Sends Response to Client])

    GW1 --> Receive
    Receive --> RateCheck
    RateCheck -->|Yes| Return429
    RateCheck -->|No| BPCheck
    BPCheck -->|Yes - queue full| Return503Q
    BPCheck -->|No| SelectBackend
    SelectBackend --> HealthCheck
    HealthCheck -->|Unhealthy| NoHealthy
    NoHealthy -->|Yes| Return503N
    NoHealthy -->|No| SelectAnother
    SelectAnother --> HealthCheck
    HealthCheck -->|Healthy| CBCheck
    CBCheck -->|OPEN| CBOpenBlock
    CBOpenBlock --> Return503CB
    CBCheck -->|CLOSED| SendBackend
    CBCheck -->|HALF-OPEN| CBHalfTest
    CBHalfTest --> SendBackend
    SendBackend --> TimeoutCheck
    TimeoutCheck -->|Timeout| Return504
    TimeoutCheck -->|Responded in time| BackendProcess
    BackendProcess --> BackendResp
    BackendResp --> GWResp

    Return429 --> Client
    Return503Q --> Client
    Return503N --> Client
    Return503CB --> Client
    Return504 --> Client
    GWResp --> Client

    %% Backend servers
    B1[Backend 1]
    B2[Backend 2]
    B3[Backend 3]
    SendBackend --> B1
    SendBackend --> B2
    SendBackend --> B3

    %% Redis shared state
    Redis[(Redis Shared State - Rate Limit, Cache, Health, Circuit Breaker)]
    GW1 <--> Redis
    GW2 <--> Redis
    GW3 <--> Redis

    %% Backend Failure subflow
    subgraph BackendFailureHandling [Backend Failure Handling]
        BReq[Backend Request]
        BFail{Did Backend Fail?}
        BSuccess([Return Successful Response])
        RecordFail[Record Failure - Update Circuit Breaker]
        ThreshCheck{Failure Threshold Reached?}
        CBOpenState[Circuit Breaker OPEN]
        TryAnother[Try Another Healthy Backend]

        BReq --> BFail
        BFail -->|No| BSuccess
        BFail -->|Yes| RecordFail
        RecordFail --> ThreshCheck
        ThreshCheck -->|Yes| CBOpenState
        ThreshCheck -->|No| TryAnother
    end

    %% Circuit Breaker Recovery subflow
    subgraph CircuitBreakerRecovery [Circuit Breaker Recovery]
        CBOpenR[OPEN]
        RecoveryTimeout[Recovery Timeout]
        CBHalfR[HALF-OPEN]
        TestReq{Test Request Successful?}
        CBClosedR([CLOSED])

        CBOpenR --> RecoveryTimeout
        RecoveryTimeout --> CBHalfR
        CBHalfR --> TestReq
        TestReq -->|Yes| CBClosedR
        TestReq -->|No| CBOpenR
    end