import psycopg2
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash


def db_connect():
    try:
        return psycopg2.connect(
            database=current_app.config.get('DB_NAME'),
            user=current_app.config.get('DB_USER'),
            password=current_app.config.get('DB_PASSWORD'),
            host=current_app.config.get('DB_HOST'),
            port=current_app.config.get('DB_PORT')
        )
    except psycopg2.OperationalError as e:
        raise RuntimeError(f"Impossible de se connecter à la base de données : {e}")


def init_db():
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(64) UNIQUE NOT NULL,
            password_hash VARCHAR(256) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            username VARCHAR(64) NOT NULL,
            score INTEGER NOT NULL,
            moves INTEGER NOT NULL,
            time_seconds INTEGER NOT NULL,
            level INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    conn.commit()
    cur.close()
    conn.close()


def register_user(username, password):
    conn = db_connect()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
            (username, generate_password_hash(password))
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        return user_id, None
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return None, "Ce nom d'utilisateur est déjà pris."
    finally:
        cur.close()
        conn.close()


def login_user(username, password):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (username,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None, "Nom d'utilisateur introuvable."
    if not check_password_hash(row[1], password):
        return None, "Mot de passe incorrect."
    return row[0], None


def save_score(user_id, username, score, moves, time_seconds, level):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO scores (user_id, username, score, moves, time_seconds, level) VALUES (%s, %s, %s, %s, %s, %s)",
        (user_id, username, score, moves, time_seconds, level)
    )
    conn.commit()
    cur.close()
    conn.close()


def get_leaderboard(limit=20):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("""
        SELECT username, score, moves, time_seconds, level, created_at
        FROM scores
        ORDER BY score DESC
        LIMIT %s
    """, (limit,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            "rank": i + 1,
            "username": r[0],
            "score": r[1],
            "moves": r[2],
            "time_seconds": r[3],
            "level": r[4],
            "created_at": r[5],
        }
        for i, r in enumerate(rows)
    ]
