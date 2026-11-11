from flask import Blueprint, request, jsonify
from db import execute_query

rec_bp = Blueprint('recommendations', __name__)

@rec_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_recommendations(user_id):
    try:
        # Fetch user preferences
        prefs = execute_query(
            "SELECT preferred_categories, max_budget, preferred_location FROM user_preferences WHERE user_id = %s",
            (user_id,),
            fetchone=True
        ) or {}

        pref_cats = [c.strip().lower() for c in (prefs.get('preferred_categories') or '').split(',') if c.strip()]
        max_budget = float(prefs.get('max_budget') or 5000.0)
        pref_loc = (prefs.get('preferred_location') or '').lower()

        # Query events with category and venue details
        events = execute_query(
            """
            SELECT e.event_id, e.title, e.description, e.start_time, e.end_time, e.banner_url,
                   c.name AS category_name, v.name AS venue_name, v.city AS venue_city,
                   COALESCE(MIN(t.base_price), 499.00) AS min_price
            FROM events e
            JOIN event_categories c ON e.category_id = c.category_id
            JOIN venues v ON e.venue_id = v.venue_id
            LEFT JOIN event_ticket_types t ON e.event_id = t.event_id
            WHERE e.status = 'published'
            GROUP BY e.event_id, e.title, e.description, e.start_time, e.end_time, e.banner_url, c.name, v.name, v.city
            ORDER BY e.start_time ASC
            """
        ) or []

        # Calculate compatibility score for each event (MySQL-safe algorithm)
        for ev in events:
            score = 50  # Base score
            cat = (ev.get('category_name') or '').lower()
            city = (ev.get('venue_city') or '').lower()
            min_price = float(ev.get('min_price') or 0)

            # Category match (+25 points)
            if any(pc in cat for pc in pref_cats):
                score += 25

            # Budget fit (+15 points)
            if min_price > 0 and min_price <= max_budget:
                score += 15

            # Location proximity (+10 points)
            if pref_loc and (city in pref_loc or pref_loc in city):
                score += 10

            ev['compatibility_score'] = min(100, score)
            if ev.get('start_time'):
                ev['start_time'] = str(ev['start_time'])
            if ev.get('end_time'):
                ev['end_time'] = str(ev['end_time'])
            if ev.get('min_price') is not None:
                ev['min_price'] = float(ev['min_price'])

        # Sort by compatibility score descending
        events.sort(key=lambda x: x.get('compatibility_score', 0), reverse=True)

        return jsonify({
            "user_id": user_id,
            "user_preferences": prefs,
            "recommendations": events
        }), 200
    except Exception as e:
        return jsonify({"error": str(e), "recommendations": []}), 500

@rec_bp.route('/group-seats', methods=['POST'])
def recommend_group_seats():
    data = request.json or {}
    event_id = data.get('event_id', 1)
    group_size = int(data.get('group_size', 2))
    section = data.get('section', 'Executive')

    try:
        # MySQL-native group seat recommendation query
        seats = execute_query(
            """
            SELECT es.event_seat_id, s.seat_id, s.section, s.row_label, s.seat_number, es.price
            FROM event_seats es
            JOIN seats s ON es.seat_id = s.seat_id
            WHERE es.event_id = %s AND es.status = 'AVAILABLE' AND s.section = %s
            ORDER BY s.row_label, s.seat_number
            LIMIT %s
            """,
            (event_id, section, group_size)
        ) or []

        total_price = sum([float(s['price']) for s in seats]) if seats else 0.0

        return jsonify({
            "event_id": event_id,
            "group_size": group_size,
            "preferred_section": section,
            "total_estimated_price": total_price,
            "recommended_seats": seats
        }), 200
    except Exception as e:
        return jsonify({"error": str(e), "recommended_seats": []}), 500
