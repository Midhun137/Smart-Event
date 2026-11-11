"""
Repeatable seed script for SmartEvent Movies & Concerts Catalogue
Seeds:
- Movies: Ramayana, Avengers: Doomsday, Dune 3
- Concerts: Anirudh Ravichander, Sai Abhyankkar, A. R. Rahman

Clearly labelled demonstration data for upcoming unverified releases & showcases.
Idempotent and safe to run multiple times.
"""

import mysql.connector
from config import Config

def seed_catalogue():
    print("Connecting to MySQL database...")
    conn = mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        port=Config.DB_PORT,
        autocommit=True
    )
    cur = conn.cursor(dictionary=True)

    # 1. Ensure Categories exist
    categories = [
        ('Movies', 'Blockbuster Cinema, 3D/IMAX Screenings & Special Premieres', 'Film'),
        ('Concerts', 'Live Music Tours, Symphony Orchestras & Stadium Shows', 'Music'),
        ('Technology', 'Developer Conferences, AI Summits & Engineering Expos', 'Cpu'),
        ('Sports', 'Championships, Tournaments & Arena Matches', 'Trophy'),
        ('Comedy', 'Stand-up Specials & Live Comedy Tours', 'Smile'),
        ('Workshops', 'Hands-on Masterclasses & Interactive Bootcamps', 'BookOpen')
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

    # 2. Ensure Venues exist
    venues = [
        ('PVR INOX Superplex & IMAX', 'Mall of Asia, High Street Concourse', 'Chennai', 320, '{"Gate 1": "Audi 1 - Laser IMAX", "Gate 2": "Audi 2 - Dolby Atmos"}'),
        ('JLN Stadium Arena', 'Periamet Concourse Road', 'Chennai', 25000, '{"Gate A": "VIP East Wing", "Gate B": "Standing Pit Entrance", "Gate C": "General Concourse"}'),
        ('Miraj Cinemas Max', 'Forum Galleria, Whitefield', 'Bengaluru', 280, '{"Gate A": "Screen 1 - 4K Dual Laser"}'),
        ('Palace Grounds Open Air', 'Bellary Road Concourse', 'Bengaluru', 30000, '{"Gate 1": "Gold & VIP Lounge", "Gate 2": "Silver Enclosure", "Gate 3": "General Entry"}'),
        ('DY Patil Stadium', 'Sector 7, Nerul', 'Mumbai', 45000, '{"Gate 1": "Diamond Deck", "Gate 2": "Platinum Pit", "Gate 3": "Grandstand North"}')
    ]
    venue_map = {}
    for name, addr, city, cap, gate in venues:
        cur.execute("SELECT venue_id FROM venues WHERE name = %s", (name,))
        row = cur.fetchone()
        if row:
            venue_id = row['venue_id']
        else:
            cur.execute(
                "INSERT INTO venues (name, address, city, total_capacity, gate_info) VALUES (%s, %s, %s, %s, %s)",
                (name, addr, city, cap, gate)
            )
            venue_id = cur.lastrowid
        venue_map[name] = venue_id

    # 3. Ensure an Organizer exists
    cur.execute("SELECT organizer_id FROM organizers LIMIT 1")
    org_row = cur.fetchone()
    if org_row:
        organizer_id = org_row['organizer_id']
    else:
        # Create default organizer user if none exists
        cur.execute("SELECT user_id FROM users WHERE email = 'organizer@smartevent.io'")
        user_row = cur.fetchone()
        if not user_row:
            cur.execute(
                "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                ('SmartEvent Official Curator', 'organizer@smartevent.io', 'pbkdf2:sha256:600000$hash$organizer123', 'organizer')
            )
            org_user_id = cur.lastrowid
        else:
            org_user_id = user_row['user_id']
        cur.execute(
            "INSERT INTO organizers (user_id, organization_name, contact_email, phone, verified) VALUES (%s, %s, %s, %s, TRUE)",
            (org_user_id, 'SmartEvent Premier Productions', 'productions@smartevent.io', '+91-9876543210')
        )
        organizer_id = cur.lastrowid

    # Get category IDs
    cur.execute("SELECT category_id, name FROM event_categories")
    cat_rows = cur.fetchall()
    cat_map = {row['name']: row['category_id'] for row in cat_rows}

    # 4. Catalogue entries to seed
    catalogue = [
        # Movies
        {
            "title": "Ramayana",
            "category": "Movies",
            "venue": "PVR INOX Superplex & IMAX",
            "description": "[SmartEvent demo: Projected release showcase. Verified schedule to be announced by producers]. Nitesh Tiwari's epic mythological magnum opus chronicling the eternal triumph of righteousness, starring Ranbir Kapoor and Sai Pallavi with state-of-the-art VFX.",
            "banner_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
            "start_time": "2026-11-20 18:30:00",
            "end_time": "2026-11-20 21:45:00",
            "ticket_types": [
                ("IMAX Recliner VIP", 750.00, 30),
                ("Prime Laser 3D", 450.00, 60),
                ("Standard Classic", 280.00, 90)
            ],
            "is_movie": True
        },
        {
            "title": "Avengers: Doomsday",
            "category": "Movies",
            "venue": "Miraj Cinemas Max",
            "description": "[SmartEvent demo: Projected release showcase. Official ticketing opening subject to Marvel Studios]. Earth's mightiest heroes face their supreme multiversal challenge as Robert Downey Jr. returns as Doctor Doom in this climactic MCU chapter.",
            "banner_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
            "start_time": "2026-12-05 19:15:00",
            "end_time": "2026-12-05 22:30:00",
            "ticket_types": [
                ("IMAX 3D Laser VIP", 850.00, 40),
                ("Dolby Atmos Prime", 550.00, 80),
                ("Standard Screen", 320.00, 100)
            ],
            "is_movie": True
        },
        {
            "title": "Dune 3",
            "category": "Movies",
            "venue": "PVR INOX Superplex & IMAX",
            "description": "[SmartEvent demo: Projected release showcase. Pre-registration & demonstration seating layout]. Denis Villeneuve concludes the Arrakis trilogy adapting Dune Messiah. Witness Paul Atreides' galactic war and the fate of the Fremen.",
            "banner_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
            "start_time": "2026-12-18 20:00:00",
            "end_time": "2026-12-18 23:15:00",
            "ticket_types": [
                ("IMAX Grand Recliner", 800.00, 30),
                ("Executive 4K Atmos", 500.00, 70),
                ("Regular Auditorium", 300.00, 90)
            ],
            "is_movie": True
        },
        # Concerts
        {
            "title": "Anirudh Ravichander — Hukum World Tour",
            "category": "Concerts",
            "venue": "JLN Stadium Arena",
            "description": "[SmartEvent demo: Demonstration tour showcase. Subject to promoter confirmation]. The Rockstar Anirudh live in high-octane concert with 360-degree surround sound, fireworks, and viral anthems like Badass, Hukum, and Leo Das.",
            "banner_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
            "start_time": "2026-11-28 18:00:00",
            "end_time": "2026-11-28 23:00:00",
            "ticket_types": [
                ("Rockstar Fan Pit (Standing)", 3999.00, 200),
                ("VIP Grandstand", 2499.00, 300),
                ("Gold Seated Tier", 1499.00, 500),
                ("Silver General Admission", 799.00, 1000)
            ],
            "is_movie": False
        },
        {
            "title": "Sai Abhyankkar — Katchi Sera Live Experience",
            "category": "Concerts",
            "venue": "Palace Grounds Open Air",
            "description": "[SmartEvent demo: Demonstration tour showcase. Subject to artist management confirmation]. Sensation Sai Abhyankkar performing viral hits Katchi Sera and Aasa Kooda live with an electric 18-piece contemporary fusion band.",
            "banner_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
            "start_time": "2026-12-12 18:30:00",
            "end_time": "2026-12-12 22:30:00",
            "ticket_types": [
                ("Front Stage VIP", 1999.00, 150),
                ("Fan Zone Seated", 1299.00, 250),
                ("General Admission Standing", 599.00, 600)
            ],
            "is_movie": False
        },
        {
            "title": "A. R. Rahman — Symphony of Peace World Concert",
            "category": "Concerts",
            "venue": "DY Patil Stadium",
            "description": "[SmartEvent demo: Demonstration tour showcase. Dates and venue subject to world tour official announcement]. The Oscar & Grammy winning Maestro A. R. Rahman orchestrates a 70-piece symphonic celebration of legendary Tamil, Hindi, and Sufi classics.",
            "banner_url": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80",
            "start_time": "2026-12-25 18:00:00",
            "end_time": "2026-12-25 23:30:00",
            "ticket_types": [
                ("Maestro Diamond Lounge", 5999.00, 100),
                ("Platinum Front Tier", 3499.00, 200),
                ("Gold Grandstand", 1999.00, 400),
                ("Silver Arena", 999.00, 800)
            ],
            "is_movie": False
        }
    ]

    for item in catalogue:
        cat_id = cat_map.get(item['category'])
        ven_id = venue_map.get(item['venue'])
        if not cat_id or not ven_id:
            print(f"Skipping {item['title']}: missing category or venue")
            continue

        # Check if event already exists
        cur.execute("SELECT event_id FROM events WHERE title = %s", (item['title'],))
        ev_row = cur.fetchone()
        if ev_row:
            event_id = ev_row['event_id']
            cur.execute(
                """
                UPDATE events 
                SET description=%s, start_time=%s, end_time=%s, banner_url=%s, venue_id=%s, category_id=%s, status='published'
                WHERE event_id=%s
                """,
                (item['description'], item['start_time'], item['end_time'], item['banner_url'], ven_id, cat_id, event_id)
            )
            print(f"Updated existing event: {item['title']} (ID: {event_id})")
        else:
            cur.execute(
                """
                INSERT INTO events (organizer_id, category_id, venue_id, title, description, start_time, end_time, banner_url, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'published')
                """,
                (organizer_id, cat_id, ven_id, item['title'], item['description'], item['start_time'], item['end_time'], item['banner_url'])
            )
            event_id = cur.lastrowid
            print(f"Created new event: {item['title']} (ID: {event_id})")

        # Create or update Ticket Types
        tt_map = {}
        for tt_name, base_price, qty in item['ticket_types']:
            cur.execute("SELECT ticket_type_id FROM event_ticket_types WHERE event_id=%s AND name=%s", (event_id, tt_name))
            tt_row = cur.fetchone()
            if tt_row:
                tt_id = tt_row['ticket_type_id']
                cur.execute(
                    "UPDATE event_ticket_types SET base_price=%s, total_quantity=%s, available_quantity=%s WHERE ticket_type_id=%s",
                    (base_price, qty, qty, tt_id)
                )
            else:
                cur.execute(
                    "INSERT INTO event_ticket_types (event_id, name, base_price, total_quantity, available_quantity) VALUES (%s, %s, %s, %s, %s)",
                    (event_id, tt_name, base_price, qty, qty)
                )
                tt_id = cur.lastrowid
            tt_map[tt_name] = (tt_id, base_price)

        # Ensure venue has seats
        cur.execute("SELECT COUNT(*) AS cnt FROM seats WHERE venue_id=%s", (ven_id,))
        s_cnt = cur.fetchone()['cnt']
        if s_cnt < 30:
            # Generate representative auditorium rows: A (VIP), B (Executive), C (Premium), D (Regular), E (Regular)
            sections = [
                ('A', 'VIP', 1.5, 8),
                ('B', 'Executive', 1.3, 8),
                ('C', 'Premium', 1.1, 8),
                ('D', 'Regular', 1.0, 8),
                ('E', 'Regular', 1.0, 8)
            ]
            for row_label, sec_name, mult, num_seats in sections:
                for s_num in range(1, num_seats + 1):
                    cur.execute(
                        """
                        INSERT INTO seats (venue_id, section, row_label, seat_number, price_multiplier)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (ven_id, sec_name, row_label, s_num, mult)
                    )

        # Map venue seats to event_seats
        cur.execute("SELECT COUNT(*) AS cnt FROM event_seats WHERE event_id=%s", (event_id,))
        es_cnt = cur.fetchone()['cnt']
        if es_cnt < 20:
            cur.execute("SELECT seat_id, section, row_label, seat_number, price_multiplier FROM seats WHERE venue_id=%s ORDER BY row_label, seat_number", (ven_id,))
            seats = cur.fetchall()

            # Pick default ticket type
            default_tt_id = list(tt_map.values())[0][0]
            default_base_price = list(tt_map.values())[0][1]

            for s in seats:
                # Match section to ticket type if possible
                tt_id = default_tt_id
                price = default_base_price * float(s['price_multiplier'])
                for name, (t_id, bp) in tt_map.items():
                    if s['section'].lower() in name.lower():
                        tt_id = t_id
                        price = bp * float(s['price_multiplier'])
                        break

                cur.execute(
                    """
                    INSERT INTO event_seats (event_id, seat_id, ticket_type_id, price, status)
                    VALUES (%s, %s, %s, %s, 'AVAILABLE')
                    """,
                    (event_id, s['seat_id'], tt_id, price)
                )

    print("\n[SUCCESS] Seeded all requested Movies & Concerts catalogue entries successfully!")
    cur.close()
    conn.close()

if __name__ == '__main__':
    seed_catalogue()

