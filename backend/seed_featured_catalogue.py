"""Add six clearly labelled demo listings without changing existing bookings.
Run from backend: python seed_featured_catalogue.py
"""
from datetime import datetime, timedelta
from db import get_db_connection

CATALOGUE = [
    ('Ramayana', 'Movies', 'ramayana', 299, 599),
    ('Avengers: Doomsday', 'Movies', 'avengers-doomsday', 349, 699),
    ('Dune 3', 'Movies', 'dune-3', 299, 599),
    ('Anirudh Ravichander Live', 'Concerts', 'anirudh', 1499, 2999),
    ('Sai Abhyankkar Live', 'Concerts', 'sai-abhyankkar', 999, 1999),
    ('A. R. Rahman Live', 'Concerts', 'ar-rahman', 1999, 3999),
]

def seed():
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT GET_LOCK('smartevent_featured_seed', 10) AS acquired")
        if cur.fetchone()['acquired'] != 1:
            raise RuntimeError('Another catalogue seed is running')
        created = 0
        for offset, (title, category, slug, regular, vip) in enumerate(CATALOGUE):
            marker = f'[SmartEvent demo:{slug}]'
            cur.execute('SELECT event_id FROM events WHERE description LIKE %s', (marker + '%',))
            if cur.fetchone():
                continue
            cur.execute('SELECT category_id FROM event_categories WHERE name = %s', (category,))
            cat = cur.fetchone()
            if cat:
                category_id = cat['category_id']
            else:
                cur.execute('INSERT INTO event_categories (name, description, icon) VALUES (%s,%s,%s)', (category, category + ' catalogue', 'Film' if category == 'Movies' else 'Music'))
                category_id = cur.lastrowid
            venue_name = 'SmartEvent Demo Cinema' if category == 'Movies' else 'SmartEvent Demo Concert Hall'
            cur.execute('SELECT venue_id FROM venues WHERE name = %s', (venue_name,))
            venue = cur.fetchone()
            if venue:
                venue_id = venue['venue_id']
            else:
                cur.execute('INSERT INTO venues (name, address, city, total_capacity) VALUES (%s,%s,%s,48)', (venue_name, 'Illustrative venue - not a real event location', 'Chennai'))
                venue_id = cur.lastrowid
                for row in 'ABCDEF':
                    for number in range(1,9):
                        cur.execute('INSERT INTO seats (venue_id, section, row_label, seat_number, price_multiplier) VALUES (%s,%s,%s,%s,1)', (venue_id, 'VIP' if row in 'EF' else 'Regular', row, number))
            start = (datetime.now() + timedelta(days=30 + offset * 2)).replace(hour=18, minute=30, second=0, microsecond=0)
            description = marker + ' Demonstration listing only. Date, venue and prices are sample data, not an official release or concert announcement. Explore the 3D seating experience; no real payment is collected.'
            cur.execute('INSERT INTO events (category_id, venue_id, title, description, start_time, end_time, banner_url, status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)', (category_id, venue_id, title, description, start, start + timedelta(hours=3), '/posters/' + slug + '.svg', 'published'))
            event_id = cur.lastrowid
            cur.execute('SELECT seat_id, section FROM seats WHERE venue_id=%s', (venue_id,))
            venue_seats = cur.fetchall()
            for section, price in [('Regular', regular), ('VIP', vip)]:
                section_seats = [s for s in venue_seats if s['section'] == section]
                count = len(section_seats)
                cur.execute('INSERT INTO event_ticket_types (event_id, name, base_price, total_quantity, available_quantity) VALUES (%s,%s,%s,%s,%s)', (event_id, section, price, count, count))
                ticket_type = cur.lastrowid
                for seat in section_seats:
                    cur.execute("INSERT INTO event_seats (event_id, seat_id, ticket_type_id, price, status) VALUES (%s,%s,%s,%s,'AVAILABLE')", (event_id, seat['seat_id'], ticket_type, price))
            created += 1
        conn.commit()
        print(f'Catalogue ready: {created} added; {len(CATALOGUE)-created} already present. Existing inventory unchanged.')
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.execute("SELECT RELEASE_LOCK('smartevent_featured_seed')")
        cur.fetchone()
        cur.close()
        conn.close()

if __name__ == '__main__':
    seed()
