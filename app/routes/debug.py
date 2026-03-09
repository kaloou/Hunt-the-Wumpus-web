from flask import Blueprint, request, render_template, session, url_for, redirect

debug_bp = Blueprint('debug', __name__)

@debug_bp.route("/")
def index():
    return render_template("debug.html",session_data=dict(session))

@debug_bp.route("/destroy_session")
def destroy_session():
    session.clear()
    return "", 204

@debug_bp.route("/go_home_page")
def go_home_page():
    return redirect(url_for('game.index'))

@debug_bp.route("/go_game_page")
def go_game_page():
    return redirect(url_for('game.play'))


@debug_bp.route("/print_session")
def print_session():
    return render_template("debug.html")