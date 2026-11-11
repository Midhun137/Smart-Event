import uuid
from flask import Blueprint, request, jsonify
from db import execute_query

reward_bp = Blueprint('rewards', __name__)

@reward_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_rewards(user_id):
    user = execute_query(
        "SELECT user_id, reward_points, loyalty_level FROM users WHERE user_id = %s",
        (user_id,),
        fetchone=True
    )
    coupons = execute_query(
        "SELECT badge_id, badge_name, badge_icon, coupon_code, discount_percent, unlocked_at FROM user_rewards_badges WHERE user_id = %s",
        (user_id,)
    )

    available_offers = [
        {"title": "15% Off Any Tech Event", "points_cost": 200, "discount_percent": 15},
        {"title": "20% Off Music Festival VIP", "points_cost": 350, "discount_percent": 20},
        {"title": "30% Off Masterclass Workshop", "points_cost": 500, "discount_percent": 30}
    ]

    return jsonify({
        "reward_points": user['reward_points'] if user else 0,
        "loyalty_level": user['loyalty_level'] if user else 'Bronze',
        "my_coupons": coupons,
        "available_offers": available_offers
    }), 200

@reward_bp.route('/redeem', methods=['POST'])
def redeem_reward():
    data = request.json or {}
    user_id = data.get('user_id', 1)
    points_cost = data.get('points_cost', 200)
    discount_percent = data.get('discount_percent', 15)
    title = data.get('title', 'Special Reward Coupon')

    user = execute_query("SELECT reward_points FROM users WHERE user_id = %s", (user_id,), fetchone=True)

    if not user or user['reward_points'] < points_cost:
        return jsonify({"error": "Insufficient reward points"}), 400

    coupon_code = f"REWARD-{uuid.uuid4().hex[:6].upper()}"

    # Deduct points
    execute_query("UPDATE users SET reward_points = reward_points - %s WHERE user_id = %s", (points_cost, user_id), commit=True)

    # Issue coupon
    execute_query(
        """
        INSERT INTO user_rewards_badges (user_id, badge_name, badge_icon, category, coupon_code, discount_percent)
        VALUES (%s, %s, 'Tag', 'Redeemed Offer', %s, %s)
        """,
        (user_id, title, coupon_code, discount_percent),
        commit=True
    )

    return jsonify({
        "message": f"Successfully redeemed! Coupon code: {coupon_code}",
        "coupon_code": coupon_code,
        "discount_percent": discount_percent,
        "remaining_points": user['reward_points'] - points_cost
    }), 200
