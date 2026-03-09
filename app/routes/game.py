from flask import Blueprint, request, render_template, session
from app.game.map_generator import generate_map, create_menu_map, place_player
from app.game.logic import move_player, can_move

game_bp = Blueprint('game', __name__)

@game_bp.route('/')
def index():
    return render_template('menu.html', table=create_menu_map())

@game_bp.route('/play')
def play():
    if 'game_map' not in session:
        game_map = generate_map(3)
        y, x = place_player(game_map)
        session['game_map'] = game_map
        session['y'] = y
        session['x'] = x
        session['came_from'] = None

    direction_y = request.args.get("direction_y")
    direction_x = request.args.get("direction_x")

    current_path = session['game_map'][session['y']][session['x']]['path']

    if direction_y:
        direction_y = int(direction_y)
        if can_move(current_path, session.get('came_from'), direction_y):
            came_from = "up" if direction_y == -1 else "down"
            game_map = session['game_map']
            y, x = move_player(game_map, direction_y, session['y'], session['x'], came_from)
            session['came_from'] = came_from
            session['game_map'] = game_map
            session['y'] = y
            session['x'] = x

    elif direction_x:
        direction_x = int(direction_x)
        if can_move(current_path, session.get('came_from'), direction_x):
            came_from = "right" if direction_x == -2 else "left"
            game_map = session['game_map']
            y, x = move_player(game_map, direction_x, session['y'], session['x'], came_from)
            session['came_from'] = came_from
            session['game_map'] = game_map
            session['y'] = y
            session['x'] = x

    return render_template("game.html", table=session['game_map'], came_from=session.get('came_from'))