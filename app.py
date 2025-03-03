from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

# Load schedule data from JSON file
def load_schedule_data():
    with open('static/data/schedule.json', 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/schedule')
def get_schedule():
    try:
        schedule_data = load_schedule_data()
        return jsonify(schedule_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/about')
def about():
    return render_template('about.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
