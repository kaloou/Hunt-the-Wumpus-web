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

##===========================
## MAP GENERATION
##===========================
def can_tunnel_be_placed(table, tunnel, x, y):
    if tunnel == ULDRTUNNEL:
        if table[y][(x + 1) % COL] == URDLTUNNEL and table[(y + 1) % ROW][(x + 1) % COL] == ULDRTUNNEL and table[(y - 1) % ROW][x] == URDLTUNNEL:
            return False

    elif tunnel == URDLTUNNEL:
        if table[y][(x - 1) % COL] == ULDRTUNNEL and table[(y + 1) % ROW][(x - 1) % COL] == URDLTUNNEL and table[(y - 1) % ROW][x] == ULDRTUNNEL:
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
    
    # Create the map with caves and tunnels
    table = [
         [
            [
            ] for _ in range(COL)
         ] for _ in range(ROW)
    ] 

    # Fill the map with caves and tunnels
    for i in range(ROW):
        for j in range(COL):
            table[i][j] = get_cell(cells, table, j,i)
            print(table)

    print(table)
    return table
    

table = generate_map(3)





