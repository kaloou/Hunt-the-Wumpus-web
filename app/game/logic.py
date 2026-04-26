from flask import session
from app.game.constants import *
from app.game.map_generator import generate_map, place_player
#from game.flood_fill_algo_test import floodFill

def launch_game(difficulty):
    """
    Initialise une nouvelle partie : génère la map et place le joueur.
    
    Args:
        difficulty (int): EASY, NORMAL ou HARD.
    Returns:
        tuple: (table, player_position) — la map 2D et la position (y, x) du joueur.
    """
    table = generate_map(difficulty)
    player_position = place_player(table)
    return table, player_position
    #if !floodFill(table): return False

def can_move(path, came_from, direction):
    """
    Détermine si le joueur peut se déplacer dans une direction donnée
    depuis une case de type path.
    
    Args:
        path (int): type de la case courante (CAVE, ULDRTUNNEL, URDLTUNNEL...).
        came_from (str|None): direction d'arrivée ("up", "down", "left", "right").
        direction (int): direction cible (UP, DOWN, LEFT, RIGHT).
    Returns:
        bool: True si le mouvement est autorisé.
    
    Note:
        Pour les tunnels, la direction autorisée dépend du corridor
        emprunté (déterminé par came_from).
    """
    if path == CAVE:
        return True
    if path == PIT:
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
    """
    Déplace le joueur dans la direction donnée, met à jour la map
    et marque la nouvelle case comme vue. Enregistre le corridor emprunté
    si la case est un tunnel.
    
    Args:
        table (list[list[dict]]): la map 2D.
        direction (int): UP, DOWN, LEFT ou RIGHT.
        player_position_y (int): ligne actuelle du joueur.
        player_position_x (int): colonne actuelle du joueur.
        came_from (str): direction d'arrivée sur la case courante.
    Returns:
        tuple: (y, x) nouvelle position du joueur.
    """
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
    """
    Vérifie si le joueur est en vie sur sa case courante.
    
    Args:
        table (list[list[dict]]): la map 2D.
        player_position_y (int): ligne du joueur.
        player_position_x (int): colonne du joueur.
    Returns:
        bool: False si le joueur est sur un PIT ou avec le WUMPUS, True sinon.
    
    Bug:
        La vérification du Wumpus compare la liste entities à l'entier WUMPUS.
        Corriger avec : WUMPUS in table[y][x]["entities"]
    """
    if table[player_position_y][player_position_x]["path"] == PIT:
        return False
    elif table[player_position_y][player_position_x]["entities"] == WUMPUS:
        return False
    else:
        return True

def shoot_arrow(table, direction, player_position_y, player_position_x):
    """
    Tire une flèche dans la direction donnée depuis la position du joueur.
    Vérifie si la case adjacente contient le Wumpus.
    
    Args:
        table (list[list[dict]]): la map 2D.
        direction (int): UP, DOWN, LEFT ou RIGHT.
        player_position_y (int): ligne du joueur.
        player_position_x (int): colonne du joueur.
    Returns:
        bool: True si le Wumpus est touché, False sinon.
    
    Bug:
        Accès par index entier (table[y][x][3]) au lieu de clé dict.
        Corriger avec : WUMPUS in table[y][x]["entities"]
    """
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
    