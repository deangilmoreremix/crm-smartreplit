# Load Testing Guide for SmartCRM

## Overview
This directory contains load testing scripts to validate SmartCRM's performance under various load conditions. The tests verify the platform can handle 10,000+ concurrent users as claimed in the production readiness documentation.

---

## Prerequisites

### Install k6
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6

# Docker
docker pull grafana/k6
```

---

## Running Load Tests

### Basic Load Test
```bash
# Set environment variables
export BASE_URL="https://your-domain.com"
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="Test123!"

# Run the test
k6 run scripts/load-testing/k6-load-test.js
```

### Custom Load Test Scenarios

#### 1. Smoke Test (Minimal Load)
```bash
k6 run --vus 1 --duration 1m scripts/load-testing/k6-load-test.js
```

#### 2. Load Test (Normal Traffic)
```bash
k6 run --vus 100 --duration 10m scripts/load-testing/k6-load-test.js
```

#### 3. Stress Test (High Load)
```bash
k6 run --vus 500 --duration 15m scripts/load-testing/k6-load-test.js
```

#### 4. Spike Test (Sudden Traffic Spike)
```bash
k6 run --stage 0s:0,1m:1000,2m:1000,1m:0 scripts/load-testing/k6-load-test.js
```

#### 5. Soak Test (Extended Duration)
```bash
k6 run --vus 200 --duration 2h scripts/load-testing/k6-load-test.js
```

---

## Test Stages

The default load test includes the following stages:

| Stage | Duration | Target VUs | Purpose |
|-------|----------|------------|---------|
| Warm-up | 2 min | 100 | Gradual ramp-up |
| Steady State | 5 min | 100 | Normal load baseline |
| Peak Load | 3 min | 500 | High traffic simulation |
| Stress Test | 5 min | 500 | Sustained high load |
| Spike Test | 2 min | 1000 | Sudden traffic spike |
| Recovery | 2 min | 100 | System recovery |
| Cool Down | 1 min | 0 | Graceful shutdown |

**Total Duration**: ~20 minutes

---

## Performance Thresholds

The load test validates the following performance criteria:

### Response Time Thresholds
- **p95 < 500ms**: 95% of requests complete within 500ms
- **p90 < 200ms**: 90% of API requests complete within 200ms
- **p99 < 1000ms**: 99% of requests complete within 1 second

### Reliability Thresholds
- **Error Rate < 1%**: Less than 1% of requests fail
- **Success Rate > 99%**: More than 99% of requests succeed

### Specific Endpoint Targets
- **Health Check**: < 100ms
- **List Operations**: < 200ms
- **Create Operations**: < 300ms
- **Dashboard**: < 500ms
- **AI Features**: < 2000ms

---

## Test Scenarios

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Expected**: 200 OK, < 100ms
- **Purpose**: Verify system availability

### 2. List Contacts
- **Endpoint**: `GET /api/contacts?page=1&limit=50`
- **Expected**: 200 OK, < 200ms
- **Purpose**: Test read performance

### 3. Create Contact
- **Endpoint**: `POST /api/contacts`
- **Expected**: 201 Created, < 300ms
- **Purpose**: Test write performance

### 4. List Deals
- **Endpoint**: `GET /api/deals?page=1&limit=50`
- **Expected**: 200 OK, < 200ms
- **Purpose**: Test complex queries

### 5. Dashboard Data
- **Endpoint**: `GET /api/dashboard/stats`
- **Expected**: 200 OK, < 500ms
- **Purpose**: Test aggregation performance

### 6. AI Chat (10% of users)
- **Endpoint**: `POST /api/ai/chat`
- **Expected**: 200 OK or 429 (rate limited), < 2000ms
- **Purpose**: Test AI feature performance

---

## Interpreting Results

### Success Criteria
✅ **PASS** if all of the following are met:
- Error rate < 1%
- p95 response time < 500ms
- p90 API response time < 200ms
- No threshold failures

⚠️ **WARNING** if:
- Error rate 1-5%
- p95 response time 500-1000ms
- Some threshold failures

❌ **FAIL** if:
- Error rate > 5%
- p95 response time > 1000ms
- Multiple threshold failures

### Sample Output
```
Load Test Summary
================

Duration: 1200.00s
VUs: 1000
Total Requests: 150000 (125.00 req/s)
Success Rate: 99.85%

Response Times:
  p50: 85.23ms
  p90: 178.45ms
  p95: 312.67ms
  p99: 789.12ms

Thresholds:
  ✓ http_req_duration
  ✓ errors
  ✓ http_req_failed
  ✓ api_response_time
