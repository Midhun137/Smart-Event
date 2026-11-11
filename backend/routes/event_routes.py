from flask import Blueprint, request, jsonify
from db import execute_query, get_db_connection

event_bp = Blueprint('events', __name__)

@event_bp.route('/', methods=['GET'])
def get_events():
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    location = request.args.get('location', '')
    max_price = request.args.get('max_price', type=float)

    query = """
        SELECT 
            e.event_id, e.title, e.description, e.start_time, e.end_time, e.banner_url, e.status,
            c.name AS category_name, c.icon AS category_icon,
            v.name AS venue_name, v.city AS venue_city, v.address AS venue_address,
            COALESCE(MIN(t.base_price), 499.00) AS min_price, 
            COALESCE(MAX(t.base_price), 2499.00) AS max_price,
            COALESCE(SUM(t.available_quantity), 40) AS total_tickets_available
        FROM events e
        JOIN event_categories c ON e.category_id = c.category_id
        JOIN venues v ON e.venue_id = v.venue_id
        LEFT JOIN event_ticket_types t ON e.event_id = t.event_id
        WHERE e.status = 'published'
    """
    params = []

    if search:
        query += " AND (e.title LIKE %s OR e.description LIKE %s)"
        params.extend([f"%{search}%", f"%{search}%"])
    if category and category.lower() != 'all':
        query += " AND c.name LIKE %s"
        params.append(f"%{category}%")
    if location:
        query += " AND (v.city LIKE %s OR v.address LIKE %s)"
        params.extend([f"%{location}%", f"%{location}%"])

    query += " GROUP BY e.event_id, e.title, e.description, e.start_time, e.end_time, e.banner_url, e.status, c.name, c.icon, v.name, v.city, v.address"

    if max_price:
        query += " HAVING COALESCE(MIN(t.base_price), 0) <= %s"
        params.append(max_price)

    query += " ORDER BY e.start_time ASC"

    try:
        events = execute_query(query, tuple(params))
        # Format dates nicely for json response
        for ev in events:
            if ev.get('start_time'):
                ev['start_time'] = str(ev['start_time'])
            if ev.get('end_time'):
                ev['end_time'] = str(ev['end_time'])
            if ev.get('min_price') is not None:
                ev['min_price'] = float(ev['min_price'])
            if ev.get('max_price') is not None:
                ev['max_price'] = float(ev['max_price'])
        return jsonify({"events": events}), 200
    except Exception as e:
        return jsonify({"error": str(e), "events": []}), 500

@event_bp.route('/<int:event_id>', methods=['GET'])
def get_event_detail(event_id):
    event = execute_query(
        """
        SELECT e.*, c.name AS category_name, c.icon AS category_icon,
               v.name AS venue_name, v.address AS venue_address, v.city AS venue_city, v.gate_info
        FROM events e
        JOIN event_categories c ON e.category_id = c.category_id
        JOIN venues v ON e.venue_id = v.venue_id
        WHERE e.event_id = %s
        """,
        (event_id,),
        fetchone=True
    )
    if not event:
        return jsonify({"error": "Event not found"}), 404

    if event.get('start_time'):
        event['start_time'] = str(event['start_time'])
    if event.get('end_time'):
        event['end_time'] = str(event['end_time'])

    ticket_types = execute_query(
        "SELECT * FROM event_ticket_types WHERE event_id = %s ORDER BY base_price DESC",
        (event_id,)
    )
    for tt in ticket_types:
        if tt.get('base_price') is not None:
            tt['base_price'] = float(tt['base_price'])

    # Release expired temporary holds back to AVAILABLE
    try:
        execute_query(
            "UPDATE event_seats SET status = 'AVAILABLE', locked_until = NULL WHERE event_id = %s AND status = 'HELD' AND locked_until IS NOT NULL AND locked_until < CURRENT_TIMESTAMP",
            (event_id,),
            commit=True
        )
    except Exception:
        pass

    seats = execute_query(
        """
        SELECT es.event_seat_id, es.price, es.status,
               s.seat_id, s.section, s.row_label, s.seat_number, s.price_multiplier,
               COALESCE(t.name, 'General Admission') AS ticket_type_name
        FROM event_seats es
        JOIN seats s ON es.seat_id = s.seat_id
        LEFT JOIN event_ticket_types t ON es.ticket_type_id = t.ticket_type_id
        WHERE es.event_id = %s
        ORDER BY s.row_label, s.seat_number
        """,
        (event_id,)
    )
    for s in seats:
        if s.get('price') is not None:
            s['price'] = float(s['price'])
        if s.get('price_multiplier') is not None:
            s['price_multiplier'] = float(s['price_multiplier'])

    # Safe crowd insight
    try:
        crowd_insight = execute_query(
            "SELECT * FROM v_crowd_management_insights WHERE event_id = %s",
            (event_id,),
            fetchone=True
        )
    except Exception:
        total_seats = len(seats) if seats else 40
        booked_cnt = sum(1 for s in seats if s.get('status') == 'BOOKED') if seats else 0
        crowd_insight = {
            "event_id": event_id,
            "total_capacity": total_seats,
            "seats_sold": booked_cnt,
            "occupancy_rate": round((booked_cnt / total_seats * 100), 1) if total_seats > 0 else 0,
            "gate_status": "Gate B - Normal Entry Flow",
            "peak_gate": "Gate A (Main Concourse)"
        }

    return jsonify({
        "event": event,
        "ticket_types": ticket_types,
        "seats": seats,
        "crowd_insight": crowd_insight
    }), 200

