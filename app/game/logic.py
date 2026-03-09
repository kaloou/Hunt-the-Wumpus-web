from flask import session
from app.game.constants import *
from app.game.map_generator import generate_map, place_player
#from game.flood_fill_algo_test import floodFill

def launch_game(difficulty):
    table = generate_map(difficulty)
    player_position = place_player(table)
    return table, player_position
    #if !floodFill(table): return False


CORRIDOR_ALLOWED = {
    "upleft":    [UP, RIGHT],
    "downright": [DOWN, LEFT],
    "upright":   [UP, LEFT],
    "downleft":  [DOWN, RIGHT],
}

def can_move(path, came_from, direction):
    if path == 1:
        return True
    if path == 6:
        return False
    if path in [3, 4]:
        if came_from is None:
            return True
        if path == 3:
            corridor = "upleft" if came_from in ["right", "up"] else "downright"
        else:
            corridor = "upright" if came_from in ["left", "up"] else "downleft"
        return direction in CORRIDOR_ALLOWED[corridor]
    return True

def move_player(table, direction, player_position_y, player_position_x, came_from):
    if direction == UP:
        y = (player_position_y - 1) % ROW
        x = player_position_x
    elif direction == DOWN:
        y = (player_position_y + 1) % ROW
        x = player_position_x
    elif direction == LEFT:
        y = player_position_y
        x = (player_position_x - 1) % COL
    elif direction == RIGHT:
        y = player_position_y
        x = (player_position_x + 1) % COL

    table[player_position_y][player_position_x]["entities"].remove(PLAYER)
    table[y][x]["entities"].append(PLAYER)


    if table[y][x]["seen"] == 0:
        table[y][x]["seen"] = 1

    if table[y][x]["path"] == 3:
        corridor = "upleft" if came_from in ["right", "up"] else "downright"
        if corridor not in table[y][x]["corridors_seen"]:
            table[y][x]["corridors_seen"].append(corridor)

    elif table[y][x]["path"] == 4:
        corridor = "upright" if came_from in ["left", "up"] else "downleft"
        if corridor not in table[y][x]["corridors_seen"]:
            table[y][x]["corridors_seen"].append(corridor)

    return y, x

def is_player_alive(table, player_position_y, player_position_x):
    if table[player_position_y][player_position_x]["path"] == PIT:
        return False
    elif table[player_position_y][player_position_x]["entities"] == WUMPUS:
        return False
    else:
        return True

def shoot_arrow(table, direction, player_position_y, player_position_x):
    # --- UP
    if direction == UP:
        y = (player_position_y - 1) % ROW
        x = player_position_x

    # --- DOWN
    elif direction == DOWN:
        y = (player_position_y + 1) % ROW
        x = player_position_x

    # --- LEFT
    elif direction == LEFT:
        y = player_position_y
        x = (player_position_x - 1) % COL

    # --- RIGHT
    elif direction == RIGHT:
        y = player_position_y
        x = (player_position_x + 1) % COL

    if table[y][x][3] == WUMPUS:
        return True
    else:
        return False    
    