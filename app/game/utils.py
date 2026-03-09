def cell_to_json(cell):
    return {
        "path": cell["path"],
        "effects": list(cell["effects"]),
        "entities": list(cell["entities"]),
        "hidden": cell["hidden"]
    }

def table_to_json(table):
    return [
        [cell_to_json(cell) for cell in row]
        for row in table
    ]
