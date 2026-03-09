#TO DO
# place autre chose que -1 dans les endroits qui le bloque le passage
# prendre en compte la considération de la map pour les tunnels qui font desd boucles trouvé une logique 

"""
def dfs(table, x, y, oldValue, newValue):
    if (y < 0 or y >= len(table) or
        x < 0 or x >= len(table[0]) or
        table[y][x][5] != oldValue):
        return

    table[y][x][5] = newValue

    dfs(table, x + 1, y, oldValue, newValue)
    dfs(table, x - 1, y, oldValue, newValue)
    dfs(table, x, y + 1, oldValue, newValue)
    dfs(table, x, y - 1, oldValue, newValue)


def floodFill(table, sr, sc, newValue):
    oldValue = table[sr][sc][5]
    if oldValue == newValue:
        return table

    dfs(table, sc, sr, oldValue, newValue)
    return table

if __name__ == "__main__":
    from HuntTheWumpus.game.map_generator import generate_map, HARD
    table = generate_map(HARD)
    for row in table:
        for col in row:
            print(col[5], end=" ")
        print("\n")
    print("\n\n")
    floodFill(table, 0, 0, 0)
    for row in table:
        for col in row:
            print(col[5], end=" ")
        print("\n")
"""