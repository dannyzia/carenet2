# Channel Partner System Performance Testing

**Date:** 2026-04-21  
**Scope:** Commission calculation triggers, rate expiry cron, lead creation, and database queries

---

## Executive Summary

Performance testing focuses on ensuring the Channel Partner system can handle expected load without degradation. Key areas include commission calculation triggers (which execute on every invoice), rate expiry cron jobs, and lead creation operations.

**Overall Performance Status:** ⚠️ Needs Testing  
**Critical Performance Issues:** 0  
**High Priority Performance Issues:** 2  
**Medium Priority Performance Issues:** 3  
**Low Priority Performance Issues:** 2

---

## 1. Commission Calculation Trigger Performance

### 1.1 Trigger: `on_invoice_generated`

**Location:** `supabase/migrations/20260420120000_channel_partner_tables.sql`  
**Frequency:** Executes on every invoice creation (potentially high volume)

**Current Implementation:**
```sql
CREATE TRIGGER on_invoice_generated
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION credit_cp_commission();
```

**Performance Concerns:**
- ⚠️ Trigger executes synchronously on every INSERT
- ⚠️ Performs subquery to check lead attribution
- ⚠️ Performs subquery to check CP status
- ⚠️ Performs subquery to lookup active rate
- ⚠️ No batch processing for bulk invoice creation

### 1.2 Performance Testing Plan

**Test 1: Single Invoice Creation**
- **Metric:** Time to insert invoice and complete commission calculation
- **Target:** < 200ms
- **Method:** Measure INSERT execution time with EXPLAIN ANALYZE
- **Expected:** < 100ms with proper indexing

**Test 2: Bulk Invoice Creation (10 invoices)**
- **Metric:** Total time for 10 concurrent invoice inserts
- **Target:** < 2 seconds total (< 200ms per invoice)
- **Method:** Concurrent INSERTs with timing
- **Expected:** Linear scaling if no lock contention

**Test 3: Bulk Invoice Creation (100 invoices)**
- **Metric:** Total time for 100 concurrent invoice inserts
- **Target:** < 20 seconds total
- **Method:** Concurrent INSERTs with timing
- **Expected:** May degrade due to lock contention on commission table

**Test 4: Invoice Creation Without Attribution**
- **Metric:** Time to insert invoice when no lead attribution exists
- **Target:** < 100ms
- **Method:** Measure INSERT with unattributed lead
- **Expected:** Faster than attributed case (skip commission logic)

**Test 5: Invoice Creation With Suspended CP**
- **Metric:** Time to insert invoice when CP is suspended
- **Target:** < 150ms
- **Method:** Measure INSERT with suspended CP
- **Expected:** Similar to unattributed case (skip commission logic)

### 1.3 Optimization Recommendations

**High Priority:**
1. **Add database indexes for trigger queries**
   ```sql
   CREATE INDEX idx_channel_partner_leads_lead_user_id ON channel_partner_leads(lead_user_id) WHERE is_active = true;
   CREATE INDEX idx_channel_partners_status ON channel_partners(status) WHERE status = 'active';
   CREATE INDEX idx_channel_partner_commission_rates_lookup ON channel_partner_commission_rates(channel_partner_id, lead_role) WHERE effective_to IS NULL;
   ```
   - **Impact:** Reduces subquery execution time
   - **Effort:** Low (1 hour)

2. **Consider batch processing for bulk invoice creation**
   - **Impact:** Reduces lock contention during bulk operations
   - **Effort:** Medium (4-6 hours)
   - **Approach:** Create separate bulk commission calculation function

**Medium Priority:**
3. **Add query result caching for CP status checks**
   - **Impact:** Reduces repeated status lookups
   - **Effort:** Medium (3-4 hours)
   - **Approach:** Use PostgreSQL prepared statements or application cache

---

## 2. Rate Expiry Cron Performance

### 2.1 Edge Function: `marketplace-expire-cp-rates`

**Location:** `supabase/functions/marketplace-expire-cp-rates/index.ts`  
**Frequency:** Daily cron job

**Current Implementation:**
- Queries all rates expiring within notification window
- Queries all expired rates
- Updates status and sends notifications

**Performance Concerns:**
- ⚠️ Queries all rates (may be slow with large dataset)
- ⚠️ Sends individual notifications (may be slow with many expiring rates)
- ⚠️ No pagination for large result sets

### 2.2 Performance Testing Plan

**Test 1: Small Dataset (100 rates)**
- **Metric:** Total execution time
- **Target:** < 5 seconds
- **Method:** Run cron with 100 active rates
- **Expected:** Fast execution

