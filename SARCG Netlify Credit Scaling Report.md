# **SARCG \- Netlify Credit Estimation & Scaling Analysis**

This document provides a comprehensive analysis of expected Netlify infrastructure costs for the SARCG platform during peak registration and guide selection events. The predictions are based on empirical data gathered during a live production test and factor in the architectural constraints of the current serverless-http backend deployment.

## **1\. Executive Summary**

The SARCG platform relies on a decoupled React SPA (Frontend) and an Express.js API (Backend). Currently, the backend is wrapped in serverless-http and deployed as Netlify Functions. Because Netlify bills serverless compute by the millisecond (GB-hours), high-concurrency events—such as hundreds of students logging in simultaneously—create "cold start" penalties and database connection queuing. This significantly inflates compute execution time and, consequently, credit consumption.

Based on our production tests, the upcoming two-phase launch is estimated to consume between **1,310 and 3,740 Netlify credits**, heavily dependent on user concurrency and frontend caching efficiency.

## **2\. Production Test Baseline (Empirical Data)**

A live production test was conducted with 30-40 students to establish a baseline for the "Team Creation" workflow (Login, Password Reset, Team Building).

### **Raw Data (Before vs. After Test)**

* **Web Requests:** 4,539 → 9,258 *(Delta: 4,719 requests \= 1.0 credit)*  
* **Compute:** 16.0 → 27.3 *(Delta: 11.3 credits)*  
* **Bandwidth:** 0.7 → 1.7 *(Delta: 1.0 credit)*  
* **Production Deploys:** 11 → 12 *(Delta: 1 deploy \= 15.0 fixed credits)*

### **Baseline Metrics**

Subtracting the fixed 15-credit deployment cost, the true consumption for the 30-40 student cohort was **13.3 credits**.

* **Average Cost per Student:** 0.33 to 0.44 credits.  
* **Average Requests per Student:** 118 to 157 requests per session.

## **3\. Phase 1 Predictions: Team Creation (1,600 Students)**

**Workflow:** Students log in, reset passwords, and create teams. This matches the exact workflow of the baseline test.

### **Best-Case Scenario: \~530 Credits**

* **Condition:** Users trickle in over several hours. Low concurrency keeps serverless functions "warm" (average \~350ms execution time) and prevents database bottlenecks.  
* **Calculation:** 1,600 students × 0.333 credits (high-efficiency baseline).  
* **Estimated Breakdown:**  
  * Web Requests: \~38 credits (\~190k requests)  
  * Compute: \~450 credits  
  * Bandwidth: \~40 credits

### **Worst-Case Scenario: \~1,350 Credits**

* **Condition:** All 1,600 students attempt to log in simultaneously. Netlify forces hundreds of parallel serverless cold starts (3-5 seconds of billed boot time). The PostgreSQL database encounters connection queuing, forcing serverless functions to stay awake and billable while waiting for queries to resolve.  
* **Calculation:** 1,600 students × 0.443 credits (low-efficiency baseline) × **2.0x Concurrency Compute Penalty**.  
* **Estimated Breakdown:**  
  * Web Requests: \~50 credits (\~252k requests)  
  * Compute: \~1,250 credits  
  * Bandwidth: \~50 credits

## **4\. Phase 2 Predictions: Guide Selection (1,000 Live Users)**

**Workflow:** Students search, filter, view guide profiles, and apply.

**Architectural Context:** This phase utilizes a highly responsive, low-bug version of the frontend that generates **30-40 API/asset requests per page load**. A standard session (navigating 8-10 pages) will generate 300 to 400 requests per student (approx. 2.5x more volume than Phase 1).

### **Best-Case Scenario: \~750 Credits**

* **Condition:** React Query (@tanstack/react-query) is effectively caching data (staleTime \> 5 mins), preventing redundant database hits when users navigate back and forth.  
* **Calculation:** 1,000 users × 250 requests each \= 250,000 total requests. Normal compute times apply.  
* **Estimated Breakdown:**  
  * Web Requests: 50 credits  
  * Compute: \~630 credits  
  * Bandwidth: \~70 credits

### **Worst-Case Scenario: \~2,300 Credits**

* **Condition:** High concurrency combined with heavy, uncached filtering queries. 40 parallel API requests per page change cause massive read-contention on the PostgreSQL database, spiking average function execution time.  
* **Calculation:** 1,000 users × 400 requests each \= 400,000 total requests. Applied a **2.5x Latency Compute Multiplier** due to DB read-contention and cold starts.  
* **Estimated Breakdown:**  
  * Web Requests: 80 credits  
  * Compute: \~2,100 credits  
  * Bandwidth: \~120 credits

## **5\. Summary & Budget Matrix**

| Phase | Event Type | Target Users | Best-Case Est. | Worst-Case Est. |
| :---- | :---- | :---- | :---- | :---- |
| **Phase 1** | Team Creation (Linear Flow) | 1,600 | 530 credits | 1,350 credits |
| **Phase 2** | Guide Selection (Heavy DB Search) | 1,000 | 750 credits | 2,300 credits |
| **Fixed Overhead** | Production Deploys (Buffer) | N/A | 30 credits (2 deploys) | 90 credits (6 deploys) |
| **TOTAL** | **Full Launch Event** | **2,600** | **\~1,310 credits** | **\~3,740 credits** |

## **6\. Recommended Mitigations for Cost Reduction**

If the projected upper bound (\~3,700 credits) exceeds the available Netlify budget, the following architectural adjustments must be prioritized:

1. **Frontend Caching (Immediate):** Increase staleTime in @tanstack/react-query to at least 5 minutes for non-critical lists (e.g., Guide directory) to drastically lower request volume in Phase 2\.  
2. **Database Connection Pooling (Backend):** Implement Prisma Accelerate or PgBouncer to prevent serverless functions from tearing down and rebuilding TLS connections to PostgreSQL on every request.  
3. **Migration off Serverless (Long-term):** As noted in ARCHITECTURE.md, deploy the Express backend to a fixed-cost VPS (e.g., AWS EC2, DigitalOcean Droplet) using PM2. This eliminates Netlify compute billing entirely, neutralizing the cost of high concurrency.