# SmartEvent — Advanced SQL Architecture & Showcase Engine

SmartEvent is engineered around a relational database architecture running on **MySQL 8.0+ (InnoDB storage engine)**. All transactional consistency, seat concurrency locks, and business analytics are enforced at the database layer.

---

## Supported Database Engine
- **Target DBMS:** MySQL 8.0 / 8.4 LTS
- **Storage Engine:** InnoDB (ACID compliant, Row-Level Locking, MVCC)
- **Character Set:** `utf8mb4` with `utf8mb4_unicode_ci` collation
- **Driver:** `mysql-connector-python>=8.0.33`

---

## 1. Concurrency Control & Row-Level Locking (`FOR UPDATE`)

### Purpose:
Prevent double booking when two or more users attempt to hold or purchase the exact same seat simultaneously.

### Application Screen:
`/events/:id/seats` (3D / 2D Seat Selection & Hold Workflow)

### SQL Query:
```sql
-- Step 1: Lock the requested seat rows inside a transaction
START TRANSACTION;

SELECT 
    es.event_seat_id, 
    es.status, 
    es.price, 
    es.locked_until
FROM event_seats es
WHERE es.event_seat_id IN (101, 102) 
  AND es.event_id = 1
FOR UPDATE;

-- Step 2: Atomic State Transition (Temporary Hold)
UPDATE event_seats
SET 
    status = 'HELD',
    locked_until = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 420 SECOND)
WHERE event_seat_id IN (101, 102);

COMMIT;
```

**Why it works:**
InnoDB places exclusive index record locks on the selected rows. Any competing transaction attempting to select the same rows with `FOR UPDATE` is blocked until the first transaction commits or rolls back, guaranteeing zero double bookings.

---

## 2. Advanced CTE & Window Functions: Revenue Ranking & Percentiles

### Purpose:
Rank event categories by financial performance and compute relative performance percentiles dynamically.

### Application Screen:
`/admin` (Admin Analytics Dashboard)

### SQL Query:
```sql
WITH CategoryRevenue AS (
    SELECT 
        c.category_id,
        c.name AS category_name,
        COALESCE(SUM(b.net_amount), 0) AS total_revenue,
        COUNT(DISTINCT b.booking_id) AS total_bookings,
        DENSE_RANK() OVER (ORDER BY COALESCE(SUM(b.net_amount), 0) DESC) AS revenue_rank,
        ROUND(PERCENT_RANK() OVER (ORDER BY COALESCE(SUM(b.net_amount), 0)) * 100, 1) AS revenue_percentile
    FROM event_categories c
    LEFT JOIN events e ON c.category_id = e.category_id
    LEFT JOIN bookings b ON e.event_id = b.event_id AND b.status = 'CONFIRMED'
    GROUP BY c.category_id, c.name
)
SELECT 
    category_id,
    category_name,
    total_revenue,
    total_bookings,
    revenue_rank,
    revenue_percentile
FROM CategoryRevenue
ORDER BY revenue_rank ASC;
```

**Key SQL Concepts:**
- Common Table Expression (`WITH CategoryRevenue AS ...`)
- Window Function `DENSE_RANK() OVER (...)`
- Analytic Function `PERCENT_RANK() OVER (...)`

---

## 3. Rolling Cumulative Analytics: Window Aggregates

### Purpose:
Compute day-over-day booking velocity, cumulative gross revenue, and a 3-day rolling moving average without application-level loops.

### Application Screen:
`/admin` (Booking Velocity Chart)

### SQL Query:
```sql
WITH DailySales AS (
    SELECT 
        DATE(b.created_at) AS sale_date,
        COUNT(b.booking_id) AS daily_bookings,
        SUM(b.net_amount) AS daily_revenue
    FROM bookings b
    WHERE b.status = 'CONFIRMED'
    GROUP BY DATE(b.created_at)
)
SELECT 
    sale_date,
    daily_bookings,
    daily_revenue,
    SUM(daily_revenue) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_revenue,
    ROUND(AVG(daily_revenue) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ), 2) AS rolling_3day_avg
FROM DailySales
ORDER BY sale_date DESC
LIMIT 14;
```

**Key SQL Concepts:**
- Frame Specification (`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`)
- Moving Average (`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`)

---

## 4. Multi-Table Relational Join: Full Event Performance Aggregation

### Purpose:
Aggregate live seating capacity, sold counts, revenue, and venue gates in a single indexed query.

### Application Screen:
`/events` (Event Catalog & Filter Grid) and `/admin`

### SQL Query:
```sql
SELECT 
    e.event_id, 
    e.title, 
    e.description, 
    e.start_time, 
    e.end_time, 
    e.banner_url, 
    e.status,
    c.name AS category_name, 
    c.icon AS category_icon,
    v.name AS venue_name, 
    v.city AS venue_city, 
    v.address AS venue_address,
    COALESCE(MIN(t.base_price), 499.00) AS min_price, 
    COALESCE(MAX(t.base_price), 2499.00) AS max_price,
    COUNT(DISTINCT es.event_seat_id) AS total_seats_configured,
    COUNT(DISTINCT CASE WHEN es.status = 'BOOKED' THEN es.event_seat_id END) AS seats_sold
FROM events e
JOIN event_categories c ON e.category_id = c.category_id
JOIN venues v ON e.venue_id = v.venue_id
LEFT JOIN event_ticket_types t ON e.event_id = t.event_id
LEFT JOIN event_seats es ON e.event_id = es.event_id
WHERE e.status = 'published'
GROUP BY 
    e.event_id, e.title, e.description, e.start_time, e.end_time, 
    e.banner_url, e.status, c.name, c.icon, v.name, v.city, v.address
ORDER BY e.start_time ASC;
```

---

## 5. Query Plan Analysis (EXPLAIN)

### Indexing Strategy:
- `events(status, start_time)`: Optimizes catalog filtering and chronological ordering.
- `event_seats(event_id, status)`: Accelerates real-time seat availability maps.
- `bookings(user_id, status, created_at)`: Eliminates full table scans in "My Bookings".
- `tickets(ticket_code)`: Unique index ensuring `O(1)` ticket verification at entry gates.

### EXPLAIN Output Snapshot:
```sql
EXPLAIN SELECT * FROM tickets WHERE ticket_code = 'TCK-AI-VIP-01';
```
| id | select_type | table | type | possible_keys | key | key_len | ref | rows | Extra |
|---|---|---|---|---|---|---|---|---|---|
| 1 | SIMPLE | tickets | const | ticket_code_idx | ticket_code_idx | 192 | const | 1 | NULL |

