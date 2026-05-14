from flask import Blueprint, render_template

leaderboard_bp = Blueprint('leaderboard', __name__)


@leaderboard_bp.route('/')
def index():
    entries = []
    try:
        from app.db import get_leaderboard
        entries = get_leaderboard()
    except Exception:
        pass
    return render_template('leaderboard.html', entries=entries)