**Test 2: Medium Dataset (1,000 rates)**
- **Metric:** Total execution time
- **Target:** < 30 seconds
- **Method:** Run cron with 1,000 active rates
- **Expected:** Acceptable execution time

**Test 3: Large Dataset (10,000 rates)**
- **Metric:** Total execution time
- **Target:** < 5 minutes
- **Method:** Run cron with 10,000 active rates
- **Expected:** May need pagination or batching

**Test 4: Notification Sending (50 expiring rates)**
- **Metric:** Time to send 50 notifications
- **Target:** < 30 seconds
- **Method:** Measure notification sending time
- **Expected:** Depends on SendGrid API performance

**Test 5: Notification Sending (500 expiring rates)**
- **Metric:** Time to send 500 notifications
- **Target:** < 5 minutes
- **Method:** Measure notification sending time
- **Expected:** May need batching

### 2.3 Optimization Recommendations

**High Priority:**
1. **Add pagination for rate queries**
   - **Impact:** Prevents memory issues with large datasets
   - **Effort:** Low (2-3 hours)
   - **Approach:** Use Supabase pagination (range queries)

2. **Batch notification sending**
   - **Impact:** Reduces API call overhead
   - **Effort:** Medium (3-4 hours)
   - **Approach:** Use SendGrid batch API or queue system

**Medium Priority:**
3. **Add database indexes for expiry queries**
   ```sql
   CREATE INDEX idx_channel_partner_commission_rates_expires_at ON channel_partner_commission_rates(expires_at) WHERE effective_to IS NULL;
   CREATE INDEX idx_channel_partner_commission_rates_expiry_notified ON channel_partner_commission_rates(expiry_notified) WHERE effective_to IS NULL;
   ```
   - **Impact:** Faster expiry detection queries
   - **Effort:** Low (1 hour)

---

## 3. Lead Creation Performance

### 3.1 Operation: `createLead`

**Location:** `src/backend/services/channelPartnerService.ts`  
**Frequency:** User-initiated (variable)

**Current Implementation:**
- Validates CP status
- Inserts lead record
- Sends notification to lead

**Performance Concerns:**
- ⚠️ Synchronous notification sending
- ⚠️ No rate limiting on lead creation

### 3.2 Performance Testing Plan

**Test 1: Single Lead Creation**
- **Metric:** Time to create lead
- **Target:** < 500ms
- **Method:** Measure lead creation endpoint
- **Expected:** Fast with proper indexing

**Test 2: Concurrent Lead Creation (10 CPs)**
- **Metric:** Total time for 10 concurrent lead creations
- **Target:** < 5 seconds
- **Method:** Concurrent requests to lead creation endpoint
- **Expected:** Linear scaling

**Test 3: Rapid Lead Creation by Single CP (10 leads)**
- **Metric:** Total time for 10 rapid lead creations
- **Target:** < 5 seconds
- **Method:** Sequential requests from single CP
- **Expected:** May need rate limiting

### 3.3 Optimization Recommendations

**Medium Priority:**
1. **Make notification sending asynchronous**
   - **Impact:** Faster lead creation response
   - **Effort:** Medium (3-4 hours)
   - **Approach:** Use queue system or background job

2. **Add rate limiting for lead creation**
   - **Impact:** Prevents abuse and ensures fair resource usage
   - **Effort:** Low (2-3 hours)
   - **Approach:** Use Supabase rate limiting or application-level limits

---

## 4. Database Query Performance

### 4.1 Key Queries

**Query 1: CP Dashboard Stats**
```sql
SELECT COUNT(*) as total_leads FROM channel_partner_leads WHERE channel_partner_id = $1 AND is_active = true;
SELECT SUM(amount) as total_commissions FROM channel_partner_commissions WHERE channel_partner_id = $1 AND status = 'credited';
```

**Query 2: CP Leads List**
```sql
SELECT * FROM channel_partner_leads WHERE channel_partner_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 50;
```

**Query 3: CP Commission History**
```sql
SELECT * FROM channel_partner_commissions WHERE channel_partner_id = $1 ORDER BY invoice_generated_at DESC LIMIT 50;
```

**Query 4: Admin CP List**
```sql
SELECT cp.*, p.name, p.email FROM channel_partners cp JOIN profiles p ON cp.user_id = p.id ORDER BY cp.created_at DESC;
```

### 4.2 Performance Testing Plan

**Test 1: CP Dashboard Stats**
- **Metric:** Query execution time
- **Target:** < 100ms
- **Method:** EXPLAIN ANALYZE with sample data
- **Expected:** Fast with proper indexes

**Test 2: CP Leads List (100 leads)**
- **Metric:** Query execution time
- **Target:** < 200ms
- **Method:** EXPLAIN ANALYZE with 100 leads
- **Expected:** Fast with proper indexes

