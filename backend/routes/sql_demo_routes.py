from flask import Blueprint, request, jsonify
from db import execute_query

sql_demo_bp = Blueprint('sql_demo', __name__)

DEMO_QUERIES = {
    "cte_monthly_revenue": {
        "title": "CTE — Monthly Booking & Revenue Breakdown",
        "concept": "Common Table Expressions (WITH clause)",
        "purpose": "Aggregates revenue and bookings per month for financial planning.",
        "sql": """
WITH monthly_summary AS (
    SELECT 
        TO_CHAR(created_at, 'YYYY-MM') AS month_year,
        COUNT(booking_id) AS total_bookings,
        SUM(net_amount) AS monthly_revenue,
        AVG(net_amount) AS avg_booking_value
    FROM bookings
    WHERE status = 'CONFIRMED'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
)
SELECT 
    month_year,
    total_bookings,
    ROUND(monthly_revenue, 2) AS monthly_revenue,
    ROUND(avg_booking_value, 2) AS avg_booking_value
FROM monthly_summary
ORDER BY month_year DESC;
        """
    },
    "window_ranking": {
        "title": "Window Functions — RANK() & DENSE_RANK()",
        "concept": "Window Functions with PARTITION BY and ORDER BY",
        "purpose": "Ranks events by total revenue both globally and within their specific category.",
        "sql": """
SELECT 
    c.name AS category_name,
    e.title AS event_title,
    COALESCE(SUM(b.net_amount), 0) AS total_revenue,
    RANK() OVER (PARTITION BY c.category_id ORDER BY COALESCE(SUM(b.net_amount), 0) DESC) AS category_rank,
    DENSE_RANK() OVER (ORDER BY COALESCE(SUM(b.net_amount), 0) DESC) AS global_rank
FROM event_categories c
JOIN events e ON c.category_id = e.category_id
LEFT JOIN bookings b ON e.event_id = b.event_id AND b.status = 'CONFIRMED'
GROUP BY c.category_id, c.name, e.event_id, e.title
ORDER BY global_rank ASC;
        """
    },
    "window_lag_lead": {
        "title": "Window Functions — LAG() & LEAD() Velocity Trends",
        "concept": "Sequential Row Access with LAG() and LEAD()",
        "purpose": "Compares daily ticket sales and revenue against previous day to calculate momentum.",
        "sql": """
WITH daily_sales AS (
    SELECT 
        DATE(created_at) AS sale_date,
        COUNT(booking_id) AS tickets_sold,
        SUM(net_amount) AS revenue
    FROM bookings
    WHERE status = 'CONFIRMED'
    GROUP BY DATE(created_at)
)
SELECT 
    sale_date,
    tickets_sold,
    LAG(tickets_sold, 1, 0) OVER (ORDER BY sale_date) AS prev_day_tickets,
    tickets_sold - LAG(tickets_sold, 1, 0) OVER (ORDER BY sale_date) AS growth_difference,
    revenue
FROM daily_sales
ORDER BY sale_date DESC;
        """
    },
    "correlated_subquery": {
        "title": "Correlated Subquery — High Spender Identification",
        "concept": "Correlated Subqueries in WHERE clause",
        "purpose": "Finds users whose net spending exceeds the overall average user spending.",
        "sql": """
SELECT 
    u.user_id,
    u.full_name,
    u.loyalty_level,
    (SELECT SUM(b.net_amount) FROM bookings b WHERE b.user_id = u.user_id AND b.status = 'CONFIRMED') AS total_spent
FROM users u
WHERE (
    SELECT COALESCE(SUM(b.net_amount), 0) 
    FROM bookings b 
    WHERE b.user_id = u.user_id AND b.status = 'CONFIRMED'
) > (
    SELECT AVG(user_total) 
    FROM (
        SELECT SUM(net_amount) AS user_total 
        FROM bookings 
        WHERE status = 'CONFIRMED' 
        GROUP BY user_id
    ) avg_tbl
)
ORDER BY total_spent DESC;
        """
    },
    "compatibility_function": {
        "title": "PL/pgSQL Function — Compatibility Score Calculation",
        "concept": "User-Defined Function (fn_event_compatibility_score)",
        "purpose": "Executes rule-based scoring logic inside PostgreSQL engine.",
        "sql": """
SELECT 
    e.event_id,
    e.title,
    c.name AS category,
    v.city,
    fn_event_compatibility_score(1, e.event_id) AS compatibility_score
FROM events e
JOIN event_categories c ON e.category_id = c.category_id
JOIN venues v ON e.venue_id = v.venue_id
WHERE e.status = 'published'
ORDER BY compatibility_score DESC;
        """
    },
    "explain_index": {
        "title": "Indexing & Query Optimization (EXPLAIN ANALYZE)",
        "concept": "Execution Plan Inspection & B-Tree Indexes",
        "purpose": "Demonstrates index lookup performance on category_id and start_time.",
        "sql": """
EXPLAIN ANALYZE
SELECT e.event_id, e.title, e.start_time
FROM events e
WHERE e.category_id = 1 AND e.start_time >= CURRENT_TIMESTAMP;
        """
    }
}

@sql_demo_bp.route('/queries', methods=['GET'])
def get_queries_list():
    return jsonify({"queries": DEMO_QUERIES}), 200

@sql_demo_bp.route('/execute', methods=['POST'])
def execute_demo_query():
    data = request.json or {}
    query_key = data.get('query_key')
    custom_sql = data.get('custom_sql')

    sql_to_run = None
    if query_key in DEMO_QUERIES:
        sql_to_run = DEMO_QUERIES[query_key]['sql']
    elif custom_sql:
        sql_to_run = custom_sql
    else:
        return jsonify({"error": "Valid query_key or custom_sql is required"}), 400

    try:
        results = execute_query(sql_to_run)
        columns = list(results[0].keys()) if results and len(results) > 0 else []
        return jsonify({
            "status": "success",
            "query": sql_to_run,
            "columns": columns,
            "row_count": len(results),
            "data": results
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "query": sql_to_run,
            "error": str(e)
        }), 400
