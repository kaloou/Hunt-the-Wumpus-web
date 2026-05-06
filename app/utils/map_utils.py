from app.game.constants import *

def put_complete_seen_map(map):
    for i in range(ROW):
        for j in range(COL):
            map[i][j]["seen"] = 1