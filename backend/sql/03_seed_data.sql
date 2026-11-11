-- ============================================================================
-- SmartEvent Seed Data Script
-- ============================================================================

-- 1. USERS & ORGANIZERS
INSERT INTO users (full_name, email, password_hash, role, reward_points, loyalty_level) VALUES
('Midhu User', 'midhu@smartevent.io', 'pbkdf2:sha256:600000$hash$midhupassword', 'user', 650, 'Gold'),
('Emily Watson', 'emily@gmail.com', 'pbkdf2:sha256:600000$hash$emilypass', 'user', 280, 'Silver'),
('David Kim', 'david@tech.io', 'pbkdf2:sha256:600000$hash$davidpass', 'user', 1200, 'Platinum'),
('Sarah MusicLive', 'sarah@livenation.com', 'pbkdf2:sha256:600000$hash$sarahpass', 'organizer', 1500, 'Master'),
('Alex TechCorp', 'alex@techcorp.com', 'pbkdf2:sha256:600000$hash$alexpass', 'organizer', 1800, 'Master'),
('Admin System', 'admin@smartevent.io', 'pbkdf2:sha256:600000$hash$adminpass', 'admin', 5000, 'Master');

INSERT INTO organizers (user_id, organization_name, contact_email, phone, verified) VALUES
(4, 'LiveNation Global', 'contact@livenation.com', '+1-555-0192', TRUE),
(5, 'TechCorp Summits', 'events@techcorp.com', '+1-555-0144', TRUE);

-- 2. USER PREFERENCES
INSERT INTO user_preferences (user_id, preferred_categories, max_budget, preferred_location, preferred_event_type) VALUES
(1, 'Tech & AI,Gaming & Esports,Music & Concerts', 300.00, 'San Francisco, CA', 'In-Person'),
(2, 'Music & Concerts,Workshops & Masterclasses', 150.00, 'Los Angeles, CA', 'In-Person'),
(3, 'Tech & AI,Business & Startup', 500.00, 'San Francisco, CA', 'Hybrid');

-- 3. CATEGORIES
INSERT INTO event_categories (name, description, icon) VALUES
('Tech & AI', 'Artificial Intelligence, Software Architecture, Quantum Computing & Robotics Summit', 'Cpu'),
('Music & Concerts', 'Live Arenas, Electronic Music Festivals, Classical & Indie Showcases', 'Music'),
('Gaming & Esports', 'Global Esports Tournaments, Game Dev Expos, Indie Showcases & VR Arenas', 'Gamepad2'),
('Workshops & Masterclasses', 'Hands-on Bootcamp, Coding Sprints, Product Design & Leadership Workshops', 'BookOpen'),
('Business & Startup', 'Venture Capital, Founder Pitch Competitions & Enterprise Growth Summits', 'Briefcase');

-- 4. VENUES
INSERT INTO venues (name, address, city, total_capacity, gate_info) VALUES
('Moscone Center', '747 Howard St', 'San Francisco, CA', 5000, '{"Gate A": "North Main Entrance", "Gate B": "South Concourse", "Gate C": "VIP Sky Bridge"}'::jsonb),
('Crypto.com Arena', '1111 S Figueroa St', 'Los Angeles, CA', 18000, '{"Gate 1": "Figueroa Plaza", "Gate 2": "Chick Hearn Ct", "Gate VIP": "Star Plaza"}'::jsonb),
('Tech Hub Convention Hall', '500 E 4th St', 'Austin, TX', 2500, '{"Gate East": "Main Lobby", "Gate West": "Exhibitor Entrance"}'::jsonb);