**Test 3: CP Commission History (100 commissions)**
- **Metric:** Query execution time
- **Target:** < 200ms
- **Method:** EXPLAIN ANALYZE with 100 commissions
- **Expected:** Fast with proper indexes

**Test 4: Admin CP List (1,000 CPs)**
- **Metric:** Query execution time
- **Target:** < 500ms
- **Method:** EXPLAIN ANALYZE with 1,000 CPs
- **Expected:** May need pagination

### 4.3 Optimization Recommendations

**High Priority:**
1. **Add indexes for common queries**
   ```sql
   CREATE INDEX idx_channel_partner_leads_cp_active ON channel_partner_leads(channel_partner_id, is_active) WHERE is_active = true;
   CREATE INDEX idx_channel_partner_commissions_cp_status ON channel_partner_commissions(channel_partner_id, status) WHERE status = 'credited';
   CREATE INDEX idx_channel_partners_created_at ON channel_partners(created_at DESC);
   ```
   - **Impact:** Significantly improves query performance
   - **Effort:** Low (1 hour)

**Medium Priority:**
2. **Add query result caching for dashboard stats**
   - **Impact:** Reduces database load for frequently accessed data
   - **Effort:** Medium (3-4 hours)
   - **Approach:** Use Supabase cache or application-level cache

---

## 5. Edge Function Performance

### 5.1 Functions: `resend-cp-activation`, `create-cp-lead`

**Current Implementation:**
- `resend-cp-activation`: Validates lead, generates activation link, sends email
- `create-cp-lead`: Creates lead record, sends notification

**Performance Concerns:**
- ⚠️ Synchronous email sending
- ⚠️ No request timeout handling

### 5.2 Performance Testing Plan

**Test 1: Activation Link Resend**
- **Metric:** Total execution time
- **Target:** < 2 seconds
- **Method:** Measure function execution with timing
- **Expected:** Fast with proper database indexes

**Test 2: Lead Creation via Edge Function**
- **Metric:** Total execution time
- **Target:** < 1 second
- **Method:** Measure function execution with timing
- **Expected:** Fast with proper database indexes

**Test 3: Concurrent Edge Function Calls (10)**
- **Metric:** Average execution time
- **Target:** < 2 seconds per call
- **Method:** Concurrent function invocations
- **Expected:** Linear scaling

### 5.3 Optimization Recommendations

**Medium Priority:**
1. **Add timeout handling to Edge Functions**
   - **Impact:** Prevents hanging requests
   - **Effort:** Low (1-2 hours)
   - **Approach:** Add timeout to Supabase client and HTTP requests

2. **Make email sending asynchronous**
   - **Impact:** Faster function response
   - **Effort:** Medium (3-4 hours)
   - **Approach:** Use queue system or background job

---

## 6. Load Testing Scenarios

### 6.1 Scenario 1: Normal Daily Load

**Description:** Simulate typical daily usage  
**Duration:** 1 hour  
**Users:** 100 concurrent CPs  
**Actions:**
- 10 lead creations per minute (600 total)
- 100 invoice generations per hour
- 1 rate expiry cron execution

**Success Criteria:**
- Average response time < 500ms
- 95th percentile response time < 1 second
- No database deadlocks
- No memory leaks

### 6.2 Scenario 2: Peak Load

**Description:** Simulate peak usage (e.g., promotional campaign)  
**Duration:** 30 minutes  
**Users:** 500 concurrent CPs  
**Actions:**
- 50 lead creations per minute (1,500 total)
- 500 invoice generations per hour
- 1 rate expiry cron execution

**Success Criteria:**
- Average response time < 1 second
- 95th percentile response time < 2 seconds
- No database deadlocks
- No memory leaks
- Database CPU < 80%

### 6.3 Scenario 3: Stress Test

**Description:** Push system to breaking point  
**Duration:** 10 minutes  
**Users:** 1,000 concurrent CPs  
**Actions:**
- 100 lead creations per minute (1,000 total)
- 1,000 invoice generations
- 1 rate expiry cron execution

**Success Criteria:**
- System degrades gracefully
- No data corruption
- Automatic recovery after load ends

---

## 7. Monitoring and Alerting

### 7.1 Key Metrics to Monitor

**Database Metrics:**
- Query execution times (p50, p95, p99)
- Database connection pool usage
- Deadlock count
- Table sizes (commission, leads, rates)

**Application Metrics:**
- Commission trigger execution time
- Lead creation response time
- Edge Function execution time
- Error rates

**Business Metrics:**
- Commission calculation success rate
- Lead creation success rate
- Notification delivery success rate

