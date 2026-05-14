from flask import Blueprint, request, render_template, session, redirect, url_for

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        if not username or not password:
            error = "Remplis tous les champs."
        else:
            try:
                from app.db import login_user
                user_id, err = login_user(username, password)
                if err:
                    error = err
                else:
                    session['user_id'] = user_id
                    session['username'] = username
                    return redirect(url_for('game.index'))
            except Exception:
                error = "Connexion à la base de données impossible."
    return render_template('login.html', error=error, mode='login')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    error = None
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm  = request.form.get('confirm', '')
        if not username or not password:
            error = "Remplis tous les champs."
        elif len(username) < 3:
            error = "Le nom doit faire au moins 3 caractères."
        elif password != confirm:
            error = "Les mots de passe ne correspondent pas."
        else:
            try:
                from app.db import register_user
                user_id, err = register_user(username, password)
                if err:
                    error = err
                else:
                    session['user_id'] = user_id
                    session['username'] = username
                    return redirect(url_for('game.index'))
            except Exception:
                error = "Connexion à la base de données impossible."
    return render_template('login.html', error=error, mode='register')


@auth_bp.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    return redirect(url_for('game.index'))
