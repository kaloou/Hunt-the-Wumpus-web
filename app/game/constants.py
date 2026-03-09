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

#===============
NB_PITS = 2

LEVELS = {
    "easy": {
        "bats": 1,
        "corridors_range": (8, 14)
    },
    "medium": {
        "bats": 2,
        "corridors_range": (16, 20)
    },
    "hard": {
        "bats": 2,
        "corridors_range": (24, 28)
    }
}