### 7.2 Alerting Thresholds

**Critical Alerts:**
- Commission trigger execution time > 1 second
- Database deadlock rate > 0.1%
- Error rate > 5%
- Database connection pool usage > 90%

**Warning Alerts:**
- Commission trigger execution time > 500ms
- Lead creation response time > 1 second
- Database CPU > 70%
- Memory usage > 80%

---

## 8. Testing Tools

### 8.1 Database Performance Testing

**Tools:**
- `EXPLAIN ANALYZE` - Query execution plans
- `pg_stat_statements` - Query performance statistics
- `pgbench` - PostgreSQL benchmarking tool

**Setup:**
```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Analyze query performance
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
WHERE query LIKE '%channel_partner%' 
ORDER BY mean_time DESC;
```

### 8.2 Application Performance Testing

**Tools:**
- k6 - Load testing tool
- Apache Bench (ab) - Simple load testing
- Supabase Dashboard - Real-time metrics

**Example k6 Script:**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  let res = http.post('https://your-api.com/api/lead/create', {
    leadRole: 'guardian',
    name: 'Test Lead',
    phone: '01700000000',
    district: 'Dhaka',
    email: 'test@example.com',
  });
  
  check(res, {
    'status was 200': (r) => r.status == 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### 8.3 Edge Function Performance Testing

**Tools:**
- Supabase Dashboard - Edge Function metrics
- Custom timing in function code
- curl with timing

**Example:**
```bash
curl -w "@curl-format.txt" -o /dev/null -s \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -X POST \
  https://your-project.supabase.co/functions/v1/resend-cp-activation \
  -d '{"leadUserId": "user-123"}'
```

**curl-format.txt:**
```
time_namelookup:  %{time_namelookup}\n
time_connect:     %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_starttransfer: %{time_starttransfer}\n
time_total:       %{time_total}\n
```

---

## 9. Performance Testing Checklist

### Pre-Testing
- [ ] Create test dataset (100 CPs, 1,000 leads, 10,000 commissions)
- [ ] Configure monitoring tools
- [ ] Set up alerting thresholds
- [ ] Create performance baseline

### Testing
- [ ] Run single operation performance tests
- [ ] Run concurrent operation performance tests
- [ ] Run load testing scenarios
- [ ] Run stress test scenario
- [ ] Document results

### Post-Testing
- [ ] Analyze results against targets
- [ ] Identify bottlenecks
- [ ] Implement optimizations
- [ ] Re-test after optimizations
- [ ] Update documentation

---

## 10. Recommendations Summary

### Immediate Actions (Before Production)

1. **Add database indexes for trigger queries** (High Priority)
   - Impact: Reduces commission trigger execution time
   - Effort: Low (1 hour)

2. **Add database indexes for common queries** (High Priority)
   - Impact: Improves dashboard and admin panel performance
   - Effort: Low (1 hour)

3. **Add pagination for rate expiry cron** (High Priority)
   - Impact: Prevents memory issues with large datasets
   - Effort: Low (2-3 hours)

### Short-Term Actions (Within 1 Month)

4. **Make notification sending asynchronous** (Medium Priority)
   - Impact: Faster lead creation and activation link resend
   - Effort: Medium (3-4 hours)

5. **Add rate limiting for lead creation** (Medium Priority)
   - Impact: Prevents abuse and ensures fair resource usage
   - Effort: Low (2-3 hours)

6. **Add timeout handling to Edge Functions** (Medium Priority)
   - Impact: Prevents hanging requests
   - Effort: Low (1-2 hours)

### Long-Term Actions (Within 3 Months)

7. **Implement batch processing for bulk invoice creation** (Medium Priority)
   - Impact: Reduces lock contention during bulk operations
   - Effort: Medium (4-6 hours)

8. **Add query result caching for dashboard stats** (Medium Priority)
   - Impact: Reduces database load
   - Effort: Medium (3-4 hours)

9. **Set up comprehensive monitoring and alerting** (Low Priority)
   - Impact: Proactive performance issue detection
   - Effort: Medium (4-6 hours)

---

## Conclusion

The Channel Partner system's performance is **largely untested** but the architecture suggests it should perform well under normal load. The primary performance concerns are:

1. Commission trigger may be slow without proper indexes (high priority)
2. Rate expiry cron may struggle with large datasets (high priority)
3. Synchronous notification sending may slow down user operations (medium priority)

Implementing the immediate actions (adding indexes and pagination) would provide a solid performance foundation for production deployment. Comprehensive load testing should be conducted before launch to validate performance under expected load.

---

**Tested by:** Cascade AI  
**Next Review:** 2026-07-21 (quarterly)
