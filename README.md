# Hunt-the-Wumpus-web

This repository contains a web-based implementation of the classic computer game "Hunt the Wumpus". The game is built using Python with the Flask web framework for the backend and standard HTML/CSS for the frontend, featuring procedurally generated maps and custom sprites.

## Features

- **Procedural Map Generation**: Every game features a unique, randomly generated 6x8 cave system composed of caves and tunnels.
- **Difficulty Levels**: The game supports Easy, Normal, and Hard modes, which adjust the structural complexity of the map and the number of hazards.
- **Classic Gameplay Elements**: Navigate a dark cave system populated with hazards. The current implementation includes:
    - The Player
    - The Wumpus
    - Bottomless Pits
    - Super Bats that can move the player
- **Custom Sprites**: A modern visual take on the classic game with custom sprites for the player, enemies, and environment.

## How It Works

The application uses a simple but effective architecture:

- **Backend (Python/Flask)**: A single-route Flask application (`app.py`) serves as the entry point. When a user accesses the root URL, the application calls the `generate_map` function from `map_generator.py`.
- **Map Generation (`map_generator.py`)**: This script contains the core logic for the game. It procedurally generates a 2D array representing the map, placing caves, tunnels, pits, the Wumpus, bats, and the player according to the selected difficulty.
- **Frontend (HTML/CSS)**: The generated map data is passed to the `map.html` Jinja2 template. The template iterates through the map data, rendering an HTML `<table>`. CSS classes are dynamically applied to each cell to display the correct background sprites for the terrain and any entities present.

## Getting Started

```
git clone ...
cd projet
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
#Fill .env with your pg credentials

#run the app
flask --app app --debug run
```

## Project Structure

```
.
├── app.py              # Main Flask application file
├── map_generator.py    # Logic for procedural map generation
├── static/
│   ├── style.css       # Main stylesheet for the game
│   └── assets/         # Contains all image and audio assets
└── templates/
    └── map.html        # Jinja2 template for rendering the game board
```