-- 5. EVENTS
INSERT INTO events (organizer_id, category_id, venue_id, title, description, start_time, end_time, banner_url, status) VALUES
(2, 1, 1, 'Global AI & Tech Summit 2026', 'Join 3,000+ engineers, researchers, and visionaries for keynotes on LLMs, Autonomous Agents, and High-Performance SQL Architecture.', CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '10 days 8 hours', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'published'),
(1, 2, 2, 'Neon Lights Electronic Music Festival', 'An unforgettable night featuring world-renowned DJs, immersive light projections, and spatial 3D audio visualizers.', CURRENT_TIMESTAMP + INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '15 days 6 hours', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800', 'published'),
(2, 3, 1, 'Cyberpunk Esports World Championship', 'Top 16 pro gaming teams compete live for a $1,000,000 prize pool in Valorant, Apex, and Street Fighter.', CURRENT_TIMESTAMP + INTERVAL '20 days', CURRENT_TIMESTAMP + INTERVAL '20 days 10 hours', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 'published'),
(2, 4, 3, 'Fullstack & Database Architecture Workshop', 'Intensive 1-day masterclass covering PostgreSQL internals, indexes, stored procedures, and React performance tuning.', CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '5 days 6 hours', 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800', 'published'),
(2, 5, 1, 'Silicon Valley Founder & VC Expo', 'Pitch directly to top Tier-1 VC funds, attend angel round panel sessions, and network with 500+ tech founders.', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '30 days 7 hours', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800', 'published');

-- 6. TICKET TYPES
INSERT INTO event_ticket_types (event_id, name, base_price, total_quantity, available_quantity) VALUES
(1, 'VIP Pass', 250.00, 50, 45),
(1, 'Executive Pass', 150.00, 100, 90),
(1, 'General Admission', 75.00, 200, 180),
(2, 'VIP Pass', 180.00, 60, 50),
(2, 'General Admission', 65.00, 300, 270),
(3, 'VIP Pass', 200.00, 40, 35),
(3, 'Executive Pass', 120.00, 80, 70),
(3, 'General Admission', 50.00, 150, 140),
(4, 'Executive Pass', 199.00, 40, 30),
(4, 'General Admission', 99.00, 60, 50),
(5, 'VIP Pass', 299.00, 30, 25),
(5, 'General Admission', 120.00, 100, 95);

-- 7. SEATS GENERATION FOR EVENT 1 & 2
-- Create 15 seats for Venue 1 (Moscone Center)
INSERT INTO seats (venue_id, section, row_label, seat_number, price_multiplier) VALUES
(1, 'VIP', 'A', 1, 1.50), (1, 'VIP', 'A', 2, 1.50), (1, 'VIP', 'A', 3, 1.50), (1, 'VIP', 'A', 4, 1.50), (1, 'VIP', 'A', 5, 1.50),
(1, 'Executive', 'B', 1, 1.20), (1, 'Executive', 'B', 2, 1.20), (1, 'Executive', 'B', 3, 1.20), (1, 'Executive', 'B', 4, 1.20), (1, 'Executive', 'B', 5, 1.20),
(1, 'Regular', 'C', 1, 1.00), (1, 'Regular', 'C', 2, 1.00), (1, 'Regular', 'C', 3, 1.00), (1, 'Regular', 'C', 4, 1.00), (1, 'Regular', 'C', 5, 1.00);

-- Map Seats to Event 1 (Global AI & Tech Summit)
INSERT INTO event_seats (event_id, seat_id, ticket_type_id, price, status) VALUES
(1, 1, 1, 250.00, 'BOOKED'),
(1, 2, 1, 250.00, 'BOOKED'),
(1, 3, 1, 250.00, 'AVAILABLE'),
(1, 4, 1, 250.00, 'AVAILABLE'),
(1, 5, 1, 250.00, 'AVAILABLE'),
(1, 6, 2, 150.00, 'BOOKED'),
(1, 7, 2, 150.00, 'AVAILABLE'),
(1, 8, 2, 150.00, 'AVAILABLE'),
(1, 9, 2, 150.00, 'AVAILABLE'),
(1, 10, 2, 150.00, 'AVAILABLE'),
(1, 11, 3, 75.00, 'BOOKED'),
(1, 12, 3, 75.00, 'AVAILABLE'),
(1, 13, 3, 75.00, 'AVAILABLE'),
(1, 14, 3, 75.00, 'AVAILABLE'),
(1, 15, 3, 75.00, 'AVAILABLE');

-- 8. PRE-POPULATED BOOKINGS, PAYMENTS & TICKETS
INSERT INTO bookings (user_id, event_id, booking_code, total_amount, discount_amount, net_amount, status, created_at) VALUES
(1, 1, 'BK-AI-2026-001', 500.00, 50.00, 450.00, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(2, 1, 'BK-AI-2026-002', 150.00, 0.00, 150.00, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, 1, 'BK-AI-2026-003', 75.00, 0.00, 75.00, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '1 day');

INSERT INTO booking_items (booking_id, event_seat_id, ticket_type_id, price) VALUES
(1, 1, 1, 250.00),
(1, 2, 1, 250.00),
(2, 6, 2, 150.00),
(3, 11, 3, 75.00);

INSERT INTO payments (booking_id, transaction_reference, payment_method, amount, status, payment_date) VALUES
(1, 'TXN-998811223', 'Credit Card', 450.00, 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(2, 'TXN-998811224', 'Apple Pay', 150.00, 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, 'TXN-998811225', 'Google Pay', 75.00, 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '1 day');

INSERT INTO tickets (booking_id, event_seat_id, ticket_code, status) VALUES
(1, 1, 'TCK-AI-VIP-01', 'VALID'),
(1, 2, 'TCK-AI-VIP-02', 'VALID'),
(2, 6, 'TCK-AI-EXE-01', 'VALID'),
(3, 11, 'TCK-AI-REG-01', 'VALID');

INSERT INTO attendance (ticket_id, gate_used, check_in_time) VALUES
(1, 'Gate C (VIP Lounge)', CURRENT_TIMESTAMP - INTERVAL '3 days 2 hours');

-- 9. QUIZZES & CHALLENGES
INSERT INTO quizzes_challenges (event_id, title, question, options_json, correct_option, points_reward) VALUES
(1, 'AI & Innovation Trivia', 'What is a primary advantage of AI Autonomous Agents in event scheduling?', '["Automated Dynamic Slot & Venue Optimization", "Manually Sending Postal Invites", "Shutting Down Main Power", "Deleting All Booking Records"]'::jsonb, 0, 50),
(1, 'Tech & Future Trends Challenge', 'Which legendary venue is famous for hosting the premiere of groundbreaking tech summits in Silicon Valley?', '["Moscone Center", "Times Square", "Madison Square Garden", "Wembley Stadium"]'::jsonb, 0, 75),
(2, 'Music Festival Trivia', 'What spatial audio technology creates a 360-degree immersive sound experience at modern festivals?', '["Mono 1.0", "Stereo 2.0", "Immersive 3D Spatial Audio", "8-Track Tape"]'::jsonb, 2, 50),
(3, 'Esports Championship Quiz', 'In competitive gaming tournaments, what does the term "Clutch" refer to?', '["Winning a round against the odds when outnumbered", "Pausing the match for a break", "Changing game settings mid-match", "Losing a game in the first minute"]'::jsonb, 0, 50);

-- 10. REVIEWS & BADGES
INSERT INTO reviews (user_id, event_id, rating, comment) VALUES
(1, 1, 5, 'Incredible speaker lineup and seamless seat booking experience! The transaction was instantaneous.'),
(2, 1, 4, 'Very well organized summit with fantastic interactive keynotes and networking sessions.');

INSERT INTO user_rewards_badges (user_id, badge_name, badge_icon, category, coupon_code, discount_percent) VALUES
(1, 'Early Tech Pioneer', 'Zap', 'Tech & AI', 'TECHGURU15', 15),
(1, 'VIP Connoisseur', 'Crown', 'VIP Member', 'VIPELITE20', 20),
(2, 'Music Explorer', 'Headphones', 'Music', 'MUSICFUN10', 10),
(3, 'Master Achiever', 'Trophy', 'Loyalty', 'MASTER30', 30);
