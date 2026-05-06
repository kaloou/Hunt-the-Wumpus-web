from app.game.constants import *
from app.game.map_generator import generate_map, place_player
import random

def launch_game(difficulty):
    game_map = generate_map(difficulty)
    player_position = place_player(game_map)
    return game_map, player_position

# -------------------------
# CAN MOVE
# -------------------------
def can_move(map, y, x, direction, came_from):
    path = map[y][x]['path']

    if path == CAVE or path == PIT:
        return True

    if path == ULDRTUNNEL:
        if came_from == RIGHT or came_from == UP:
            return direction == UP or direction == RIGHT
        if came_from == LEFT or came_from == DOWN:
            return direction == DOWN or direction == LEFT

    if path == URDLTUNNEL:
        if came_from == LEFT or came_from == UP:
            return direction == UP or direction == LEFT
        if came_from == RIGHT or came_from == DOWN:
            return direction == DOWN or direction == RIGHT

    return True

# -------------------------
# STEP — deplacement brut
# -------------------------
def step(y, x, direction):
    if direction == UP:
        return (y - 1) % ROW, x, DOWN
    elif direction == DOWN:
        return (y + 1) % ROW, x, UP
    elif direction == LEFT:
        return y, (x - 1) % COL, RIGHT
    elif direction == RIGHT:
        return y, (x + 1) % COL, LEFT

# -------------------------
# STEP FOLLOW — suit les tunnels automatiquement
# -------------------------
def step_follow(map, y, x, direction, came_from):
    path = map[y][x]['path']

    if path == ULDRTUNNEL:
        if came_from == DOWN:    direction = LEFT
        elif came_from == RIGHT: direction = UP
        elif came_from == UP:    direction = RIGHT
        elif came_from == LEFT:  direction = DOWN

    elif path == URDLTUNNEL:
        if came_from == DOWN:    direction = RIGHT
        elif came_from == LEFT:  direction = UP
        elif came_from == UP:    direction = LEFT
        elif came_from == RIGHT: direction = DOWN

    if direction == UP:
        return (y - 1) % ROW, x, DOWN
    elif direction == DOWN:
        return (y + 1) % ROW, x, UP
    elif direction == LEFT:
        return y, (x - 1) % COL, RIGHT
    elif direction == RIGHT:
        return y, (x + 1) % COL, LEFT

# -------------------------
# MOVE PLAYER
# -------------------------
def move_player(map, direction, y, x, came_from):
    if not can_move(map, y, x, direction, came_from):
        return y, x, came_from

    ny, nx, new_came_from = step(y, x, direction)

    map[y][x]["entities"].remove(PLAYER)
    map[ny][nx]["entities"].append(PLAYER)

    if map[ny][nx]["seen"] == 0:
        map[ny][nx]["seen"] = 1

    if map[ny][nx]["path"] == ULDRTUNNEL:
        corridor = "downright" if new_came_from in [DOWN, LEFT] else "upleft"
        if corridor not in map[ny][nx]["corridors_seen"]:
            map[ny][nx]["corridors_seen"].append(corridor)

    elif map[ny][nx]["path"] == URDLTUNNEL:
        corridor = "downleft" if new_came_from in [DOWN, RIGHT] else "upright"
        if corridor not in map[ny][nx]["corridors_seen"]:
            map[ny][nx]["corridors_seen"].append(corridor)

    return ny, nx, new_came_from

def move_player_express(map, direction, y, x, came_from):
    if not can_move(map, y, x, direction, came_from):
        return y, x, came_from

    map[y][x]["entities"].remove(PLAYER)
    ny, nx, new_came_from = step(y, x, direction)

    while map[ny][nx]["path"] in (ULDRTUNNEL, URDLTUNNEL):
        if map[ny][nx]["seen"] == 0:
            map[ny][nx]["seen"] = 1

        if map[ny][nx]["path"] == ULDRTUNNEL:
            corridor = "downright" if new_came_from in [DOWN, LEFT] else "upleft"
            if corridor not in map[ny][nx]["corridors_seen"]:
                map[ny][nx]["corridors_seen"].append(corridor)
        elif map[ny][nx]["path"] == URDLTUNNEL:
            corridor = "downleft" if new_came_from in [DOWN, RIGHT] else "upright"
            if corridor not in map[ny][nx]["corridors_seen"]:
                map[ny][nx]["corridors_seen"].append(corridor)

        ny, nx, new_came_from = step_follow(map, ny, nx, direction, new_came_from)

    map[ny][nx]["entities"].append(PLAYER)
    if map[ny][nx]["seen"] == 0:
        map[ny][nx]["seen"] = 1

    return ny, nx, new_came_from
# -------------------------
# SHOOT ARROW
# -------------------------
def shoot_arrow(map, direction, y, x, came_from):
    print(f"position de base : y: {y}, x: {x}")
    cy, cx, came_from = step_follow(map, y, x, direction, came_from)
    
    while True:
        print(f"new position y: {cy}, x: {cx}")
        if WUMPUS in map[cy][cx]["entities"]:
            print("wumpus killed")
            return True
        if map[cy][cx]["path"] == CAVE or map[cy][cx]["path"] == PIT:
            print("founded a cave or a pit end of the arrow")
            return False
        cy, cx, came_from = step_follow(map, cy, cx, direction, came_from)

# -------------------------
# IS PLAYER ALIVE
# -------------------------
def is_player_alive(map, y, x):
    if map[y][x]["path"] == PIT:
        return False
    if WUMPUS in map[y][x]["entities"]:
        return False
    return True

# -------------------------
# BAT MOVE
# -------------------------
def check_bat_move(map, y, x):
    if BAT not in map[y][x]["entities"]:
        return y, x

    map[y][x]["nb_visited"] += 1

    if map[y][x]["nb_visited"] >= 2:
        ny, nx = get_random_cave(map)

        map[y][x]["entities"].remove(PLAYER)
        map[y][x]["entities"].remove(BAT)
        map[y][x]["nb_visited"] = 0

        map[ny][nx]["entities"].append(PLAYER)
        map[ny][nx]["entities"].append(BAT)

        if map[ny][nx]["seen"] == 0:
            map[ny][nx]["seen"] = 1
        return ny, nx

    return y, x


def get_random_cave(map):

    while True:
        y = random.randint(0, ROW - 1)
        x = random.randint(0, COL - 1)

        if (map[y][x]['path'] == CAVE or map[y][x]['path'] == PIT) and PLAYER not in map[y][x]['entities'] and BAT not in map[y][x]['entities']:
            return y, x