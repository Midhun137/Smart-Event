from flask import Blueprint, request, jsonify
from db import execute_query, get_db_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    full_name = data.get('full_name') or data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')

    if not full_name or not email or not password:
        return jsonify({"error": "Full name, email, and password are required"}), 400

    try:
        # Check if email exists
        existing_user = execute_query("SELECT user_id FROM users WHERE email = %s", (email,), fetchone=True)
        if existing_user:
            return jsonify({"error": "An account with this email already exists."}), 400

        # Simple password hashing check
        execute_query(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            (full_name, email, f"hash_{password}", role),
            commit=True
        )
        
        # Get the inserted user
        user = execute_query(
            "SELECT user_id, full_name, email, role, reward_points, loyalty_level FROM users WHERE email = %s",
            (email,),
            fetchone=True
        )
        
        # Create default preferences
        execute_query(
            "INSERT IGNORE INTO user_preferences (user_id) VALUES (%s)",
            (user['user_id'],),
            commit=True
        )

        return jsonify({"message": "Registration successful", "user": user}), 201
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')

    user = execute_query(
        "SELECT user_id, full_name, email, password_hash, role, reward_points, loyalty_level FROM users WHERE email = %s",
        (email,),
        fetchone=True
    )

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if user['password_hash'] != f"hash_{password}":
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "user_id": user['user_id'],
            "full_name": user['full_name'],
            "email": user['email'],
            "role": user['role'],
            "reward_points": user['reward_points'],
            "loyalty_level": user['loyalty_level']
        }
    }), 200

@auth_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    user = execute_query(
        "SELECT user_id, full_name, email, role, reward_points, loyalty_level, created_at FROM users WHERE user_id = %s",
        (user_id,),
        fetchone=True
    )
    prefs = execute_query(
        "SELECT preferred_categories, max_budget, preferred_location, preferred_event_type FROM user_preferences WHERE user_id = %s",
        (user_id,),
        fetchone=True
    )
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user, "preferences": prefs or {}}), 200

@auth_bp.route('/preferences/<int:user_id>', methods=['PUT'])
def update_preferences(user_id):
    data = request.json or {}
    preferred_categories = data.get('preferred_categories', 'Tech,Music,Gaming')
    max_budget = data.get('max_budget', 3500.00)
    preferred_location = data.get('preferred_location', 'Chennai, Tamil Nadu')
    preferred_event_type = data.get('preferred_event_type', 'In-Person')

    try:
        execute_query(
            """
            INSERT INTO user_preferences (user_id, preferred_categories, max_budget, preferred_location, preferred_event_type)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            preferred_categories = VALUES(preferred_categories),
            max_budget = VALUES(max_budget),
            preferred_location = VALUES(preferred_location),
            preferred_event_type = VALUES(preferred_event_type)
            """,
            (user_id, preferred_categories, max_budget, preferred_location, preferred_event_type),
            commit=True
        )
        return jsonify({"message": "Preferences updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
