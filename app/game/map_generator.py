import random
from .constants import *

##======================
## MAP GENERATION LOGIC
##======================
def new_cell():
    return {
        "path": 0,
        "effects": [],
        "entities": [],
        "seen": 0,
        "nb_visited": 0,
        "corridors_seen": []
    }
#corridors_seen": ["upleft","downright", "upright", "downleft"]

def place_pit(map, nb_pits):
    """
    Place nb_pits puits aléatoirement sur des cases CAVE de la map.
    
    Args:
        map (list[list[dict]]): la map 2D.
        nb_pits (int): nombre de puits à placer.
    Returns:
        list[tuple]: liste des positions (y, x) des puits placés.
    """
    poss = []
    cpt = nb_pits
    while cpt > 0:
        y = random.randint(0, ROW - 1)
        x = random.randint(0, COL - 1)

        if map[y][x]['path'] != CAVE:
            continue

        map[y][x]['path'] = PIT
        poss.append((y, x))
        cpt -= 1

    return poss

def place_wumpus(map):
    """
    Place le Wumpus sur une case CAVE ou PIT ne contenant pas le joueur.
    Boucle jusqu'à trouver une position valide.
    
    Args:
        map (list[list[dict]]): la map 2D.
    Returns:
        tuple: (y, x) position du Wumpus.
    """
    while True:
        y = random.randint(0, ROW - 1)
        x = random.randint(0, COL - 1)

        if (map[y][x]['path'] == CAVE or map[y][x]['path'] == PIT) and PLAYER not in map[y][x]['entities']:
            map[y][x]['entities'].append(WUMPUS)
            return y, x

def place_bat(map, nb_bats):
    """
    Place nb_bats chauves-souris aléatoirement sur des cases CAVE.
    
    Args:
        map (list[list[dict]]): la map 2D.
        nb_bats (int): nombre de chauves-souris à placer.
    """
    cpt = nb_bats
    while cpt > 0:
        y = random.randint(0, ROW - 1)
        x = random.randint(0, COL - 1)

        if map[y][x]['path'] != CAVE:
            continue

        map[y][x]['entities'].append(BAT)
        cpt -= 1

def place_slime(map, pit_poss):
    """
    Place l'effet SLIME sur les 4 cases CAVE adjacentes à chaque puits.
    Suit les tunnels directionnels pour trouver les voisins réels.
    
    Args:
        map (list[list[dict]]): la map 2D.
        pit_poss (list[tuple]): positions (y, x) des puits.
    """
    for pit in pit_poss:
        base_y = pit[0]
        base_x = pit[1]

        direction = UP
        cpt_slime = 0

        y = (base_y - 1) % ROW
        x = base_x

        while cpt_slime < 4:

            if map[y][x]['path'] == ULDRTUNNEL:
                if direction == UP: direction = LEFT
                elif direction == DOWN: direction = RIGHT
                elif direction == LEFT: direction = UP
                elif direction == RIGHT: direction = DOWN

            elif map[y][x]['path'] == URDLTUNNEL:
                if direction == UP: direction = RIGHT
                elif direction == DOWN: direction = LEFT
                elif direction == LEFT: direction = DOWN
                elif direction == RIGHT: direction = UP

            elif map[y][x]['path'] == CAVE:
                map[y][x]['effects'].append(SLIME)
                cpt_slime += 1

                if cpt_slime == 1: direction, y, x = DOWN, base_y, base_x
                elif cpt_slime == 2: direction, y, x = LEFT, base_y, base_x
                elif cpt_slime == 3: direction, y, x = RIGHT, base_y, base_x

            elif map[y][x]['path'] == PIT:
                cpt_slime += 1

            if direction == UP: y = (y - 1) % ROW
            elif direction == DOWN: y = (y + 1) % ROW
            elif direction == LEFT: x = (x - 1) % COL
            elif direction == RIGHT: x = (x + 1) % COL

