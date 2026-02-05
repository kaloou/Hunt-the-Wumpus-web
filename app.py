from flask import Flask, render_template
from map_generator import table


app = Flask(__name__)

@app.route('/')
def base_route():
    return render_template('map.html', table=table)


if __name__ == '__main__':
    app.run(debug=True)