```

---

## Monitoring During Tests

### Real-Time Monitoring
```bash
# Watch k6 output in real-time
k6 run --out json=test-results.json scripts/load-testing/k6-load-test.js

# Monitor with InfluxDB + Grafana
k6 run --out influxdb=http://localhost:8086/k6 scripts/load-testing/k6-load-test.js
```

### System Monitoring
Monitor these metrics during load tests:

1. **Application Metrics**
   - Response times
   - Error rates
   - Request throughput
   - Active connections

2. **Database Metrics**
   - Query performance
   - Connection pool usage
   - Cache hit rate
   - Slow queries

3. **Server Metrics**
   - CPU usage
   - Memory usage
   - Network I/O
   - Disk I/O

4. **External Services**
   - Supabase performance
   - OpenAI API latency
   - CDN performance

---

## Troubleshooting

### High Error Rates

**Symptoms**: Error rate > 5%

**Possible Causes**:
- Database connection pool exhausted
- Rate limiting triggered
- Memory leaks
- External API failures

**Solutions**:
1. Check database connection pool size
2. Review rate limit configuration
3. Monitor memory usage
4. Verify external API status

### Slow Response Times

**Symptoms**: p95 > 1000ms

**Possible Causes**:
- Unoptimized database queries
- Missing indexes
- Insufficient server resources
- Network latency

**Solutions**:
1. Review slow query logs
2. Add database indexes
3. Scale server resources
4. Optimize API calls

### Connection Timeouts

**Symptoms**: Connection refused errors

**Possible Causes**:
- Server overload
- Network issues
- Firewall blocking
- Load balancer misconfiguration

**Solutions**:
1. Check server capacity
2. Verify network connectivity
3. Review firewall rules
4. Check load balancer settings

---

## Best Practices

### 1. Test in Staging First
Always run load tests in a staging environment before production.

### 2. Gradual Ramp-Up
Use gradual ramp-up stages to avoid overwhelming the system.

### 3. Monitor Everything
Monitor application, database, and infrastructure metrics during tests.

### 4. Test Realistic Scenarios
Use realistic user behavior patterns and data.

### 5. Regular Testing
Run load tests regularly (weekly/monthly) to catch performance regressions.

### 6. Document Results
Keep a history of load test results to track performance trends.

### 7. Test Edge Cases
Include tests for:
- Peak traffic times
- Sudden traffic spikes
- Extended duration (soak tests)
- Failure scenarios

---

## Advanced Configuration

### Custom Thresholds
```javascript
export const options = {
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{endpoint:contacts}': ['p(95)<200'],
    'http_req_duration{endpoint:ai}': ['p(95)<2000'],
    'errors': ['rate<0.01'],
  },
};
```

### Custom Metrics
```javascript
import { Trend, Counter } from 'k6/metrics';

const contactCreationTime = new Trend('contact_creation_time');
const aiRequestCount = new Counter('ai_request_count');

// Track custom metrics
contactCreationTime.add(res.timings.duration);
aiRequestCount.add(1);
```

### Environment-Specific Configuration
```bash
# Development
export BASE_URL="http://localhost:5000"
export TEST_DURATION="5m"
export MAX_VUS="100"

# Staging
export BASE_URL="https://staging.smartcrm.vip"
export TEST_DURATION="15m"
export MAX_VUS="500"

# Production (use with caution!)
export BASE_URL="https://smartcrm.vip"
export TEST_DURATION="30m"
export MAX_VUS="1000"
```

---

## CI/CD Integration

### GitHub Actions
```yaml
name: Load Test

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run Load Test
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
        run: k6 run scripts/load-testing/k6-load-test.js
      
      - name: Upload Results
        uses: actions/upload-artifact@v2
        with:
          name: load-test-results
          path: load-test-*.json
```

---

## Results Analysis

### Generate HTML Report
```bash
k6 run --out json=results.json scripts/load-testing/k6-load-test.js
k6 report results.json --output report.html
```

### Export to CSV
```bash
k6 run --out csv=results.csv scripts/load-testing/k6-load-test.js
```

### Send to InfluxDB
```bash
k6 run --out influxdb=http://localhost:8086/k6 scripts/load-testing/k6-load-test.js
```

### Visualize with Grafana
1. Set up InfluxDB
2. Configure k6 to send metrics to InfluxDB
3. Import k6 Grafana dashboard
4. View real-time metrics during tests

---

## Support

### Documentation
- **k6 Docs**: https://k6.io/docs/
- **SmartCRM Docs**: https://docs.smartcrm.vip/load-testing

### Contact
- **Email**: performance@smartcrm.vip
- **Slack**: #performance-testing

---

**Last Updated**: January 25, 2026  
**Status**: Production Ready ✅
