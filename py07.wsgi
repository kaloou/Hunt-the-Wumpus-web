#!/usr/bin/python3
import sys
import os

sys.path.insert(0, "/home/student/py07")

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
except ImportError:
    pass

from app import create_app
application = create_app()
