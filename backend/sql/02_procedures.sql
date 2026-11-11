-- ============================================================================
-- SmartEvent Procedures, Functions, Triggers & Views (Advanced SQL Engine)
-- ============================================================================

-- 1. FUNCTION: Calculate Refund Amount based on cancellation lead time
CREATE OR REPLACE FUNCTION fn_calculate_refund_amount(p_booking_id INT)
RETURNS TABLE (
    calculated_refund NUMERIC(10,2),
    penalty_fee NUMERIC(10,2),
    hours_left NUMERIC(10,2)
) AS $$
DECLARE
    v_net_amount NUMERIC(10,2);
    v_start_time TIMESTAMP;
    v_hours NUMERIC(10,2);
    v_refund NUMERIC(10,2);
    v_penalty NUMERIC(10,2);
BEGIN
    SELECT b.net_amount, e.start_time
    INTO v_net_amount, v_start_time
    FROM bookings b
    JOIN events e ON b.event_id = e.event_id
    WHERE b.booking_id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking ID % not found', p_booking_id;
    END IF;

    v_hours := EXTRACT(EPOCH FROM (v_start_time - CURRENT_TIMESTAMP)) / 3600.0;

    IF v_hours >= 48 THEN
        v_penalty := 0.00;
        v_refund := v_net_amount;
    ELSIF v_hours >= 24 THEN
        v_penalty := v_net_amount * 0.50;
        v_refund := v_net_amount * 0.50;
    ELSE
        v_penalty := v_net_amount;
        v_refund := 0.00;
    END IF;

    RETURN QUERY SELECT v_refund, v_penalty, v_hours;
END;
$$ LANGUAGE plpgsql;

-- 2. FUNCTION: Event Compatibility Score (Rules-based Scoring 0-100)
CREATE OR REPLACE FUNCTION fn_event_compatibility_score(p_user_id INT, p_event_id INT)
RETURNS INT AS $$
DECLARE
    v_score INT := 50; -- Base score
    v_pref_cats VARCHAR(255);
    v_max_budget NUMERIC(10,2);
    v_pref_loc VARCHAR(100);
    v_event_cat VARCHAR(80);
    v_event_price NUMERIC(10,2);
    v_venue_city VARCHAR(80);
