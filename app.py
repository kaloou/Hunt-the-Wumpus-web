from flask import Flask, render_template
from map_generator import generate_map, EASY


app = Flask(__name__)

@app.route('/')
def base_route():
    return render_template('map.html', table=generate_map(EASY))


if __name__ == '__main__':
    app.run(debug=True, port=5002)
