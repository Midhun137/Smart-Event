import os
import sys

# Ensure backend directory is in Python module search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, redirect
from flask_cors import CORS

from config import Config
from routes.arcade_routes import arcade_bp
from routes.auth_routes import auth_bp
from routes.event_routes import event_bp
from routes.booking_routes import booking_bp
from routes.recommendation_routes import rec_bp
from routes.gamification_routes import gamification_bp
from routes.reward_routes import reward_bp
from routes.analytics_routes import analytics_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for React Vite and Next/CRA frontends
    allowed_origins = os.environ.get(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://localhost:4173"
    ).split(",")

    CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(event_bp, url_prefix='/api/events')
    app.register_blueprint(booking_bp, url_prefix='/api/bookings')
    app.register_blueprint(rec_bp, url_prefix='/api/recommendations')
    app.register_blueprint(gamification_bp, url_prefix='/api/gamification')
    app.register_blueprint(reward_bp, url_prefix='/api/rewards')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(arcade_bp, url_prefix='/api/arcade')

    @app.route('/', methods=['GET'])
    def root_redirect():
        return redirect('http://localhost:5173/', code=302)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "online",
            "system": "SmartEvent Intelligent Booking & Operations Engine",
            "database": "MySQL",
            "port": 5000
        }), 200

    return app

if __name__ == '__main__':
    app = create_app()
    print("=========================================================================")
    print("[SERVER RUNNING] SmartEvent Flask Backend Server running on http://127.0.0.1:5000")
    print("=========================================================================")
    app.run(host='0.0.0.0', port=5000, debug=True)
