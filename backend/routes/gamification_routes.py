from flask import Blueprint, request, jsonify
from db import execute_query

gamification_bp = Blueprint('gamification', __name__)

@gamification_bp.route('/quizzes/<int:event_id>', methods=['GET'])
def get_event_quizzes(event_id):
    if event_id == 0:
        quizzes = execute_query(
            "SELECT quiz_id, event_id, title, question, options_json, points_reward FROM quizzes_challenges ORDER BY quiz_id ASC"
        )
    else:
        quizzes = execute_query(
            "SELECT quiz_id, event_id, title, question, options_json, points_reward FROM quizzes_challenges WHERE event_id = %s",
            (event_id,)
        )
        if not quizzes:
            quizzes = execute_query(
                "SELECT quiz_id, event_id, title, question, options_json, points_reward FROM quizzes_challenges ORDER BY quiz_id ASC"
            )
    return jsonify({"quizzes": quizzes}), 200

@gamification_bp.route('/quizzes/submit', methods=['POST'])
def submit_quiz():
    data = request.json or {}
    user_id = data.get('user_id', 1)
    quiz_id = data.get('quiz_id')
    selected_option = data.get('selected_option')

    if quiz_id is None or selected_option is None:
        return jsonify({"error": "quiz_id and selected_option are required"}), 400

    quiz = execute_query(
        "SELECT * FROM quizzes_challenges WHERE quiz_id = %s",
        (quiz_id,),
        fetchone=True
    )

    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    is_correct = (int(selected_option) == int(quiz['correct_option']))

    if is_correct:
        reward = quiz['points_reward']
        execute_query(
            "UPDATE users SET reward_points = reward_points + %s WHERE user_id = %s",
            (reward, user_id),
            commit=True
        )
        user = execute_query(
            "SELECT user_id, reward_points, loyalty_level FROM users WHERE user_id = %s",
            (user_id,),
            fetchone=True
        )
        return jsonify({
            "correct": True,
            "message": f"Correct answer! You earned +{reward} reward points.",
            "points_earned": reward,
            "updated_points": user['reward_points'] if user else 650,
            "loyalty_level": user['loyalty_level'] if user else 'Gold'
        }), 200
    else:
        return jsonify({
            "correct": False,
            "message": "Incorrect answer. Try again!",
            "points_earned": 0
        }), 200

@gamification_bp.route('/award-points', methods=['POST'])
def award_points():
    data = request.json or {}
    user_id = data.get('user_id', 1)
    points = data.get('points', 0)
    activity_name = data.get('activity_name', 'Activity')

    if points > 0:
        execute_query(
            "UPDATE users SET reward_points = reward_points + %s WHERE user_id = %s",
            (points, user_id),
            commit=True
        )
        user = execute_query(
            "SELECT user_id, reward_points, loyalty_level FROM users WHERE user_id = %s",
            (user_id,),
            fetchone=True
        )
        return jsonify({
            "success": True,
            "message": f"Earned +{points} pts from {activity_name}!",
            "updated_points": user['reward_points'] if user else 650,
            "loyalty_level": user['loyalty_level'] if user else 'Gold'
        }), 200
    return jsonify({"success": False, "message": "No points awarded."}), 400

@gamification_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    leaderboard = execute_query(
        """
        SELECT 
            user_id,
            full_name,
            reward_points,
            loyalty_level,
            DENSE_RANK() OVER (ORDER BY reward_points DESC) AS global_rank
        FROM users
        ORDER BY reward_points DESC
        LIMIT 10
        """
    )
    return jsonify({"leaderboard": leaderboard}), 200

@gamification_bp.route('/user/<int:user_id>/badges', methods=['GET'])
def get_user_badges(user_id):
    badges = execute_query(
        "SELECT * FROM user_rewards_badges WHERE user_id = %s ORDER BY unlocked_at DESC",
        (user_id,)
    )
    return jsonify({"badges": badges}), 200

