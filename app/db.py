import psycopg2
from flask import current_app

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