def place_blood(map, base_y, base_x):
    """
    Place l'effet BLOOD sur les cases CAVE autour du Wumpus (jusqu'à 16 cases).
    Parcourt les 4 directions en suivant les tunnels directionnels.
    
    Args:
        map (list[list[dict]]): la map 2D.
        base_y (int): ligne du Wumpus.
        base_x (int): colonne du Wumpus.
    """
    y = base_y
    x = base_x
    
    direction = UP
    cpt_blood = 0
    y = (y - 1) % ROW
    while cpt_blood < 24:
        
        if map[y][x]['path'] == PIT or WUMPUS in map[y][x]['entities']:
            if direction == UP:
                y = (y - 1) % ROW
            elif direction == DOWN:
                y = (y + 1) % ROW
            elif direction == LEFT:
                x = (x - 1) % COL
            elif direction == RIGHT:
                x = (x + 1) % COL

        elif map[y][x]['path'] == ULDRTUNNEL:
            if direction == UP:
                direction = LEFT
                x = (x - 1) % COL
            elif direction == DOWN:
                direction = RIGHT
                x = (x + 1) % COL
            elif direction == LEFT:
                direction = UP
                y = (y - 1) % ROW
            elif direction == RIGHT:
                direction = DOWN
                y = (y + 1) % ROW

        elif map[y][x]['path'] == URDLTUNNEL:
            if direction == UP:
                direction = RIGHT
                x = (x + 1) % COL
            elif direction == DOWN:
                direction = LEFT
                x = (x - 1) % COL
            elif direction == LEFT:
                direction = DOWN
                y = (y + 1) % ROW
            elif direction == RIGHT:
                direction = UP
                y = (y - 1) % ROW
        
        elif map[y][x]['path'] == CAVE:
            map[y][x]['effects'].append(BLOOD)
            cpt_blood += 1

            # --- UP
            if cpt_blood == 2:
                y = base_y
                x = base_x
                direction = UP
            
            elif cpt_blood == 3:
                if direction == UP:
                    direction = LEFT
                elif direction == LEFT:
                    direction = DOWN
                elif direction == RIGHT:
                    direction = UP
                elif direction == DOWN:
                    direction = RIGHT    
            
            elif cpt_blood == 4:
                y = base_y
                x = base_x
                direction = UP
            
            elif cpt_blood == 5:
                if direction == UP:
                    direction = RIGHT
                elif direction == LEFT:
                    direction = UP
                elif direction == RIGHT:
                    direction = DOWN
                elif direction == DOWN:
                    direction = LEFT  

            # --- DOWN
            elif cpt_blood == 6:
                y = base_y
                x = base_x
                direction = DOWN
            
            elif cpt_blood == 8:
                y = base_y
                x = base_x
                direction = DOWN
            
            elif cpt_blood == 9:
                if direction == UP:
                    direction = RIGHT
                elif direction == LEFT:
                    direction = UP
                elif direction == RIGHT:
                    direction = DOWN
                elif direction == DOWN:
                    direction = LEFT    
            
            elif cpt_blood == 10:
                y = base_y
                x = base_x
                direction = DOWN
            
            elif cpt_blood == 11:
                if direction == UP:
                    direction = LEFT
                elif direction == LEFT:
                    direction = DOWN
                elif direction == RIGHT:
                    direction = UP
                elif direction == DOWN:
                    direction = RIGHT  

            # --- RIGHT
            elif cpt_blood == 12:
                y = base_y
                x = base_x
                direction = RIGHT
            
            elif cpt_blood == 14:
                y = base_y
                x = base_x
                direction = RIGHT

            elif cpt_blood == 15:
                if direction == UP:
                    direction = RIGHT
                elif direction == LEFT:
                    direction = UP
                elif direction == RIGHT:
                    direction = DOWN
                elif direction == DOWN:
                    direction = LEFT

            elif cpt_blood == 16:
                y = base_y
                x = base_x
                direction = RIGHT

            elif cpt_blood == 17:
                if direction == UP:
                    direction = LEFT
                elif direction == LEFT:
                    direction = DOWN
                elif direction == RIGHT:
                    direction = UP
                elif direction == DOWN:
                    direction = RIGHT

            # --- LEFT
            elif cpt_blood == 18:
                y = base_y
                x = base_x
                direction = LEFT

            elif cpt_blood == 20:
                y = base_y
                x = base_x
                direction = LEFT

            elif cpt_blood == 21:
                if direction == UP:
                    direction = RIGHT
                elif direction == LEFT:
                    direction = UP
                elif direction == RIGHT:
                    direction = DOWN
                elif direction == DOWN:
                    direction = LEFT

            elif cpt_blood == 22:
                y = base_y
                x = base_x
                direction = LEFT

            elif cpt_blood == 23:
                if direction == UP:
                    direction = LEFT
                elif direction == LEFT:
                    direction = DOWN
                elif direction == RIGHT:
                    direction = UP
                elif direction == DOWN:
                    direction = RIGHT

            if direction == UP:
                y = (y - 1) % ROW
            elif direction == DOWN:
                y = (y + 1) % ROW
            elif direction == LEFT:
                x = (x - 1) % COL
            elif direction == RIGHT:
                x = (x + 1) % COL