BEGIN
    SELECT preferred_categories, max_budget, preferred_location
    INTO v_pref_cats, v_max_budget, v_pref_loc
    FROM user_preferences
    WHERE user_id = p_user_id;

    SELECT c.name, MIN(t.base_price), v.city
    INTO v_event_cat, v_event_price, v_venue_city
    FROM events e
    JOIN event_categories c ON e.category_id = c.category_id
    JOIN venues v ON e.venue_id = v.venue_id
    JOIN event_ticket_types t ON e.event_id = t.event_id
    WHERE e.event_id = p_event_id
    GROUP BY c.name, v.city;

    -- Category match (+25 points)
    IF v_pref_cats IS NOT NULL AND POSITION(v_event_cat IN v_pref_cats) > 0 THEN
        v_score := v_score + 25;
    END IF;

    -- Budget fit (+15 points)
    IF v_event_price IS NOT NULL AND v_max_budget IS NOT NULL AND v_event_price <= v_max_budget THEN
        v_score := v_score + 15;
    END IF;

    -- Location proximity (+10 points)
    IF v_pref_loc IS NOT NULL AND POSITION(v_venue_city IN v_pref_loc) > 0 THEN
        v_score := v_score + 10;
    END IF;

    IF v_score > 100 THEN v_score := 100; END IF;
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- 3. FUNCTION: Smart Group Seat Recommendation
CREATE OR REPLACE FUNCTION fn_smart_group_seat_recommendation(p_event_id INT, p_group_size INT, p_pref_section VARCHAR DEFAULT 'Executive')
RETURNS TABLE (
    event_seat_id INT,
    seat_id INT,
    section VARCHAR(50),
    row_label VARCHAR(5),
    seat_number INT,
    price NUMERIC(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT es.event_seat_id, s.seat_id, s.section, s.row_label, s.seat_number, es.price
    FROM event_seats es
    JOIN seats s ON es.seat_id = s.seat_id
    WHERE es.event_id = p_event_id
      AND es.status = 'AVAILABLE'
      AND (p_pref_section IS NULL OR s.section = p_pref_section)
    ORDER BY s.row_label ASC, s.seat_number ASC
    LIMIT p_group_size;
END;
$$ LANGUAGE plpgsql;

-- 4. STORED PROCEDURE: Cancel Booking Workflow
CREATE OR REPLACE PROCEDURE sp_cancel_booking(p_booking_id INT)
AS $$
DECLARE
    v_status VARCHAR(20);
    v_refund NUMERIC(10,2);
    v_penalty NUMERIC(10,2);
    v_hours NUMERIC(10,2);
BEGIN
    SELECT status INTO v_status FROM bookings WHERE booking_id = p_booking_id FOR UPDATE;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Booking ID % does not exist', p_booking_id;
    END IF;

    IF v_status = 'CANCELLED' OR v_status = 'REFUNDED' THEN
        RAISE EXCEPTION 'Booking ID % is already cancelled/refunded', p_booking_id;
    END IF;

    -- Get refund calculation
    SELECT calculated_refund, penalty_fee, hours_left
    INTO v_refund, v_penalty, v_hours
    FROM fn_calculate_refund_amount(p_booking_id);

    -- 1. Release reserved seats back to AVAILABLE
    UPDATE event_seats
    SET status = 'AVAILABLE'
    WHERE event_seat_id IN (
        SELECT event_seat_id FROM booking_items WHERE booking_id = p_booking_id
    );

    -- 2. Update tickets status to CANCELLED
    UPDATE tickets
    SET status = 'CANCELLED'
    WHERE booking_id = p_booking_id;

    -- 3. Insert into refunds log
    INSERT INTO refunds (booking_id, requested_amount, refund_amount, penalty_fee, refund_status)
    SELECT net_amount, v_refund, v_penalty, 'COMPLETED'
    FROM bookings WHERE booking_id = p_booking_id;

    -- 4. Update payments table
    UPDATE payments
    SET status = 'REFUNDED'
    WHERE booking_id = p_booking_id;

    -- 5. Mark booking status as CANCELLED
    UPDATE bookings
    SET status = 'CANCELLED'
    WHERE booking_id = p_booking_id;

END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER: Auto-Update Ticket Type Quantities
CREATE OR REPLACE FUNCTION trg_update_ticket_availability_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.status = 'AVAILABLE' AND NEW.status = 'BOOKED') THEN
            UPDATE event_ticket_types
            SET available_quantity = GREATEST(0, available_quantity - 1)
            WHERE ticket_type_id = NEW.ticket_type_id;
        ELSIF (OLD.status = 'BOOKED' AND NEW.status = 'AVAILABLE') THEN
            UPDATE event_ticket_types
            SET available_quantity = available_quantity + 1
            WHERE ticket_type_id = NEW.ticket_type_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ticket_availability ON event_seats;
CREATE TRIGGER trg_update_ticket_availability
AFTER UPDATE ON event_seats
FOR EACH ROW
EXECUTE FUNCTION trg_update_ticket_availability_fn();

-- 6. TRIGGER: Auto-Award User Reward Points on Confirmed Booking
CREATE OR REPLACE FUNCTION trg_award_booking_points_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_earned_points INT;
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'CONFIRMED') OR (TG_OP = 'UPDATE' AND OLD.status != 'CONFIRMED' AND NEW.status = 'CONFIRMED') THEN
        v_earned_points := FLOOR(NEW.net_amount / 2); -- 1 point per $2 spent
        
        UPDATE users
        SET reward_points = reward_points + v_earned_points,
            loyalty_level = CASE 
                WHEN reward_points + v_earned_points >= 1500 THEN 'Master'
                WHEN reward_points + v_earned_points >= 1000 THEN 'Platinum'
                WHEN reward_points + v_earned_points >= 500 THEN 'Gold'
                WHEN reward_points + v_earned_points >= 250 THEN 'Silver'
                ELSE 'Bronze'
            END
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_award_booking_points ON bookings;
CREATE TRIGGER trg_award_booking_points
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trg_award_booking_points_fn();

-- 7. VIEW: Organizer Event Analytics View
CREATE OR REPLACE VIEW v_organizer_event_analytics AS
SELECT 
    e.event_id,
    e.organizer_id,
    e.title AS event_title,
    c.name AS category_name,
    v.name AS venue_name,
    e.start_time,
    COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.net_amount ELSE 0 END), 0.00) AS total_revenue,
    COUNT(DISTINCT CASE WHEN b.status = 'CONFIRMED' THEN b.booking_id END) AS total_bookings,
    COUNT(DISTINCT CASE WHEN es.status = 'BOOKED' THEN es.event_seat_id END) AS seats_sold,
    COUNT(DISTINCT es.event_seat_id) AS total_seats,
    ROUND((COUNT(DISTINCT CASE WHEN es.status = 'BOOKED' THEN es.event_seat_id END)::NUMERIC / NULLIF(COUNT(DISTINCT es.event_seat_id), 0)) * 100, 2) AS occupancy_percentage,
    COUNT(DISTINCT a.attendance_id) AS total_attended,
    ROUND((COUNT(DISTINCT a.attendance_id)::NUMERIC / NULLIF(COUNT(DISTINCT CASE WHEN es.status = 'BOOKED' THEN es.event_seat_id END), 0)) * 100, 2) AS attendance_percentage,
    COUNT(DISTINCT CASE WHEN b.status = 'CANCELLED' THEN b.booking_id END) AS total_cancellations
