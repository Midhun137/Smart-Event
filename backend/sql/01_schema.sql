-- ============================================================================
-- SmartEvent Database Schema (PostgreSQL 17)
-- ============================================================================

DROP TABLE IF EXISTS user_rewards_badges CASCADE;
DROP TABLE IF EXISTS quizzes_challenges CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS booking_items CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS event_seats CASCADE;
DROP TABLE IF EXISTS event_ticket_types CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS event_categories CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS organizers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'organizer', 'admin')),
    reward_points INT DEFAULT 100 CHECK (reward_points >= 0),
    loyalty_level VARCHAR(20) DEFAULT 'Silver' CHECK (loyalty_level IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Master')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ORGANIZERS
CREATE TABLE organizers (
    organizer_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    organization_name VARCHAR(150) NOT NULL,
    contact_email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USER PREFERENCES
CREATE TABLE user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    preferred_categories VARCHAR(255) DEFAULT 'Tech,Music,Gaming,Workshop',
    max_budget NUMERIC(10,2) DEFAULT 250.00 CHECK (max_budget >= 0),
    preferred_location VARCHAR(100) DEFAULT 'San Francisco, CA',
    preferred_event_type VARCHAR(50) DEFAULT 'In-Person',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. EVENT CATEGORIES
CREATE TABLE event_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(80) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Calendar'
);

-- 5. VENUES
CREATE TABLE venues (
    venue_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(80) NOT NULL,
    total_capacity INT NOT NULL CHECK (total_capacity > 0),
    gate_info JSONB DEFAULT '{"Gate A": "East Wing", "Gate B": "North Hall", "Gate C": "VIP Lounge"}'::jsonb,
    map_url TEXT
);

-- 6. EVENTS
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    organizer_id INT REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    category_id INT REFERENCES event_categories(category_id),
    venue_id INT REFERENCES venues(venue_id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    banner_url TEXT,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_event_dates CHECK (end_time > start_time)
);

-- 7. SEATS
CREATE TABLE seats (
    seat_id SERIAL PRIMARY KEY,
    venue_id INT REFERENCES venues(venue_id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL CHECK (section IN ('VIP', 'Executive', 'Regular')),
    row_label VARCHAR(5) NOT NULL,
    seat_number INT NOT NULL,
    price_multiplier NUMERIC(3,2) DEFAULT 1.00 CHECK (price_multiplier > 0),
    CONSTRAINT unq_venue_seat UNIQUE(venue_id, section, row_label, seat_number)
);

-- 8. EVENT TICKET TYPES
CREATE TABLE event_ticket_types (
    ticket_type_id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL CHECK (name IN ('VIP Pass', 'Executive Pass', 'General Admission')),
    base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
    total_quantity INT NOT NULL CHECK (total_quantity >= 0),
    available_quantity INT NOT NULL CHECK (available_quantity >= 0)
);

-- 9. EVENT SEATS
CREATE TABLE event_seats (
    event_seat_id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
    seat_id INT REFERENCES seats(seat_id) ON DELETE CASCADE,
    ticket_type_id INT REFERENCES event_ticket_types(ticket_type_id),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'LOCKED', 'BOOKED')),
    locked_until TIMESTAMP,
    CONSTRAINT unq_event_seat UNIQUE(event_id, seat_id)
);

-- 10. BOOKINGS
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
    booking_code VARCHAR(30) UNIQUE NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    discount_amount NUMERIC(10,2) DEFAULT 0.00 CHECK (discount_amount >= 0),
    net_amount NUMERIC(10,2) NOT NULL CHECK (net_amount >= 0),
    status VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. BOOKING ITEMS
CREATE TABLE booking_items (
    item_id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(booking_id) ON DELETE CASCADE,
    event_seat_id INT REFERENCES event_seats(event_seat_id),
    ticket_type_id INT REFERENCES event_ticket_types(ticket_type_id),
    price NUMERIC(10,2) NOT NULL
);

-- 12. PAYMENTS
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    booking_id INT UNIQUE REFERENCES bookings(booking_id) ON DELETE CASCADE,
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Credit Card',
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'REFUNDED')),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. TICKETS
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(booking_id) ON DELETE CASCADE,
    event_seat_id INT UNIQUE REFERENCES event_seats(event_seat_id),
    ticket_code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'VALID' CHECK (status IN ('VALID', 'USED', 'CANCELLED')),
    validated_at TIMESTAMP
);

-- 14. REFUNDS
CREATE TABLE refunds (
    refund_id SERIAL PRIMARY KEY,
    booking_id INT UNIQUE REFERENCES bookings(booking_id) ON DELETE CASCADE,
    requested_amount NUMERIC(10,2) NOT NULL,
    refund_amount NUMERIC(10,2) NOT NULL,
    penalty_fee NUMERIC(10,2) DEFAULT 0.00,
    refund_status VARCHAR(20) DEFAULT 'COMPLETED',
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. ATTENDANCE
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    ticket_id INT UNIQUE REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    gate_used VARCHAR(50) NOT NULL,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by VARCHAR(50) DEFAULT 'Automated Scanner'
);

-- 16. REVIEWS
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. QUIZZES / CHALLENGES
CREATE TABLE quizzes_challenges (
    quiz_id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    question TEXT NOT NULL,
    options_json JSONB NOT NULL,
    correct_option INT NOT NULL,
    points_reward INT DEFAULT 50 CHECK (points_reward > 0)
);

-- 18. USER REWARDS & BADGES
CREATE TABLE user_rewards_badges (
    badge_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    badge_name VARCHAR(100) NOT NULL,
    badge_icon VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    coupon_code VARCHAR(30),
    discount_percent INT DEFAULT 10
);

-- INDEXES FOR OPTIMIZATION
CREATE INDEX idx_events_cat_date ON events(category_id, start_time);
CREATE INDEX idx_event_seats_status ON event_seats(event_id, status);
CREATE INDEX idx_bookings_user ON bookings(user_id, status);
CREATE INDEX idx_tickets_code ON tickets(ticket_code);
CREATE INDEX idx_attendance_gate ON attendance(gate_used, check_in_time);
