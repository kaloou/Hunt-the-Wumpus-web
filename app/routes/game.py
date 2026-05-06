from flask import Blueprint, request, render_template, session, redirect, url_for
from app.game.map_generator import generate_map, create_menu_map, place_player
from app.game.logic import move_player, shoot_arrow, check_bat_move, move_player_express
from app.game.constants import *

game_bp = Blueprint('game', __name__)

# -------------------------
# MENU
# -------------------------
@game_bp.route('/')
def index():
    return render_template('menu.html', map=create_menu_map())

# -------------------------
# SELECT LEVEL
# -------------------------
@game_bp.route('/select_level')
def select_level():
    level = request.args.get("level", type=int)

    if level not in (EASY, NORMAL, HARD):
        return render_template("select_level.html")

    game_map = generate_map(level)
    y, x = place_player(game_map)

    session.clear()
    session['game_map'] = game_map
    session['y'] = y
    session['x'] = x
    session['came_from'] = None
    session['last_direction'] = None
    session['level'] = level
    session['blinded'] = "blindfolded" in request.args
    session['express'] = "Express" in request.args

    return redirect(url_for('game.play'))

# -------------------------
# REPLAY
# -------------------------
@game_bp.route('/replay')
def replay():
    level = session.get('level')
    blinded = session.get('blinded', False)
    express = session.get('express', False)

    if level not in (EASY, NORMAL, HARD):
        return redirect(url_for('game.index'))

    game_map = generate_map(level)
    y, x = place_player(game_map)

    session.clear()
    session['game_map'] = game_map
    session['y'] = y
    session['x'] = x
    session['came_from'] = None
    session['last_direction'] = None
    session['level'] = level
    session['blinded'] = blinded
    session['express'] = express

    return redirect(url_for('game.play'))

# -------------------------
# PLAY
# -------------------------
@game_bp.route('/play')
def play():
    if 'game_map' not in session:
        return redirect(url_for('game.index'))

    direction_y = request.args.get("direction_y", type=int)
    direction_x = request.args.get("direction_x", type=int)
    shoot = request.args.get("shoot", type=int)

    game_map = session['game_map']
    y = session['y']
    x = session['x']
    came_from = session.get('came_from')

    # ---- Mouvement
    express = session.get('express', False)
    move_func = move_player_express if express else move_player

    if direction_y is not None:
        y, x, came_from = move_func(game_map, direction_y, y, x, came_from)
        session['last_direction'] = direction_y

    elif direction_x is not None:
        y, x, came_from = move_func(game_map, direction_x, y, x, came_from)
        session['last_direction'] = direction_x

    elif shoot is not None:
        wumpus_hit = shoot_arrow(game_map, shoot, y, x, came_from)
        final_map = game_map
        session.pop('game_map', None)
        session['final_map'] = final_map
        if wumpus_hit:
            session['win'] = True
            return redirect(url_for("game.win"))
        else:
            return redirect(url_for("game.game_over", cause="shoot"))

    # BAT CHECK
    y, x = check_bat_move(game_map, y, x)

    cell = game_map[y][x]

    if cell["path"] == PIT:
        session['final_map'] = game_map
        session.pop('game_map', None)
        return redirect(url_for("game.game_over", cause="pit"))

    elif WUMPUS in cell["entities"]:
        session['final_map'] = game_map
        session.pop('game_map', None)
        return redirect(url_for("game.game_over", cause="wumpus"))

    session['game_map'] = game_map
    session['y'] = y
    session['x'] = x
    session['came_from'] = came_from

    return render_template("game.html", map=game_map, came_from=came_from , blinded=session.get('blinded', False))
# -------------------------
# GAME OVER
# -------------------------
@game_bp.route('/game_over')
def game_over():
    cause = request.args.get("cause")
    final_map = session.get("final_map")

    if not cause or not final_map:
        return redirect(url_for('game.index'))

    return render_template("game_over.html", cause=cause)

# -------------------------
# WIN
# -------------------------
@game_bp.route('/win')
def win():
    final_map = session.get("final_map")
    win = session.get("win")
    if not final_map or not win:
        return redirect(url_for('game.index'))

    return render_template("win.html")

# -------------------------
# MAP VIEW
# -------------------------
@game_bp.route('/map_view')
def map_view():
    final_map = session.get('final_map')

    if not final_map:
        return redirect(url_for('game.index'))

    return render_template("map_view.html", map=final_map)