from app.game.constants import *
from app.game.map_generator import generate_map, place_player

def launch_game(difficulty):
    game_map = generate_map(difficulty)
    player_position = place_player(game_map)
    return game_map, player_position

# -------------------------
# CAN MOVE
# -------------------------
def can_move(table, y, x, direction, came_from):
    path = table[y][x]['path']

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
def step(table, y, x, direction):
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
def step_follow(table, y, x, direction, came_from):
    path = table[y][x]['path']

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
def move_player(table, direction, y, x, came_from):
    if not can_move(table, y, x, direction, came_from):
        return y, x, came_from

    ny, nx, new_came_from = step(table, y, x, direction)

    table[y][x]["entities"].remove(PLAYER)
    table[ny][nx]["entities"].append(PLAYER)

    if table[ny][nx]["seen"] == 0:
        table[ny][nx]["seen"] = 1

    if table[ny][nx]["path"] == ULDRTUNNEL:
        corridor = "downright" if new_came_from in [DOWN, LEFT] else "upleft"
        if corridor not in table[ny][nx]["corridors_seen"]:
            table[ny][nx]["corridors_seen"].append(corridor)

    elif table[ny][nx]["path"] == URDLTUNNEL:
        corridor = "downleft" if new_came_from in [DOWN, RIGHT] else "upright"
        if corridor not in table[ny][nx]["corridors_seen"]:
            table[ny][nx]["corridors_seen"].append(corridor)

    return ny, nx, new_came_from

# -------------------------
# SHOOT ARROW
# -------------------------
def shoot_arrow(table, direction, y, x, came_from):
    print(f"position de base : y: {y}, x: {x}")
    cy, cx, came_from = step_follow(table, y, x, direction, came_from)
    
    while True:
        print(f"new position y: {cy}, x: {cx}")
        if WUMPUS in table[cy][cx]["entities"]:
            print("wumpus killed")
            return True
        if table[cy][cx]["path"] == CAVE or table[cy][cx]["path"] == PIT:
            print("founded a cave or a pit end of the arrow")
            return False
        cy, cx, came_from = step_follow(table, cy, cx, direction, came_from)

# -------------------------
# IS PLAYER ALIVE
# -------------------------
def is_player_alive(table, y, x):
    if table[y][x]["path"] == PIT:
        return False
    if WUMPUS in table[y][x]["entities"]:
        return False
    return True