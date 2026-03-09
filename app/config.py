import os
from dotenv import load_dotenv

load_dotenv()

class Config :
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key')
    DB_NAME = os.environ.get('DB_NAME')
    DB_USER = os.environ.get('DB_USER')
    DB_PASSWORD = os.environ.get('DB_PASSWORD')
    DB_HOST = os.environ.get('DB_HOST')
    DB_PORT = os.environ.get('DB_PORT')