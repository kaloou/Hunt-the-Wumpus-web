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
        "corridors_seen": []
    }
#corridors_seen": ["upleft","downright", "upright", "downleft"]

def place_pit(table, nb_pits):
    poss = []
    cpt = nb_pits
    while cpt > 0:
        y = random.randint(0, ROW - 1)
        x = random.randint(0, COL - 1)

        if table[y][x]['path'] != CAVE:
            continue

        table[y][x]['path'] = PIT
        poss.append((y, x))
        cpt -= 1

    return poss

def place_wumpus(table):
    while True:
        y = random.randint(0, ROW - 1)
        x = random.randint(0, COL - 1)

        if (table[y][x]['path'] == CAVE or table[y][x]['path'] == PIT) and PLAYER not in table[y][x]['entities']:
            table[y][x]['entities'].append(WUMPUS)
            return y, x

def place_bat(table, nb_bats):
    cpt = nb_bats
    while cpt > 0:
        y = random.randint(0, ROW - 1)
        x = random.randint(0, COL - 1)

        if table[y][x]['path'] != CAVE:
            continue

        table[y][x]['entities'].append(BAT)
        cpt -= 1

def place_slime(table, pit_poss):
    for pit in pit_poss:
        base_y = pit[0]
        base_x = pit[1]

        direction = UP
        cpt_slime = 0

        y = (base_y - 1) % ROW
        x = base_x

        while cpt_slime < 4:

            if table[y][x]['path'] == ULDRTUNNEL:
                if direction == UP: direction = LEFT
                elif direction == DOWN: direction = RIGHT
                elif direction == LEFT: direction = UP
                elif direction == RIGHT: direction = DOWN

            elif table[y][x]['path'] == URDLTUNNEL:
                if direction == UP: direction = RIGHT
                elif direction == DOWN: direction = LEFT
                elif direction == LEFT: direction = DOWN
                elif direction == RIGHT: direction = UP

            elif table[y][x]['path'] == CAVE:
                table[y][x]['effects'].append(SLIME)
                cpt_slime += 1

                if cpt_slime == 1: direction, y, x = DOWN, base_y, base_x
                elif cpt_slime == 2: direction, y, x = LEFT, base_y, base_x
                elif cpt_slime == 3: direction, y, x = RIGHT, base_y, base_x

            elif table[y][x]['path'] == PIT:
                cpt_slime += 1

            if direction == UP: y = (y - 1) % ROW
            elif direction == DOWN: y = (y + 1) % ROW
            elif direction == LEFT: x = (x - 1) % COL
            elif direction == RIGHT: x = (x + 1) % COL

def place_blood(table, base_y, base_x):
    y = base_y
    x = base_x
    
    direction = UP
    cpt_blood = 0
    y = (y - 1) % ROW
    while cpt_blood < 16:
        
        if table[y][x]['path'] == PIT or WUMPUS in table[y][x]['entities']:
            if direction == UP:
                y = (y - 1) % ROW
            elif direction == DOWN:
                y = (y + 1) % ROW
            elif direction == LEFT:
                x = (x - 1) % COL
            elif direction == RIGHT:
                x = (x + 1) % COL

        elif table[y][x]['path'] == ULDRTUNNEL:
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

        elif table[y][x]['path'] == URDLTUNNEL:
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
        
        elif table[y][x]['path'] == CAVE:
            table[y][x]['effects'].append(BLOOD)
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
           
            # --- LEFT
            elif cpt_blood == 14:
                y = base_y
                x = base_x
                direction = LEFT

            # --- FOUR DIRECTIONS
            if direction == UP:
                y = (y - 1) % ROW

            elif direction == DOWN:
                y = (y + 1) % ROW

            elif direction == LEFT:
                x = (x - 1) % COL
                
            elif direction == RIGHT:
                x = (x + 1) % COL

def place_player(table):
    while True:
        y = random.randint(0, ROW - 1)
        x = random.randint(0, COL - 1)

        if table[y][x]['path'] != CAVE: continue
        if len(table[y][x]['entities']) != 0: continue
        if SLIME in table[y][x]['effects'] or BLOOD in table[y][x]['effects']:continue
        break

    table[y][x]['entities'].append(PLAYER)
    table[y][x]['seen'] = 1
    return y, x

def can_tunnel_be_placed(table, tunnel, x, y):
    if tunnel == ULDRTUNNEL:
        if table[y][(x + 1) % COL]['path'] == URDLTUNNEL and table[(y + 1) % ROW][(x + 1) % COL]['path'] == ULDRTUNNEL and table[(y - 1) % ROW][x]['path'] == URDLTUNNEL:
            return False

    elif tunnel == URDLTUNNEL:
        if table[y][(x - 1) % COL]['path'] == ULDRTUNNEL and table[(y - 1) % ROW][(x - 1) % COL]['path'] == URDLTUNNEL and table[(y - 1) % ROW][x]['path'] == ULDRTUNNEL:
            return False
        
    return True

def get_path_cell(cells,table,x,y):
    i = random.randint(0, len(cells) - 1)
    cell = cells.pop(i)
    if cell == 1:
        return CAVE
    elif cell == 2:
        rand = random.randint(ULDRTUNNEL, URDLTUNNEL) # 3,4
        if can_tunnel_be_placed(table,rand,x,y):
            return rand
        else:
            if rand == ULDRTUNNEL :
                return URDLTUNNEL
            else:
                return ULDRTUNNEL

def generate_map(difficulty):

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

    table = [
        [
            new_cell() for _ in range(COL)
        ]for _ in range(ROW)
    ] 

    # Fill the map with only caves and tunnels
    for i in range(ROW):
        for j in range(COL):
            table[i][j]["path"] = get_path_cell(cells, table, j, i)

    # Place the elements of the game
    pit_poss = place_pit(table, nb_pits)
    wump_y, wump_x = place_wumpus(table)
    place_bat(table, nb_bats)
    place_slime(table, pit_poss)
    place_blood(table, wump_y, wump_x)
    
    return table

def create_menu_map():

    menu_table = [
        [
            new_cell() for _ in range(COL)
        ]for _ in range(ROW)
    ] 

    # Fill the map with only caves and tunnels
    for i in range(ROW):
        for j in range(COL):
            menu_table[i][j]["path"] = CAVE

    return menu_table

def ensure_accessibility():
    #use flood fill to check
    pass