def place_player(map):
    """
    Place le joueur sur une case CAVE libre, sans entité ni effet SLIME/BLOOD.
    Marque la case comme vue (seen=1).
    
    Args:
        map (list[list[dict]]): la map 2D.
    Returns:
        tuple: (y, x) position du joueur.
    """
    while True:
        y = random.randint(0, ROW - 1)
        x = random.randint(0, COL - 1)

        if map[y][x]['path'] != CAVE: continue
        if len(map[y][x]['entities']) != 0: continue
        if SLIME in map[y][x]['effects'] or BLOOD in map[y][x]['effects']:continue
        break

    map[y][x]['entities'].append(PLAYER)
    map[y][x]['seen'] = 1
    return y, x

def can_tunnel_be_placed(map, tunnel, x, y):
    """
    Vérifie si un tunnel directionnel peut être placé en (y, x)
    sans créer une configuration invalide avec les tunnels voisins.
    Exemple une boucle complète.
    
    Args:
        map (list[list[dict]]): la map 2D (partiellement remplie).
        tunnel (int): ULDRTUNNEL ou URDLTUNNEL.
        x (int): colonne cible.
        y (int): ligne cible.
    Returns:
        bool: True si le tunnel peut être placé, False sinon.
    """
    if tunnel == ULDRTUNNEL:
        if map[y][(x + 1) % COL]['path'] == URDLTUNNEL and map[(y + 1) % ROW][(x + 1) % COL]['path'] == ULDRTUNNEL and map[(y - 1) % ROW][x]['path'] == URDLTUNNEL:
            return False

    elif tunnel == URDLTUNNEL:
        if map[y][(x - 1) % COL]['path'] == ULDRTUNNEL and map[(y - 1) % ROW][(x - 1) % COL]['path'] == URDLTUNNEL and map[(y - 1) % ROW][x]['path'] == ULDRTUNNEL:
            return False
        
    return True

def get_path_cell(cells,map,x,y):
    """
    Tire aléatoirement un type de cellule depuis la liste cells et retourne
    le path correspondant. Si un tunnel est invalide à cette position, bascule
    sur l'autre type de tunnel.
    
    Args:
        cells (list[int]): liste des types restants à placer (modifiée en place).
        map (list[list[dict]]): la map 2D (partiellement remplie).
        x (int): colonne cible.
        y (int): ligne cible.
    Returns:
        int: constante CAVE, ULDRTUNNEL ou URDLTUNNEL.
    """
    i = random.randint(0, len(cells) - 1)
    cell = cells.pop(i)
    if cell == 1:
        return CAVE
    elif cell == 2:
        rand = random.randint(ULDRTUNNEL, URDLTUNNEL)
        if can_tunnel_be_placed(map,rand,x,y):
            return rand
        else:
            if rand == ULDRTUNNEL :
                return URDLTUNNEL
            else:
                return ULDRTUNNEL

def generate_map(difficulty):
    """
    Génère une map complète selon la difficulté donnée.
    Place les caves, tunnels, puits, Wumpus, chauves-souris, slime et blood.
    
    Args:
        difficulty (int): EASY, NORMAL ou HARD.
    Returns:
        list[list[dict]]: la map 2D complète avec tous les éléments placés.
    """
    nb_pits = 2
    if (difficulty == EASY):
        nb_tunnels = random.randint(8, 15)
        nb_caves = 48 - nb_tunnels
        nb_bats = 1
    elif (difficulty == NORMAL):
        nb_tunnels = 18
        nb_caves = 30
        nb_bats = 2
    elif (difficulty == HARD):    
        nb_tunnels = 16
        nb_caves = 32
        nb_bats = 2

    
    cells = [0] * 48
    for i in range(nb_caves):
        cells[i] = CAVE
    for i in range(nb_caves, nb_caves + nb_tunnels):
        cells[i] = TUNNEL
    #print(cells)

    map = [
        [
            new_cell() for _ in range(COL)
        ]for _ in range(ROW)
    ] 

    # Fill the map with only caves and tunnels
    for i in range(ROW):
        for j in range(COL):
            map[i][j]["path"] = get_path_cell(cells, map, j, i)

    # Place the elements of the game
    pit_poss = place_pit(map, nb_pits)
    wump_y, wump_x = place_wumpus(map)
    place_bat(map, nb_bats)
    place_slime(map, pit_poss)
    place_blood(map, wump_y, wump_x)
    
    return map

def create_menu_map():
    """
    Génère une map vide remplie uniquement de cases CAVE.
    Utilisée pour l'affichage du menu principal.
    
    Returns:
        list[list[dict]]: la map 2D avec uniquement des CAVE.
    """
    menu_map = [
        [
            new_cell() for _ in range(COL)
        ]for _ in range(ROW)
    ] 

    # Fill the map with only caves and tunnels
    for i in range(ROW):
        for j in range(COL):
            menu_map[i][j]["path"] = CAVE

    return menu_map

def ensure_accessibility():
    #use flood fill to check
    pass





