import os
import json
import uuid
import datetime
from db import get_db_connection

def seed_everything():
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    print("=" * 60)
    print("POPULATING ALL 16 TABLES: RUPEES PRICING (INR) & ACROSS INDIA")
    print("=" * 60)

    # -------------------------------------------------------------
    # 1. EVENT CATEGORIES (7 categories)
    # -------------------------------------------------------------
    print("\n[1/16] Seeding 'event_categories'...")
    categories = [
        ('Concerts', 'Live Arenas, Electronic Music Festivals, Classical & Indie Fusion Shows', 'Music'),
        ('Sports', 'Cricket & Football Championships, Badminton Leagues, Esports Tournaments', 'Trophy'),
        ('Movies', 'Film Premieres, International Film Festivals & Cinema Screenings', 'Film'),
        ('Technology', 'Developer Summits, AI Expos, Web3 & Robotics Conferences', 'Cpu'),
        ('Workshops', 'Hands-on Bootcamps, Masterclasses & Creative Labs', 'BookOpen'),
        ('Comedy', 'Standup Specials, Open Mics & Hindi/English Improv Shows', 'Smile'),
        ('College Events', 'Campus Fests, National Hackathons & Cultural Meets', 'GraduationCap')
    ]
    for name, desc, icon in categories:
        cur.execute(
            """
            INSERT INTO event_categories (name, description, icon)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE description=VALUES(description), icon=VALUES(icon)
            """,
            (name, desc, icon)
        )
    conn.commit()

    cur.execute("SELECT category_id, name FROM event_categories")
    cat_map = {r['name']: r['category_id'] for r in cur.fetchall()}
    print(f"  -> Total Categories: {len(cat_map)}")

    # -------------------------------------------------------------
    # 2. USERS (16 users across user, organizer, admin)
    # -------------------------------------------------------------
    print("\n[2/16] Seeding 'users'...")
    sample_users = [
        # Preserving existing key users
        ('Midhun A', 'midhuna1307@gmail.com', 'hash_midhun123', 'user', 1250, 'Gold'),
        ('System Admin', 'admin@123', 'hash_sqlproject', 'admin', 5000, 'Master'),
        ('Gojo Satoru', 'abc@gmail.com', 'hash_password123', 'user', 650, 'Silver'),
        # Organizers in India
        ('Sarah Jenkins', 'sarah@livenation.com', 'hash_password123', 'organizer', 2400, 'Master'),
        ('Alex Mercer', 'alex@techsummit.io', 'hash_password123', 'organizer', 3100, 'Master'),
        ('Elena Rostova', 'elena@cinemaworld.org', 'hash_password123', 'organizer', 1800, 'Platinum'),
        ('Marcus Vance', 'marcus@olympicarena.com', 'hash_password123', 'organizer', 2200, 'Master'),
        # Indian Attendees / Users
        ('David Chen', 'david.chen@gmail.com', 'hash_password123', 'user', 4200, 'Platinum'),
        ('Sophia Rodriguez', 'sophia.r@techmail.com', 'hash_password123', 'user', 3600, 'Platinum'),
        ('Emily Watson', 'emily.watson@outlook.com', 'hash_password123', 'user', 2500, 'Gold'),
        ('Liam O\'Connor', 'liam.oc@gmail.com', 'hash_password123', 'user', 1850, 'Gold'),
        ('Aarav Patel', 'aarav.patel@workmail.io', 'hash_password123', 'user', 1150, 'Gold'),
        ('Jessica Taylor', 'jessica.t@gmail.com', 'hash_password123', 'user', 720, 'Silver'),
        ('Daniel Park', 'daniel.park@university.edu', 'hash_password123', 'user', 410, 'Bronze'),
        ('Maya Lin', 'maya.lin@designhub.io', 'hash_password123', 'user', 250, 'Bronze'),
        ('Rohan Sharma', 'rohan.sharma@yahoo.com', 'hash_password123', 'user', 380, 'Bronze')
    ]

    for name, email, pwd_hash, role, pts, loyalty in sample_users:
        cur.execute(
            """
            INSERT INTO users (full_name, email, password_hash, role, reward_points, loyalty_level)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                full_name=VALUES(full_name),
                role=VALUES(role),
                reward_points=VALUES(reward_points),
                loyalty_level=VALUES(loyalty_level)
            """,
            (name, email, pwd_hash, role, pts, loyalty)
        )
    conn.commit()

    cur.execute("SELECT user_id, email, full_name, role FROM users")
    all_users = cur.fetchall()
    user_map = {u['email']: u['user_id'] for u in all_users}
    print(f"  -> Total Users: {len(all_users)}")

    # -------------------------------------------------------------
    # 3. ORGANIZERS (5 major event organizers in India)
    # -------------------------------------------------------------
    print("\n[3/16] Seeding 'organizers'...")
    org_specs = [
        ('admin@123', 'SmartEvent Entertainment India', 'admin@123', '+91-98401-23456', 1),
        ('sarah@livenation.com', 'Sunburn & LiveNation India', 'sarah@livenation.com', '+91-98200-11223', 1),
        ('alex@techsummit.io', 'TechXplore Summits India', 'alex@techsummit.io', '+91-98800-44556', 1),
        ('elena@cinemaworld.org', 'CinemaWorld & Bollywood Guild', 'elena@cinemaworld.org', '+91-98300-77889', 1),
        ('marcus@olympicarena.com', 'All-India Athletics & Esports Federation', 'marcus@olympicarena.com', '+91-98100-99001', 1),
    ]

    for email, org_name, contact, phone, ver in org_specs:
        uid = user_map.get(email)
        if uid:
            cur.execute(
                """
                INSERT INTO organizers (user_id, organization_name, contact_email, phone, verified)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    organization_name=VALUES(organization_name),
                    contact_email=VALUES(contact_email),
                    phone=VALUES(phone),
                    verified=VALUES(verified)
                """,
                (uid, org_name, contact, phone, ver)
            )
    conn.commit()

    cur.execute("SELECT organizer_id, user_id, organization_name FROM organizers")
    all_orgs = cur.fetchall()
    org_map = {o['organization_name']: o['organizer_id'] for o in all_orgs}
    print(f"  -> Total Organizers: {len(all_orgs)}")

    # -------------------------------------------------------------
    # 4. USER PREFERENCES (Indian cities and Rupee budgets)
    # -------------------------------------------------------------
    print("\n[4/16] Seeding 'user_preferences'...")
    pref_specs = [
        ('midhuna1307@gmail.com', 'Technology,Concerts,Sports', 3500.00, 'Chennai, Tamil Nadu', 'In-Person'),
        ('admin@123', 'Technology,Concerts,Sports,Workshops,Movies,Comedy,College Events', 10000.00, 'Bengaluru, Karnataka', 'In-Person'),
        ('abc@gmail.com', 'Movies,Comedy,Concerts', 2500.00, 'Mumbai, Maharashtra', 'In-Person'),
        ('sarah@livenation.com', 'Concerts,Comedy', 4500.00, 'Bengaluru, Karnataka', 'In-Person'),
        ('alex@techsummit.io', 'Technology,Workshops', 5000.00, 'Bengaluru, Karnataka', 'Hybrid'),
        ('elena@cinemaworld.org', 'Movies,Comedy', 3000.00, 'Mumbai, Maharashtra', 'In-Person'),
        ('marcus@olympicarena.com', 'Sports,Concerts', 4000.00, 'New Delhi, NCR', 'In-Person'),
        ('david.chen@gmail.com', 'Technology,Workshops,Sports', 6000.00, 'New Delhi, NCR', 'In-Person'),
        ('sophia.r@techmail.com', 'Technology,College Events,Concerts', 4000.00, 'Hyderabad, Telangana', 'Hybrid'),
        ('emily.watson@outlook.com', 'Concerts,Workshops', 3500.00, 'Chennai, Tamil Nadu', 'In-Person'),
        ('liam.oc@gmail.com', 'Comedy,Concerts,Sports', 2500.00, 'Mumbai, Maharashtra', 'In-Person'),
        ('aarav.patel@workmail.io', 'Workshops,Technology', 3000.00, 'Hyderabad, Telangana', 'Hybrid'),
        ('jessica.t@gmail.com', 'Concerts,Movies', 2000.00, 'Kolkata, West Bengal', 'In-Person'),
        ('daniel.park@university.edu', 'College Events,Gaming,Sports', 1500.00, 'Chennai, Tamil Nadu', 'In-Person'),
        ('maya.lin@designhub.io', 'Movies,Workshops', 2500.00, 'Kochi, Kerala', 'Virtual'),
        ('rohan.sharma@yahoo.com', 'Sports,Comedy', 2000.00, 'New Delhi, NCR', 'In-Person')
    ]

    for email, cats, budget, loc, ev_type in pref_specs:
        uid = user_map.get(email)
        if uid:
            cur.execute(
                """
                INSERT INTO user_preferences (user_id, preferred_categories, max_budget, preferred_location, preferred_event_type)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    preferred_categories=VALUES(preferred_categories),
                    max_budget=VALUES(max_budget),
                    preferred_location=VALUES(preferred_location),
                    preferred_event_type=VALUES(preferred_event_type)
                """,
                (uid, cats, budget, loc, ev_type)
            )
    conn.commit()
    cur.execute("SELECT COUNT(*) as count FROM user_preferences")
    print(f"  -> Total User Preferences: {cur.fetchone()['count']}")

    # -------------------------------------------------------------
    # 5. VENUES (Major arenas across India)
    # -------------------------------------------------------------
    print("\n[5/16] Seeding 'venues' across India...")
    venues_data = [
        (1, 'Jawaharlal Nehru Indoor Stadium', 'Sydenhams Road, Periamet', 'Chennai, Tamil Nadu', 8000,
         json.dumps({"Gate 1": "Sydenhams Road Entry", "Gate 2": "Vepery Pavilion", "Gate VIP": "Presidents Club"}),
         'https://maps.google.com/?q=Jawaharlal+Nehru+Stadium+Chennai'),
        (2, 'Chennai Trade Centre', 'Mount-Poonamallee Road, Nandambakkam', 'Chennai, Tamil Nadu', 3000,
         json.dumps({"Gate A": "Convention Foyer", "Gate B": "Exhibition Hall 1", "Gate VIP": "VIP Entrance"}),
         'https://maps.google.com/?q=Chennai+Trade+Centre'),
        (3, 'KTPO Convention Centre & Whitefield Arena', 'Plot 121, EPIP Zone, Whitefield', 'Bengaluru, Karnataka', 5000,
         json.dumps({"Gate A": "Whitefield Main Gate", "Gate B": "Tech Concourse", "Gate VIP": "Executive Lounge"}),
         'https://maps.google.com/?q=KTPO+Whitefield+Bangalore'),
        (4, 'Jio World Convention Centre', 'G Block, Bandra Kurla Complex (BKC)', 'Mumbai, Maharashtra', 6000,
         json.dumps({"Gate 1": "BKC Avenue", "Gate 2": "Grand Concourse", "Gate VIP": "Jio Lotus Lounge"}),
         'https://maps.google.com/?q=Jio+World+Convention+Centre+Mumbai'),
        (5, 'Bharat Mandapam', 'Pragati Maidan', 'New Delhi, NCR', 7000,
         json.dumps({"Gate 1": "Mathura Road Concourse", "Gate 4": "Bhairon Marg", "Gate VIP": "Plenary Foyer"}),
         'https://maps.google.com/?q=Bharat+Mandapam+New+Delhi'),
        (6, 'HITEX Exhibition & Convention Centre', 'Trade Fair Office Building, Hitec City', 'Hyderabad, Telangana', 4500,
         json.dumps({"Gate A": "Cyber Towers Concourse", "Gate B": "Trade Fair Entry", "Gate VIP": "Cyber VIP Suites"}),
         'https://maps.google.com/?q=HITEX+Hyderabad'),
        (7, 'Biswa Bangla Convention Centre', 'Action Area I, New Town', 'Kolkata, West Bengal', 3200,
         json.dumps({"Gate 1": "Rajarhat Plaza", "Gate 2": "Auditorium Concourse", "Gate VIP": "Bengal Lounge"}),
         'https://maps.google.com/?q=Biswa+Bangla+Convention+Centre+Kolkata')
    ]

    for vid, name, addr, city, cap, gates, map_link in venues_data:
        cur.execute(
            """
            INSERT INTO venues (venue_id, name, address, city, total_capacity, gate_info, map_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                name=VALUES(name),
                address=VALUES(address),
                city=VALUES(city),
                total_capacity=VALUES(total_capacity),
                gate_info=VALUES(gate_info),
                map_url=VALUES(map_url)
            """,
            (vid, name, addr, city, cap, gates, map_link)
        )
    conn.commit()

    cur.execute("SELECT venue_id, name FROM venues")
    all_venues = cur.fetchall()
    venue_map = {v['name']: v['venue_id'] for v in all_venues}
    print(f"  -> Total Venues: {len(all_venues)}")

    # -------------------------------------------------------------
    # 6. SEATS (40 physical seats per venue for all 7 venues = 280 seats)
    # -------------------------------------------------------------
    print("\n[6/16] Seeding 'seats'...")
    for v in all_venues:
        vid = v['venue_id']
        cur.execute("SELECT COUNT(*) as cnt FROM seats WHERE venue_id = %s", (vid,))
        if cur.fetchone()['cnt'] < 40:
            for row in ['A', 'B', 'C', 'D', 'E']:
                section = 'VIP' if row in ['A', 'B'] else 'Regular'
                mult = 1.5 if section == 'VIP' else 1.0
                for num in range(1, 9):
                    cur.execute(
                        """
                        INSERT IGNORE INTO seats (venue_id, section, row_label, seat_number, price_multiplier)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (vid, section, row, num, mult)
                    )
    conn.commit()
    cur.execute("SELECT COUNT(*) as count FROM seats")
    print(f"  -> Total Physical Seats in System: {cur.fetchone()['count']}")

    # -------------------------------------------------------------
    # 7. EVENTS (Across India in Indian Cities)
    # -------------------------------------------------------------
    print("\n[7/16] Seeding 'events' across India...")
    events_spec = [
        # 1. Concerts (Bengaluru)
        (1, org_map.get('Sunburn & LiveNation India', 1), cat_map['Concerts'], venue_map['KTPO Convention Centre & Whitefield Arena'],
         'Sunburn Arena Electronic Music Tour 2026',
         'Experience India\'s biggest electronic dance music festival in Bengaluru featuring top international DJs, 3D laser projections, and bass-heavy spatial audio under the stars.',
         '2026-11-20 18:30:00', '2026-11-20 23:30:00',
         'https://images.unsplash.com/photo-1540039155732-d674147f87a3?auto=format&fit=crop&w=1200&q=80', 'published'),

        # 2. Technology (New Delhi)
        (2, org_map.get('TechXplore Summits India', 1), cat_map['Technology'], venue_map['Bharat Mandapam'],
         'India AI & Autonomous Tech Summit 2026',
         'Keynotes from top global and Indian AI founders, live agentic workflows, LLM robotics demos, and high-concurrency database engineering at Bharat Mandapam.',
         '2026-12-05 09:30:00', '2026-12-05 18:00:00',
         'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80', 'published'),

        # 3. Sports (Chennai)
        (3, org_map.get('All-India Athletics & Esports Federation', 1), cat_map['Sports'], venue_map['Jawaharlal Nehru Indoor Stadium'],
         'Cyberpunk Indian Esports Championship Finals',
         'India\'s top 16 professional gaming teams battle it out live inside Jawaharlal Nehru Stadium for a record ₹1 Crore prize pool across Valorant and BGMI.',
         '2026-12-18 16:00:00', '2026-12-18 22:00:00',
         'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80', 'published'),

        # 4. Concerts (Chennai)
        (4, org_map.get('Sunburn & LiveNation India', 1), cat_map['Concerts'], venue_map['Chennai Trade Centre'],
         'Royal Carnatic & Symphony Fusion Gala',
         'A mesmerizing evening celebrating classical Carnatic ragas orchestrated with an international 50-piece symphony orchestra and dramatic acoustics.',
         '2026-12-25 19:00:00', '2026-12-25 22:30:00',
         'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80', 'published'),

        # 5. Concerts (Mumbai)
        (5, org_map.get('Sunburn & LiveNation India', 1), cat_map['Concerts'], venue_map['Jio World Convention Centre'],
         'Bollywood & Retro Pop Music Fiesta 2026',
         'The ultimate Bollywood live musical night at BKC Mumbai featuring chart-topping playback icons, high-octane stage choreography, and nostalgic 90s retros.',
         '2026-11-30 18:30:00', '2026-11-30 23:59:00',
         'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', 'published'),

        # 6. Movies (Kolkata)
        (6, org_map.get('CinemaWorld & Bollywood Guild', 1), cat_map['Movies'], venue_map['Biswa Bangla Convention Centre'],
         'International Indian Indie Film Premiere',
         'Exclusive world premiere screenings of celebrated Indian and international cinema at Biswa Bangla, followed by director panel discussions and red-carpet dinner.',
         '2026-11-28 17:00:00', '2026-11-28 22:00:00',
         'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80', 'published'),

        # 7. Workshops (Hyderabad)
        (7, org_map.get('TechXplore Summits India', 1), cat_map['Workshops'], venue_map['HITEX Exhibition & Convention Centre'],
         'Fullstack Cloud & Scalable Systems Masterclass',
         'Intensive hands-on masterclass in Hyderabad covering distributed SQL databases, event-driven streaming, microservices optimization, and agentic AI models.',
         '2026-12-10 10:00:00', '2026-12-10 17:00:00',
         'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80', 'published'),

        # 8. Comedy (Mumbai)
        (8, org_map.get('Sunburn & LiveNation India', 1), cat_map['Comedy'], venue_map['Jio World Convention Centre'],
         'All-India Standup Comedy Marathon',
         'Non-stop laughs at Jio World BKC featuring India\'s top standup comedians, hilarious crowd improv roasts, and special celebrity guest headliners.',
         '2026-11-15 19:30:00', '2026-11-15 22:30:00',
         'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', 'published'),

        # 9. College Events (Chennai)
        (9, org_map.get('SmartEvent Entertainment India', 1), cat_map['College Events'], venue_map['Jawaharlal Nehru Indoor Stadium'],
         'National Inter-College Hackathon & Cultural Sangam',
         'India\'s most prestigious student tech fest with a 36-hour hackathon sprint, battle of the college bands, drone racing, and cultural showcases.',
         '2026-12-01 09:00:00', '2026-12-02 18:00:00',
         'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80', 'published'),

        # 10. Sports (Bengaluru)
        (10, org_map.get('All-India Athletics & Esports Federation', 1), cat_map['Sports'], venue_map['KTPO Convention Centre & Whitefield Arena'],
         'Indian Premier Football & Futsal Invitational',
         'Exciting high-speed futsal and football exhibition matches featuring national champions and international stars in an electric arena setup.',
         '2026-12-28 18:30:00', '2026-12-28 21:30:00',
         'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80', 'published'),

        # 11. Concerts (Chennai) - Past / Completed Event
        (11, org_map.get('Sunburn & LiveNation India', 1), cat_map['Concerts'], venue_map['Chennai Trade Centre'],
         'Sunset Rooftop Classical & Sitar Soirée',
         'An intimate classical evening of master sitar recitals, flute melodies, and ambient acoustic resonance under the golden Chennai twilight.',
         '2026-10-15 19:00:00', '2026-10-15 23:00:00',
         'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80', 'completed'),

        # 12. Technology (New Delhi) - Past / Completed Event
        (12, org_map.get('TechXplore Summits India', 1), cat_map['Technology'], venue_map['Bharat Mandapam'],
         'NextGen Robotics & Space Tech Expo India',
         'Groundbreaking autonomous robotics demonstrations, lunar mission hardware exhibits, and interactive STEM keynote tracks at Bharat Mandapam.',
         '2026-10-08 09:00:00', '2026-10-08 17:00:00',
         'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80', 'completed')
    ]

    for eid, oid, cid, vid, title, desc, st, et, banner, status in events_spec:
        cur.execute(
            """
            INSERT INTO events (event_id, organizer_id, category_id, venue_id, title, description, start_time, end_time, banner_url, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                organizer_id=VALUES(organizer_id),
                category_id=VALUES(category_id),
                venue_id=VALUES(venue_id),
                title=VALUES(title),
                description=VALUES(description),
                start_time=VALUES(start_time),
                end_time=VALUES(end_time),
                banner_url=VALUES(banner_url),
                status=VALUES(status)
            """,
            (eid, oid, cid, vid, title, desc, st, et, banner, status)
        )
    conn.commit()

    cur.execute("SELECT event_id, title, venue_id FROM events")
    all_events = cur.fetchall()
    print(f"  -> Total Events in System: {len(all_events)}")

    # -------------------------------------------------------------
    # 8. EVENT TICKET TYPES (Rupees INR Pricing)
    # -------------------------------------------------------------
    print("\n[8/16] Seeding 'event_ticket_types' in Rupees (INR)...")
    # INR pricing: (VIP Pass Price, General Admission Price)
    pricing_map_inr = {
        1: (2499.00, 999.00),    # Sunburn Arena (₹2499 VIP, ₹999 Gen)
        2: (3999.00, 1499.00),   # AI Tech Summit (₹3999 VIP, ₹1499 Gen)
        3: (1499.00, 499.00),    # Esports Finals (₹1499 VIP, ₹499 Gen)
        4: (2199.00, 799.00),    # Carnatic Symphony (₹2199 VIP, ₹799 Gen)
        5: (3499.00, 1299.00),   # Bollywood Pop (₹3499 VIP, ₹1299 Gen)
        6: (999.00, 399.00),     # Indie Film Premiere (₹999 VIP, ₹399 Gen)
        7: (2499.00, 999.00),    # Cloud Masterclass (₹2499 VIP, ₹999 Gen)
        8: (1799.00, 699.00),    # Standup Comedy (₹1799 VIP, ₹699 Gen)
        9: (699.00, 299.00),     # College Hackathon (₹699 VIP, ₹299 Gen)
        10: (1299.00, 499.00),   # Football Futsal (₹1299 VIP, ₹499 Gen)
        11: (1899.00, 699.00),   # Sitar Soirée (₹1899 VIP, ₹699 Gen)
        12: (2299.00, 899.00)    # Robotics & Space Expo (₹2299 VIP, ₹899 Gen)
    }

    for ev in all_events:
        eid = ev['event_id']
        vip_price, reg_price = pricing_map_inr.get(eid, (1999.00, 699.00))

        cur.execute("SELECT ticket_type_id, name FROM event_ticket_types WHERE event_id = %s", (eid,))
        tt_rows = cur.fetchall()

        if len(tt_rows) == 0:
            cur.execute(
                """
                INSERT INTO event_ticket_types (event_id, name, base_price, total_quantity, available_quantity)
                VALUES (%s, 'VIP Pass', %s, 16, 16), (%s, 'General Admission', %s, 24, 24)
                """,
                (eid, vip_price, eid, reg_price)
            )
        else:
            for tt in tt_rows:
                new_price = vip_price if 'VIP' in tt['name'] else reg_price
                cur.execute(
                    "UPDATE event_ticket_types SET base_price = %s WHERE ticket_type_id = %s",
                    (new_price, tt['ticket_type_id'])
                )
    conn.commit()

    cur.execute("SELECT COUNT(*) as count FROM event_ticket_types")
    print(f"  -> Total Event Ticket Types: {cur.fetchone()['count']}")

    # -------------------------------------------------------------
    # 9. EVENT SEATS (Update prices to Rupees)
    # -------------------------------------------------------------
    print("\n[9/16] Seeding 'event_seats' with Rupee pricing...")
    for ev in all_events:
        eid = ev['event_id']
        vid = ev['venue_id']

        cur.execute("SELECT ticket_type_id, name, base_price FROM event_ticket_types WHERE event_id = %s", (eid,))
        tt_rows = cur.fetchall()
        vip_tt = next((t for t in tt_rows if 'VIP' in t['name']), tt_rows[0] if tt_rows else None)
        gen_tt = next((t for t in tt_rows if 'VIP' not in t['name']), tt_rows[-1] if tt_rows else None)

        cur.execute("SELECT seat_id, section, price_multiplier FROM seats WHERE venue_id = %s", (vid,))
        v_seats = cur.fetchall()

        for s in v_seats:
            is_vip = (s['section'] == 'VIP')
            tt = vip_tt if is_vip else gen_tt
            tt_id = tt['ticket_type_id'] if tt else None
            base = float(tt['base_price']) if tt else 699.0
            price = round(base * float(s['price_multiplier']), 2)

            cur.execute(
                """
                INSERT INTO event_seats (event_id, seat_id, ticket_type_id, price, status)
                VALUES (%s, %s, %s, %s, 'AVAILABLE')
                ON DUPLICATE KEY UPDATE price = VALUES(price), ticket_type_id = VALUES(ticket_type_id)
                """,
                (eid, s['seat_id'], tt_id, price)
            )
    cur.execute("UPDATE event_seats es JOIN event_ticket_types tt ON es.ticket_type_id = tt.ticket_type_id JOIN seats s ON es.seat_id = s.seat_id SET es.price = ROUND(tt.base_price * s.price_multiplier, 2)")
    conn.commit()
    cur.execute("SELECT COUNT(*) as count FROM event_seats")
    print(f"  -> Total Event Seats: {cur.fetchone()['count']}")

    # -------------------------------------------------------------
    # 10. BOOKINGS, 11. ITEMS, 12. PAYMENTS, 13. TICKETS (Rupees INR)
    # -------------------------------------------------------------
    print("\n[10-13/16] Seeding 'bookings', 'booking_items', 'payments', 'tickets'...")
    booking_scenarios = [
        # (user_email, event_id, seat_count, status, days_ago, payment_method, coupon_pct)
        ('david.chen@gmail.com', 2, 2, 'CONFIRMED', 12, 'UPI - Google Pay', 0),
        ('sophia.r@techmail.com', 2, 1, 'CONFIRMED', 10, 'Credit Card', 15),
        ('emily.watson@outlook.com', 1, 2, 'CONFIRMED', 8, 'UPI - PhonePe', 10),
        ('liam.oc@gmail.com', 8, 2, 'CONFIRMED', 7, 'UPI - Paytm', 0),
        ('aarav.patel@workmail.io', 7, 1, 'CONFIRMED', 6, 'Credit Card', 20),
        ('jessica.t@gmail.com', 6, 2, 'CONFIRMED', 5, 'Net Banking', 0),
        ('daniel.park@university.edu', 9, 2, 'CONFIRMED', 4, 'UPI - Google Pay', 10),
        ('david.chen@gmail.com', 3, 2, 'CONFIRMED', 4, 'UPI - PhonePe', 0),
        ('sophia.r@techmail.com', 7, 1, 'CONFIRMED', 3, 'Credit Card', 0),
        ('maya.lin@designhub.io', 6, 1, 'CONFIRMED', 3, 'UPI - Paytm', 15),
        ('rohan.sharma@yahoo.com', 10, 2, 'CONFIRMED', 2, 'UPI - Google Pay', 0),
        ('david.chen@gmail.com', 10, 2, 'CONFIRMED', 2, 'Credit Card', 0),
        ('midhuna1307@gmail.com', 8, 1, 'CONFIRMED', 1, 'UPI - PhonePe', 10),
        ('emily.watson@outlook.com', 4, 2, 'CONFIRMED', 1, 'Credit Card', 0),
        ('liam.oc@gmail.com', 3, 1, 'CANCELLED', 5, 'Credit Card', 0),
        ('jessica.t@gmail.com', 5, 2, 'CANCELLED', 9, 'Credit Card', 0),
        # Completed event bookings
        ('david.chen@gmail.com', 11, 2, 'CONFIRMED', 18, 'UPI - Google Pay', 0),
        ('emily.watson@outlook.com', 11, 2, 'CONFIRMED', 17, 'Credit Card', 15),
        ('sophia.r@techmail.com', 12, 1, 'CONFIRMED', 25, 'UPI - PhonePe', 0),
        ('aarav.patel@workmail.io', 12, 2, 'CONFIRMED', 24, 'Credit Card', 10),
        ('midhuna1307@gmail.com', 12, 1, 'CONFIRMED', 23, 'UPI - Google Pay', 0)
    ]

    for email, eid, seat_cnt, b_status, days_ago, pay_method, disc_pct in booking_scenarios:
        uid = user_map.get(email)
        if not uid:
            continue

        # Check existing booking
        cur.execute(
            "SELECT booking_id FROM bookings WHERE user_id = %s AND event_id = %s",
            (uid, eid)
        )
        existing_b = cur.fetchone()
        if existing_b:
            # Update net_amount and payment to match new rupee pricing
            cur.execute(
                """
                SELECT bi.item_id, es.price 
                FROM booking_items bi
                JOIN event_seats es ON bi.event_seat_id = es.event_seat_id
                WHERE bi.booking_id = %s
                """,
                (existing_b['booking_id'],)
            )
            items = cur.fetchall()
            if items:
                for it in items:
                    cur.execute("UPDATE booking_items SET price = %s WHERE item_id = %s", (it['price'], it['item_id']))
                new_sub = sum([float(it['price']) for it in items])
                new_disc = new_sub * (disc_pct / 100.0)
                new_net = max(0.0, new_sub - new_disc)
                cur.execute(
                    "UPDATE bookings SET total_amount = %s, discount_amount = %s, net_amount = %s WHERE booking_id = %s",
                    (new_sub, new_disc, new_net, existing_b['booking_id'])
                )
                cur.execute(
                    "UPDATE payments SET amount = %s, payment_method = %s WHERE booking_id = %s",
                    (new_net, pay_method, existing_b['booking_id'])
                )
            continue

        # Find available event seats
        cur.execute(
            """
            SELECT es.event_seat_id, es.price, es.ticket_type_id
            FROM event_seats es
            WHERE es.event_id = %s AND es.status = 'AVAILABLE'
            LIMIT %s
            """,
            (eid, seat_cnt)
        )
        seats_to_book = cur.fetchall()
        if len(seats_to_book) < seat_cnt:
            continue

        subtotal = sum([float(s['price']) for s in seats_to_book])
        discount = subtotal * (disc_pct / 100.0)
        net = max(0.0, subtotal - discount)
        b_code = f"BK-{uuid.uuid4().hex[:8].upper()}"
        created_time = datetime.datetime.now() - datetime.timedelta(days=days_ago)

        # 1. Insert Booking
        cur.execute(
            """
            INSERT INTO bookings (user_id, event_id, booking_code, total_amount, discount_amount, net_amount, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (uid, eid, b_code, subtotal, discount, net, b_status, created_time)
        )
        booking_id = cur.lastrowid

        # 2. Insert Booking Items & Tickets
        for s in seats_to_book:
            cur.execute(
                """
                INSERT INTO booking_items (booking_id, event_seat_id, ticket_type_id, price)
                VALUES (%s, %s, %s, %s)
                """,
                (booking_id, s['event_seat_id'], s['ticket_type_id'], s['price'])
            )

            seat_st = 'BOOKED' if b_status == 'CONFIRMED' else 'AVAILABLE'
            cur.execute(
                "UPDATE event_seats SET status = %s WHERE event_seat_id = %s",
                (seat_st, s['event_seat_id'])
            )

            tck_code = f"TCK-{uuid.uuid4().hex[:10].upper()}"
            tck_status = 'CANCELLED' if b_status == 'CANCELLED' else ('USED' if days_ago >= 14 else 'VALID')
            val_at = (created_time + datetime.timedelta(hours=2)) if tck_status == 'USED' else None

            cur.execute(
                """
                INSERT INTO tickets (booking_id, event_seat_id, ticket_code, status, validated_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (booking_id, s['event_seat_id'], tck_code, tck_status, val_at)
            )

        # 3. Insert Payment
        txn_ref = f"TXN-{uuid.uuid4().hex[:12].upper()}"
        pay_st = 'REFUNDED' if b_status == 'CANCELLED' else 'SUCCESS'
        cur.execute(
            """
            INSERT INTO payments (booking_id, transaction_reference, payment_method, amount, status, payment_date)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (booking_id, txn_ref, pay_method, net, pay_st, created_time)
        )

    cur.execute("UPDATE booking_items bi JOIN event_seats es ON bi.event_seat_id = es.event_seat_id SET bi.price = es.price")
    cur.execute("UPDATE bookings b JOIN (SELECT booking_id, SUM(price) as tot FROM booking_items GROUP BY booking_id) t ON b.booking_id = t.booking_id SET b.total_amount = t.tot, b.net_amount = GREATEST(0, t.tot - COALESCE(b.discount_amount, 0))")
    cur.execute("UPDATE payments p JOIN bookings b ON p.booking_id = b.booking_id SET p.amount = b.net_amount")
    conn.commit()

    cur.execute("SELECT COUNT(*) as count FROM bookings")
    print(f"  -> Total Bookings: {cur.fetchone()['count']}")
    cur.execute("SELECT COUNT(*) as count FROM booking_items")
    print(f"  -> Total Booking Items: {cur.fetchone()['count']}")
    cur.execute("SELECT COUNT(*) as count FROM payments")
    print(f"  -> Total Payments: {cur.fetchone()['count']}")
    cur.execute("SELECT COUNT(*) as count FROM tickets")
    print(f"  -> Total Tickets: {cur.fetchone()['count']}")

    # -------------------------------------------------------------
    # 14. ATTENDANCE (Indian Venue Gates Check-ins)
    # -------------------------------------------------------------
    print("\n[14/16] Seeding 'attendance'...")
    cur.execute("SELECT ticket_id, booking_id FROM tickets WHERE status = 'USED'")
    used_tickets = cur.fetchall()

    indian_gates = [
        'Gate 1 (Main Concourse)',
        'Gate 2 (Pavilion Turnstile)',
        'Gate A (Whitefield Plaza)',
        'Gate B (BKC Avenue Concourse)',
        'Gate VIP (Lotus Sky Lounge)',
        'Gate East (Cyber Foyer)'
    ]
    scanners = [
        'Automated QR Scanner #1',
        'Turnstile Scanner #4',
        'Staff Mobile Scanner (Officer Rahul)',
        'VIP FastTrack Scanner',
        'Gate Concourse Scanner #2'
    ]

    for idx, tck in enumerate(used_tickets):
        tid = tck['ticket_id']
        cur.execute("SELECT attendance_id FROM attendance WHERE ticket_id = %s", (tid,))
        if not cur.fetchone():
            gate = indian_gates[idx % len(indian_gates)]
            scanner = scanners[idx % len(scanners)]
            cur.execute(
                """
                INSERT INTO attendance (ticket_id, gate_used, check_in_time, verified_by)
                VALUES (%s, %s, NOW() - INTERVAL %s DAY, %s)
                """,
                (tid, gate, (idx % 10) + 1, scanner)
            )
    conn.commit()
    cur.execute("SELECT COUNT(*) as count FROM attendance")
    print(f"  -> Total Attendance Check-ins: {cur.fetchone()['count']}")

    # -------------------------------------------------------------
    # 15. REVIEWS (Indian Event Reviews)
    # -------------------------------------------------------------
    print("\n[15/16] Seeding 'reviews'...")
    sample_reviews = [
        ('david.chen@gmail.com', 2, 5, 'The AI summit at Bharat Mandapam in New Delhi was world-class! Gained immense practical insights into agentic workflows and SQL scaling.'),
        ('sophia.r@techmail.com', 2, 5, 'Hands down the best tech summit in India. The speaker lineup and high-concurrency database demos were incredible.'),
        ('emily.watson@outlook.com', 1, 5, 'Sunburn Arena in Bengaluru had insane energy! The 3D laser visualizers and acoustic setup were completely breathtaking.'),
        ('midhuna1307@gmail.com', 1, 5, 'Super energetic festival vibe, smooth entry with QR ticketing and top-tier sound engineering across all stages in Bengaluru.'),
        ('david.chen@gmail.com', 3, 5, 'Incredible atmosphere during the Esports Finals at Jawaharlal Nehru Stadium! Giant LED screens and lightning-fast entry.'),
        ('liam.oc@gmail.com', 8, 5, 'Hilarious standup comedy night at Jio World BKC Mumbai! Non-stop laughs from start to finish. Front-row VIP seats were worth every rupee!'),
        ('aarav.patel@workmail.io', 7, 5, 'Intensive and well-structured cloud masterclass at HITEX Hyderabad. Hands-on labs were practical and very clear.'),
        ('jessica.t@gmail.com', 6, 4, 'Great indie movie premiere at Biswa Bangla Convention Centre Kolkata! Sharp 4K laser projection and rich audio.'),
        ('maya.lin@designhub.io', 6, 5, 'Loved the post-screening director Q&A in Kolkata. Very inspiring atmosphere for film enthusiasts.'),
        ('daniel.park@university.edu', 9, 5, 'Energetic hackathon at Nehru Stadium Chennai! Mentors were top tier and tech stalls were super exciting.'),
        ('rohan.sharma@yahoo.com', 10, 5, 'Thrilling football exhibition match in Bengaluru! Watching legends play in person was fantastic.'),
        ('emily.watson@outlook.com', 4, 5, 'The Carnatic symphony fusion at Chennai Trade Centre was enchanting. The acoustic solos gave me chills!'),
        ('david.chen@gmail.com', 11, 5, 'The sunset sitar soirée in Chennai was pure magic. Phenomenal sitar melodies and relaxing ambiance.'),
        ('aarav.patel@workmail.io', 12, 4, 'Fascinating robotics and space tech exhibits at Bharat Mandapam New Delhi. Truly inspiring demonstrations.'),
        ('abc@gmail.com', 8, 5, 'Pure comedic gold in Mumbai! Great crowd interaction and the venue seating was super comfortable.'),
        ('midhuna1307@gmail.com', 4, 5, 'Impeccable classical fusion performance in Chennai. Seat booking and verification at the gate were 100% effortless.')
    ]

    for email, eid, rating, comment in sample_reviews:
        uid = user_map.get(email)
        if uid:
            cur.execute("SELECT review_id FROM reviews WHERE user_id = %s AND event_id = %s", (uid, eid))
            if not cur.fetchone():
                cur.execute(
                    """
                    INSERT INTO reviews (user_id, event_id, rating, comment, created_at)
                    VALUES (%s, %s, %s, %s, NOW() - INTERVAL %s DAY)
                    """,
                    (uid, eid, rating, comment, (eid * 2) % 15)
                )
    conn.commit()
    cur.execute("SELECT COUNT(*) as count FROM reviews")
    print(f"  -> Total Reviews: {cur.fetchone()['count']}")

    # -------------------------------------------------------------
    # 16. USER REWARDS & BADGES (Badges and coupons for users)
    # -------------------------------------------------------------
    print("\n[16/16] Seeding 'user_rewards_badges'...")
    badges_spec = [
        # Midhun A
        ('midhuna1307@gmail.com', 'Early Tech Pioneer', 'Zap', 'Tech & AI', 'PIONEER15', 15),
        ('midhuna1307@gmail.com', 'VIP Festival Connoisseur', 'Crown', 'Music & Concerts', 'VIPFEST20', 20),
        ('midhuna1307@gmail.com', 'Top Community Reviewer', 'Star', 'Community', 'REVIEW10', 10),

        # David Chen (Platinum)
        ('david.chen@gmail.com', 'Master Achiever', 'Trophy', 'Loyalty', 'PLATINUM30', 30),
        ('david.chen@gmail.com', 'Esports Elite Legend', 'Gamepad2', 'Sports & Gaming', 'ESPORTS15', 15),
        ('david.chen@gmail.com', 'AI Visionary Member', 'Cpu', 'Technology', 'AIVISION25', 25),

        # Sophia Rodriguez (Platinum)
        ('sophia.r@techmail.com', 'Cloud Summit Pioneer', 'Award', 'Technology', 'CLOUD20', 20),
        ('sophia.r@techmail.com', 'Hackathon Hero', 'Sparkles', 'College Events', 'HACKER15', 15),

        # Emily Watson (Gold)
        ('emily.watson@outlook.com', 'Carnatic & Symphony Virtuoso', 'Music', 'Concerts', 'SYMPHONY15', 15),
        ('emily.watson@outlook.com', 'Desi Soul Explorer', 'Headphones', 'Concerts', 'DESIFUN10', 10),

        # Liam O'Connor (Gold)
        ('liam.oc@gmail.com', 'Comedy Club VIP', 'Smile', 'Comedy', 'LAUGH20', 20),
        ('liam.oc@gmail.com', 'Stadium Superfan', 'Shield', 'Sports', 'FANATIC15', 15),

        # Aarav Patel (Gold)
        ('aarav.patel@workmail.io', 'Masterclass Scholar', 'BookOpen', 'Workshops', 'LEARN20', 20),
        ('aarav.patel@workmail.io', 'Code Architect', 'Code', 'Technology', 'DEVHERO10', 10),

        # Gojo Satoru
        ('abc@gmail.com', 'Cinema & Bollywood Buff', 'Film', 'Movies', 'CINEMA10', 10),
        ('abc@gmail.com', 'Rising Star Member', 'Sparkles', 'Loyalty', 'RISING15', 15),

        # Jessica Taylor
        ('jessica.t@gmail.com', 'Indie Cinema Aficionado', 'Film', 'Movies', 'INDIE10', 10),

        # Daniel Park
        ('daniel.park@university.edu', 'Campus Fest Captain', 'GraduationCap', 'College Events', 'CAMPUS10', 10),

        # Maya Lin
        ('maya.lin@designhub.io', 'Creative Arts Fellow', 'Palette', 'Workshops', 'CREATE15', 15),

        # Admin System
        ('admin@123', 'Platform Founder & Architect', 'Crown', 'Administration', 'ADMINMASTER50', 50)
    ]

    for email, b_name, b_icon, b_cat, coupon, disc in badges_spec:
        uid = user_map.get(email)
        if uid:
            cur.execute(
                "SELECT badge_id FROM user_rewards_badges WHERE user_id = %s AND badge_name = %s",
                (uid, b_name)
            )
            if not cur.fetchone():
                cur.execute(
                    """
                    INSERT INTO user_rewards_badges (user_id, badge_name, badge_icon, category, coupon_code, discount_percent)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (uid, b_name, b_icon, b_cat, coupon, disc)
                )
    conn.commit()
    cur.execute("SELECT COUNT(*) as count FROM user_rewards_badges")
    print(f"  -> Total Badges & Reward Coupons: {cur.fetchone()['count']}")

    # -------------------------------------------------------------
    # FINAL RECAP & VERIFICATION
    # -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("ALL 16 TABLES POPULATED WITH RUPEES PRICING ACROSS INDIA:")
    print("=" * 60)
    cur.execute("SHOW TABLES")
    all_tbls = [list(r.values())[0] for r in cur.fetchall()]
    for t in sorted(all_tbls):
        cur.execute(f"SELECT COUNT(*) as c FROM {t}")
        cnt = cur.fetchone()['c']
        print(f"  [OK] {t:<25} : {cnt} rows")

    cur.close()
    conn.close()
    print("\nDone!")

if __name__ == '__main__':
    seed_everything()
