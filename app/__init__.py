from flask import Flask
from app.config import Config

def create_app():
    app = Flask(__name__)

    #load all the config params
    app.config.from_object(Config)

    from app.routes.game import game_bp
    from app.routes.auth import auth_bp
    from app.routes.leaderboard import leaderboard_bp
    from app.routes.debug import debug_bp
    app.register_blueprint(game_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(leaderboard_bp, url_prefix='/leaderboard')
    app.register_blueprint(debug_bp, url_prefix='/debug')

    return app