@event_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = execute_query("SELECT * FROM event_categories ORDER BY name")
    return jsonify({"categories": categories}), 200

@event_bp.route('/venues', methods=['GET'])
def get_venues():
    venues = execute_query("SELECT * FROM venues ORDER BY name")
    return jsonify({"venues": venues}), 200

@event_bp.route('/', methods=['POST'])
def create_event():
    data = request.json or {}
    title = data.get('title')
    description = data.get('description', '')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    banner_url = data.get('banner_url') or 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'
    
    # Location details
    venue_id = data.get('venue_id')
    venue_name = data.get('venue_name', '').strip()
    venue_city = data.get('venue_city', '').strip()
    venue_address = data.get('venue_address', '').strip()
    venue_capacity = int(data.get('venue_capacity') or 500)

    # Category details
    category_id = data.get('category_id')
    category_name = data.get('category_name', '').strip()

    # Price details
    vip_price = float(data.get('vip_price') or 1999.00)
    base_price = float(data.get('base_price') or 499.00)

    if not title or not start_time:
        return jsonify({"error": "Title and start time are required"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor(dictionary=True)

        # 1. Resolve Category
        cat_id = None
        if category_id:
            cur.execute("SELECT category_id FROM event_categories WHERE category_id = %s", (category_id,))
            cat_row = cur.fetchone()
            if cat_row:
                cat_id = cat_row['category_id']
        if not cat_id and category_name:
            cur.execute("SELECT category_id FROM event_categories WHERE name = %s", (category_name,))
            cat_row = cur.fetchone()
            if cat_row:
                cat_id = cat_row['category_id']
            else:
                cur.execute("INSERT INTO event_categories (name, description, icon) VALUES (%s, %s, 'Calendar')", (category_name, f"{category_name} Events"))
                cat_id = cur.lastrowid
        if not cat_id:
            cur.execute("SELECT category_id FROM event_categories LIMIT 1")
            cat_row = cur.fetchone()
            cat_id = cat_row['category_id'] if cat_row else 1

        # 2. Resolve Venue / Location
        final_venue_id = None
        if venue_id and not venue_name:
            cur.execute("SELECT venue_id FROM venues WHERE venue_id = %s", (venue_id,))
            v_row = cur.fetchone()
            if v_row:
                final_venue_id = v_row['venue_id']

        if not final_venue_id:
            if not venue_name:
                venue_name = "Jawaharlal Nehru Indoor Stadium"
            if not venue_city:
                venue_city = "Chennai, Tamil Nadu"
            if not venue_address:
                venue_address = "Sydenhams Road, Periamet"

            # Check if matching venue exists
            cur.execute("SELECT venue_id FROM venues WHERE name = %s AND city = %s", (venue_name, venue_city))
            v_row = cur.fetchone()
            if v_row:
                final_venue_id = v_row['venue_id']
            else:
                cur.execute(
                    "INSERT INTO venues (name, address, city, total_capacity) VALUES (%s, %s, %s, %s)",
                    (venue_name, venue_address, venue_city, venue_capacity)
                )
                final_venue_id = cur.lastrowid

        # 3. Ensure Organizer
        cur.execute("SELECT organizer_id FROM organizers LIMIT 1")
        org_row = cur.fetchone()
        if org_row:
            org_id = org_row['organizer_id']
        else:
            cur.execute("INSERT IGNORE INTO users (full_name, email, password_hash, role) VALUES ('System Admin', 'admin@123', 'hash_sqlproject', 'admin')")
            cur.execute("SELECT user_id FROM users WHERE email = 'admin@123'")
            u = cur.fetchone()
            cur.execute("INSERT INTO organizers (user_id, organization_name, contact_email) VALUES (%s, 'SmartEvent Admin Corp', 'admin@123')", (u['user_id'],))
            org_id = cur.lastrowid

        # 4. Insert Event
        cur.execute(
            """
            INSERT INTO events (organizer_id, category_id, venue_id, title, description, start_time, end_time, banner_url, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'published')
            """,
            (org_id, cat_id, final_venue_id, title, description, start_time, end_time or start_time, banner_url)
        )
        new_event_id = cur.lastrowid

        # 5. Insert Ticket Types
        cur.execute(
            """
            INSERT INTO event_ticket_types (event_id, name, base_price, total_quantity, available_quantity)
            VALUES (%s, 'VIP Pass', %s, 16, 16), (%s, 'General Admission', %s, 24, 24)
            """,
            (new_event_id, vip_price, new_event_id, base_price)
        )
        
        cur.execute("SELECT ticket_type_id, name FROM event_ticket_types WHERE event_id = %s", (new_event_id,))
        tt_rows = cur.fetchall()
        vip_tt = next((t['ticket_type_id'] for t in tt_rows if 'VIP' in t['name']), None)
        gen_tt = next((t['ticket_type_id'] for t in tt_rows if 'VIP' not in t['name']), None)

        # 6. Ensure Venue Seats exist (Rows A-E, 8 seats per row = 40 seats)
        cur.execute("SELECT COUNT(*) as count FROM seats WHERE venue_id = %s", (final_venue_id,))
        seats_count = cur.fetchone()['count']
        if seats_count == 0:
            for r_label in ['A', 'B', 'C', 'D', 'E']:
                section = 'VIP' if r_label in ['A', 'B'] else 'Regular'
                mult = 1.5 if section == 'VIP' else 1.0
                for s_num in range(1, 9):
                    cur.execute(
                        "INSERT INTO seats (venue_id, section, row_label, seat_number, price_multiplier) VALUES (%s, %s, %s, %s, %s)",
                        (final_venue_id, section, r_label, s_num, mult)
                    )

        # 7. Generate Event Seats in database with status 'AVAILABLE'
        cur.execute("SELECT seat_id, section, row_label, seat_number FROM seats WHERE venue_id = %s", (final_venue_id,))
        v_seats = cur.fetchall()
        for s in v_seats:
            is_vip = (s['section'] == 'VIP')
            seat_price = vip_price if is_vip else base_price
            tt_id = vip_tt if is_vip else gen_tt
            cur.execute(
                """
                INSERT INTO event_seats (event_id, seat_id, ticket_type_id, price, status)
                VALUES (%s, %s, %s, %s, 'AVAILABLE')
                """,
                (new_event_id, s['seat_id'], tt_id, seat_price)
            )

        conn.commit()

        # Fetch created event with venue details
        cur.execute(
            """
            SELECT e.*, v.name as venue_name, v.city as venue_city, v.address as venue_address,
                   c.name as category_name
            FROM events e
            JOIN venues v ON e.venue_id = v.venue_id
            JOIN event_categories c ON e.category_id = c.category_id
            WHERE e.event_id = %s
            """,
            (new_event_id,)
        )
        created_event = cur.fetchone()
        if created_event:
            created_event['start_time'] = str(created_event['start_time'])
            created_event['end_time'] = str(created_event['end_time'])

        return jsonify({
            "message": "Event successfully created with location, price tiers, and seating layout!",
            "event": created_event,
            "total_seats_generated": len(v_seats)
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to create event: {str(e)}"}), 400
    finally:
        cur.close()
        conn.close()
