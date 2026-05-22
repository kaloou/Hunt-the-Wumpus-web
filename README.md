# Hunt the Wumpus — Web Edition

Version web du jeu classique **Hunt the Wumpus**, développée en Python/Flask avec génération procédurale de cartes et une interface visuelle custom.

## Fonctionnalités

- **Génération procédurale** : chaque partie génère un réseau de grottes unique (grille 6×8) avec des caves, tunnels et pièges placés aléatoirement.
- **3 niveaux de difficulté** : Easy, Normal, Hard — ajustent le nombre de corridors et de chauves-souris.
- **Mode Blindfolded** : la carte est cachée, navigation à l'aveugle uniquement par les indices sensoriels.
- **Mode Express** : déplacement accéléré, le joueur traverse les tunnels automatiquement.
- **Système de score** : `score = max(0, 1000 − moves×10 − elapsed_seconds)`, sauvegardé en base.
- **Classement (leaderboard)** : top 20 des meilleurs scores, toutes difficultés confondues.
- **Authentification** : inscription / connexion / déconnexion, les scores sont liés à un compte.
- **Replay** : relancer une partie au même niveau sans repasser par la sélection.
- **Révélation de la carte** : à la fin d'une partie (victoire ou défaite), la carte complète est affichée.

## Architecture

```
HuntTheWumpus/
├── app.py                  # Point d'entrée Flask
├── app/
│   ├── __init__.py         # Factory Flask, enregistrement des blueprints
│   ├── config.py           # Configuration depuis .env
│   ├── db.py               # Accès PostgreSQL (users, scores)
│   ├── game/
│   │   ├── constants.py    # Constantes (taille grille, entités, niveaux)
│   │   ├── map_generator.py# Génération procédurale de la carte
│   │   ├── logic.py        # Déplacement, tir, chauves-souris
│   │   └── utils.py
│   ├── routes/
│   │   ├── auth.py         # /login  /register  /logout
│   │   ├── game.py         # /  /select_level  /play  /win  /game_over  /replay  /map_view
│   │   ├── leaderboard.py  # /leaderboard/
│   │   └── debug.py
│   ├── templates/          # Jinja2 (base, menu, game, win, game_over, leaderboard…)
│   └── static/             # CSS, sprites, assets
├── requirements.txt
├── .env.example
└── init_db.sql
```

## Installation

```bash
git clone <repo-url>
cd HuntTheWumpus

python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Remplir .env avec les credentials PostgreSQL et une SECRET_KEY

flask --app app --debug run
```

### Variables d'environnement (`.env`)

| Variable        | Description                           |
| --------------- | ------------------------------------- |
| `SECRET_KEY`  | Clé secrète Flask pour les sessions |
| `DB_NAME`     | Nom de la base PostgreSQL             |
| `DB_USER`     | Utilisateur PostgreSQL                |
| `DB_PASSWORD` | Mot de passe                          |
| `DB_HOST`     | Hôte (défaut :`localhost`)        |
| `DB_PORT`     | Port (défaut :`5432`)              |

La base de données est initialisée automatiquement au démarrage avec le script sql (`users` et `scores`).

## Dépendances

- Python 3.11+
- Flask 3.x
- psycopg2-binary (PostgreSQL)
- python-dotenv
- Werkzeug (hash de mots de passe)
