from flask import Flask
from app.config import Config
from app.game.constants import *

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    @app.context_processor
    def inject_constants():
        return dict(
            UP=UP, DOWN=DOWN, LEFT=LEFT, RIGHT=RIGHT,
            CAVE=CAVE, PIT=PIT, WUMPUS=WUMPUS, PLAYER=PLAYER,
            ULDRTUNNEL=ULDRTUNNEL, URDLTUNNEL=URDLTUNNEL,
            BLOOD=BLOOD, SLIME=SLIME, BAT=BAT)

    from app.routes.game import game_bp
    from app.routes.auth import auth_bp
    from app.routes.leaderboard import leaderboard_bp
    from app.routes.debug import debug_bp
    app.register_blueprint(game_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(leaderboard_bp, url_prefix='/leaderboard')
    app.register_blueprint(debug_bp, url_prefix='/debug')

    with app.app_context():
        try:
            from app.db import init_db
            init_db()
        except Exception:
            pass  # DB unavailable (no .env configured yet)

    return app
