import random
##==========
## CONSTANTS
##==========
ROW = 6
COL = 8

EASY = 1
NORMAL = 2
HARD = 3

CAVE = 1
TUNNEL = 2
ULDRTUNNEL = 3
URDLTUNNEL = 4
PIT = 6
BAT = 7
WUMPUS = 8
PLAYER = 9
BLOOD = 10
SLIME = 11

UP = 1
DOWN = -1
LEFT = -2
RIGHT = 2

##===========================
## MAP GENERATION
##===========================
def place_pit(table, nb_pits):
    poss = []
    cpt = nb_pits
    while (cpt > 0):
        pos = (random.randint(0,5), random.randint(0,7))
        if (table[pos[0]][pos[1]][0] != CAVE):
            continue
        else:
            table[pos[0]][pos[1]][0] = PIT
            poss.append((pos[0],pos[1]))
            cpt -= 1
    return poss

def place_wumpus(table):
    while (True):
        pos = (random.randint(0,5), random.randint(0,7))
        if (table[pos[0]][pos[1]][0] != CAVE):
            continue
        else:
            break
    table[pos[0]][pos[1]][3] = WUMPUS
    return ((pos[0],pos[1]))

def place_bat(table, nb_bats):
    cpt = nb_bats

    while (cpt > 0):
        pos = (random.randint(0,5), random.randint(0,7))
        if (table[pos[0]][pos[1]][0] != CAVE or table[pos[0]][pos[1]][3] != 0):
            continue
        else:
            table[pos[0]][pos[1]][3] = BAT
            cpt -=1
   
def place_slime(table, pit_poss):
    for pit in pit_poss:
        base_y = pit[0]
        base_x = pit[1]
        y = base_y
        x = base_x
        
        direction = UP
        cpt_slime = 0
        y = (y - 1) % ROW
        while (cpt_slime < 4):
            
            if table[y][x][3] ==  WUMPUS or table[y][x][0] ==  PIT:
                if direction == UP:
                    y = (y - 1) % ROW
                elif direction == DOWN:
                    y = (y + 1) % ROW
                elif direction == LEFT:
                    x = (x - 1) % COL
                elif direction == RIGHT:
                    x = (x + 1) % COL

            elif table[y][x][0] == ULDRTUNNEL:
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

            elif table[y][x][0] == URDLTUNNEL:
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
            
            elif table[y][x][0] == CAVE:
                table[y][x][1] = SLIME
                cpt_slime += 1

                if cpt_slime == 1:
                    direction = DOWN
                    y = base_y
                    x = base_x

                elif cpt_slime == 2:
                    direction = LEFT
                    y = base_y
                    x = base_x

                elif cpt_slime == 3:
                    direction = RIGHT
                    y = base_y
                    x = base_x

def place_blood(table, wumpuspos):

        base_y = wumpuspos[0]
        base_x = wumpuspos[1]
        y = base_y
        x = base_x
        
        direction = UP
        cpt_blood = 0
        y = (y - 1) % ROW
        while (cpt_blood < 16):
            
            if table[y][x][0] == PIT or table[y][x][3] == WUMPUS :
                if direction == UP:
                    y = (y - 1) % ROW
                elif direction == DOWN:
                    y = (y + 1) % ROW
                elif direction == LEFT:
                    x = (x - 1) % COL
                elif direction == RIGHT:
                    x = (x + 1) % COL

            elif table[y][x][0] == ULDRTUNNEL:
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

            elif table[y][x][0] == URDLTUNNEL:
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
            
            elif table[y][x][0] == CAVE:
                table[y][x][2] = BLOOD
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
        pos = (random.randint(0,5), random.randint(0,7))
        if table[pos[0]][pos[1]][0] != CAVE or table[pos[0]][pos[1]][3] != 0 or table[pos[0]][pos[1]][1] == SLIME or table[pos[0]][pos[1]][2] == BLOOD:
            continue
        break
    table[pos[0]][pos[1]][3] = PLAYER

def can_tunnel_be_placed(table, tunnel, x, y):
    if tunnel == ULDRTUNNEL:
        if table[y][(x + 1) % COL][0] == URDLTUNNEL and table[(y + 1) % ROW][(x + 1) % COL][0] == ULDRTUNNEL and table[(y - 1) % ROW][x][0] == URDLTUNNEL:
            return False

    elif tunnel == URDLTUNNEL:
        if table[y][(x - 1) % COL][0] == ULDRTUNNEL and table[(y - 1) % ROW][(x - 1) % COL][0] == URDLTUNNEL and table[(y - 1) % ROW][x][0] == ULDRTUNNEL:
            return False
        
    return True

def get_cell(cells,table,x,y):
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
        nb_tunnels = random.randint(8, 14)
        nb_caves = 48 - nb_tunnels
        nb_bats = 1
    elif (difficulty == NORMAL):
        nb_tunnels = random.randint(16, 20)
        nb_caves = 48 - nb_tunnels
        nb_bats = 2
    elif (difficulty == HARD):    
        nb_tunnels = random.randint(22, 28) 
        nb_caves = 48 - nb_tunnels
        nb_bats = 2

    cells = [0] * 48
    for i in range(nb_caves):
        cells[i] = CAVE
    for i in range(nb_caves, nb_caves + nb_tunnels):
        cells[i] = TUNNEL
    
    table = [
         [
            [
                0,0,0,0
            ] for _ in range(COL)
         ] for _ in range(ROW)
    ] 

    # Fill the map with only caves and tunnels
    for i in range(ROW):
        for j in range(COL):
            table[i][j][0] = get_cell(cells, table, j,i)

    # Place the elements of the game
    pit_poss = place_pit(table, nb_pits)
    wumpus_pos = place_wumpus(table)
    place_bat(table, nb_bats)
    place_slime(table, pit_poss)
    place_blood(table, wumpus_pos)
    place_player(table)
    
    return table