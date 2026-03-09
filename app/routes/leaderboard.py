from flask import Blueprint, jsonify

leaderboard_bp = Blueprint('leaderboard', __name__)

@leaderboard_bp.route('/')
def index():
    # Logique pour récupérer et afficher les meilleurs scores
    # En attendant, on renvoie de fausses données (mock)
    mock_data = [
        {"rank": 1, "username": "WumpusSlayer", "score": 500},
        {"rank": 2, "username": "Explorer01", "score": 350},
        {"rank": 3, "username": "Player123", "score": 100}
    ]
    return jsonify(mock_data)
