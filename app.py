from flask import Flask, render_template
from map_generator import generate_map, EASY, NORMAL, HARD


app = Flask(__name__)

@app.route('/')
def base_route():
    return render_template('map.html', table=generate_map(HARD))


if __name__ == '__main__':
    print("===================================\nStarting the Wumpus Game server...\n===================================")
    app.run(debug=True, port=5001)