FROM events e
JOIN event_categories c ON e.category_id = c.category_id
JOIN venues v ON e.venue_id = v.venue_id
LEFT JOIN event_seats es ON e.event_id = es.event_id
LEFT JOIN bookings b ON e.event_id = b.event_id
LEFT JOIN tickets t ON b.booking_id = t.booking_id AND t.event_seat_id = es.event_seat_id
LEFT JOIN attendance a ON t.ticket_id = a.ticket_id
GROUP BY e.event_id, e.organizer_id, e.title, c.name, v.name, e.start_time;

-- 8. VIEW: Crowd Management Insights View
CREATE OR REPLACE VIEW v_crowd_management_insights AS
SELECT 
    e.event_id,
    e.title AS event_title,
    v.name AS venue_name,
    e.start_time,
    v.total_capacity,
    COUNT(CASE WHEN es.status = 'BOOKED' THEN 1 END) AS current_bookings,
    ROUND((COUNT(CASE WHEN es.status = 'BOOKED' THEN 1 END)::NUMERIC / NULLIF(v.total_capacity, 0)) * 100, 2) AS occupancy_rate,
    CASE 
        WHEN (COUNT(CASE WHEN es.status = 'BOOKED' THEN 1 END)::NUMERIC / NULLIF(v.total_capacity, 0)) >= 0.85 THEN 'Peak'
        WHEN (COUNT(CASE WHEN es.status = 'BOOKED' THEN 1 END)::NUMERIC / NULLIF(v.total_capacity, 0)) >= 0.60 THEN 'High'
        WHEN (COUNT(CASE WHEN es.status = 'BOOKED' THEN 1 END)::NUMERIC / NULLIF(v.total_capacity, 0)) >= 0.30 THEN 'Medium'
        ELSE 'Low'
    END AS expected_crowd_level,
    CASE 
        WHEN (COUNT(CASE WHEN es.status = 'BOOKED' THEN 1 END)::NUMERIC / NULLIF(v.total_capacity, 0)) >= 0.85 THEN TO_CHAR(e.start_time - INTERVAL '60 minutes', 'HH12:MI AM')
        WHEN (COUNT(CASE WHEN es.status = 'BOOKED' THEN 1 END)::NUMERIC / NULLIF(v.total_capacity, 0)) >= 0.60 THEN TO_CHAR(e.start_time - INTERVAL '45 minutes', 'HH12:MI AM')
        ELSE TO_CHAR(e.start_time - INTERVAL '30 minutes', 'HH12:MI AM')
    END AS recommended_arrival_time,
    'Gate B (North Entrance)' AS recommended_gate
FROM events e
JOIN venues v ON e.venue_id = v.venue_id
LEFT JOIN event_seats es ON e.event_id = es.event_id
GROUP BY e.event_id, e.title, v.name, e.start_time, v.total_capacity;

-- 9. VIEW: Category Revenue Rankings (Using Window Functions RANK, DENSE_RANK)
CREATE OR REPLACE VIEW v_category_revenue_rankings AS
SELECT 
    c.name AS category_name,
    e.event_id,
    e.title AS event_title,
    COALESCE(SUM(b.net_amount), 0) AS total_revenue,
    RANK() OVER (PARTITION BY c.category_id ORDER BY COALESCE(SUM(b.net_amount), 0) DESC) AS rank_in_category,
    DENSE_RANK() OVER (ORDER BY COALESCE(SUM(b.net_amount), 0) DESC) AS overall_rank,
    SUM(COALESCE(SUM(b.net_amount), 0)) OVER (PARTITION BY c.category_id) AS total_category_revenue
FROM event_categories c
JOIN events e ON c.category_id = e.category_id
LEFT JOIN bookings b ON e.event_id = b.event_id AND b.status = 'CONFIRMED'
GROUP BY c.category_id, c.name, e.event_id, e.title;

-- 10. VIEW: Booking Velocity Trends (Using Window Functions LAG & LEAD)
CREATE OR REPLACE VIEW v_booking_velocity_trends AS
WITH daily_bookings AS (
    SELECT 
        DATE(created_at) AS booking_date,
        COUNT(booking_id) AS daily_tickets_sold,
        SUM(net_amount) AS daily_revenue
    FROM bookings
    WHERE status = 'CONFIRMED'
    GROUP BY DATE(created_at)
)
SELECT 
    booking_date,
    daily_tickets_sold,
    daily_revenue,
    LAG(daily_tickets_sold, 1, 0) OVER (ORDER BY booking_date) AS prev_day_tickets,
    daily_tickets_sold - LAG(daily_tickets_sold, 1, 0) OVER (ORDER BY booking_date) AS growth_diff,
    ROUND(
        (daily_tickets_sold - LAG(daily_tickets_sold, 1, 0) OVER (ORDER BY booking_date))::NUMERIC / 
        NULLIF(LAG(daily_tickets_sold, 1, 0) OVER (ORDER BY booking_date), 0) * 100, 2
    ) AS growth_percentage_change
FROM daily_bookings;
