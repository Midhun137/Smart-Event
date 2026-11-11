import random
from datetime import datetime, date
from flask import Blueprint, jsonify, request, g
from db import execute_query, get_db_connection

arcade_bp = Blueprint('arcade', __name__)

# In-memory fallback tracking when database is unreachable
_spin_cache = {}

def ensure_arcade_tables():
    """Ensure the daily_spins audit table exists in MySQL with unique date constraint."""
    try:
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS daily_spins (
                spin_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                spin_date DATE NOT NULL,
                points_won INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_user_daily_spin (user_id, spin_date)
            )
            """,
            commit=True
        )
    except Exception:
        pass

@arcade_bp.route('/status', methods=['GET'])
def arcade_status():
    ensure_arcade_tables()
    user = getattr(g, 'user', None)
    user_id = user['user_id'] if user else request.args.get('user_id', 1, type=int)

    today = date.today().isoformat()
    last_spin = None
    has_spun_today = False

    try:
        last_spin = execute_query(
            "SELECT spin_id, spin_date, points_won, created_at FROM daily_spins WHERE user_id = %s AND spin_date = CURRENT_DATE()",
            (user_id,),
            fetchone=True
        )
        if last_spin:
            has_spun_today = True
            if last_spin.get('spin_date'):
                last_spin['spin_date'] = str(last_spin['spin_date'])
            if last_spin.get('created_at'):
                last_spin['created_at'] = str(last_spin['created_at'])
    except Exception:
        # Fallback to in-memory cache
        if user_id in _spin_cache and _spin_cache[user_id]['date'] == today:
            has_spun_today = True
            last_spin = _spin_cache[user_id]

    return jsonify({
        "status": "online",
        "title": "SmartEvent Arcade & Gamification Hub",
        "can_spin": not has_spun_today,
        "has_spun_today": has_spun_today,
        "last_spin": last_spin,
        "user_id": user_id,
        "message": "Daily spin already claimed for today! Next spin unlocks tomorrow at 00:00." if has_spun_today else "Daily spin ready! Spin now to win points."
    }), 200

@arcade_bp.route('/spin', methods=['POST'])
def spin_wheel():
    ensure_arcade_tables()
    data = request.json or {}
    user = getattr(g, 'user', None)
    user_id = user['user_id'] if user else data.get('user_id', 1)

    today = date.today().isoformat()
    rewards = [25, 50, 100, 150, 200, 500]
    points = random.choice(rewards)

    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        conn.autocommit = False

        # Check if user has already spun today with row lock
        cur.execute(
            "SELECT spin_id, points_won FROM daily_spins WHERE user_id = %s AND spin_date = CURRENT_DATE() FOR UPDATE",
            (user_id,)
        )
        existing = cur.fetchone()

        if existing:
            conn.rollback()
            cur.close()
            conn.close()
            return jsonify({
                "can_spin": False,
                "already_spun": True,
                "error": "You have already completed your Daily Spin today! Next spin available tomorrow.",
                "points_won_today": existing['points_won']
            }), 429

        # Record daily spin in database
        cur.execute(
            """
            INSERT INTO daily_spins (user_id, spin_date, points_won)
            VALUES (%s, CURRENT_DATE(), %s)
            """,
            (user_id, points)
        )

        # Credit points to user account
        cur.execute(
            "UPDATE users SET reward_points = reward_points + %s WHERE user_id = %s",
            (points, user_id)
        )

        # Fetch updated points
        cur.execute("SELECT reward_points FROM users WHERE user_id = %s", (user_id,))
        u = cur.fetchone()
        updated_points = u['reward_points'] if u else 100

        conn.commit()
        cur.close()
        conn.close()

        # Update cache
        _spin_cache[user_id] = {"date": today, "points_won": points}

        return jsonify({
            "can_spin": False,
            "already_spun": True,
            "points_won": points,
            "total_points": updated_points,
            "message": f"Congratulations! You won +{points} SmartEvent reward points! Points credited to your database profile."
        }), 200

    except Exception as e:
        # Check duplicate entry error (MySQL error 1062)
        if "Duplicate entry" in str(e) or "1062" in str(e):
            return jsonify({
                "can_spin": False,
                "already_spun": True,
                "error": "Daily Spin has already been claimed for today."
            }), 429

        # In-memory fallback if database connection failed
        if user_id in _spin_cache and _spin_cache[user_id]['date'] == today:
            return jsonify({
                "can_spin": False,
                "already_spun": True,
                "error": "You have already completed your Daily Spin today! Next spin available tomorrow.",
                "points_won_today": _spin_cache[user_id]['points_won']
            }), 429

        _spin_cache[user_id] = {"date": today, "points_won": points}
        return jsonify({
            "can_spin": False,
            "already_spun": True,
            "points_won": points,
            "total_points": 750,
            "message": f"Congratulations! You won +{points} SmartEvent reward points!"
        }), 200
