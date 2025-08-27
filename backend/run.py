import json
from flask import Flask, request, jsonify, send_file
import subprocess
import os
import papermill as pm

app = Flask(__name__)

@app.route("/api/generate-path", methods=["POST"])
def generate_path():
    data = request.get_json()
    start_lat = data.get("lat")
    start_lon = data.get("lon")
    # 1. path.ipynb 실행 (예: papermill로 파라미터 전달)
    pm.execute_notebook(
        'backend/app/services/path_reccomendation/path.ipynb',
        'backend/app/services/path_reccomendation/path_out.ipynb',
        parameters=dict(start_lat=start_lat, start_lon=start_lon)
    )
    # 2. description.py 실행
    subprocess.run(["python", "backend/app/services/path_description/description.py"])
    # 3. 결과 반환 (예: geojson)
    geojson_path = "backend/app/services/path_reccomendation/results_path.geojson"
    if os.path.exists(geojson_path):
        return send_file(geojson_path, mimetype="application/json")
    else:
        return jsonify({"error": "경로 생성 실패"}), 500

@app.route("/api/path", methods=["GET"])
def get_path():
    path = "backend/app/services/path_reccomendation/results_path.geojson"
    if os.path.exists(path):
        return send_file(path, mimetype="application/json")
    else:
        return jsonify({"error": "geojson 파일 없음"}), 404
    

@app.route("/api/description", methods=["GET"])
def get_description():
    desc_json = "backend/app/services/path_description/description_results.json"
    if os.path.exists(desc_json):
        with open(desc_json, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    else:
        return jsonify({"error": "설명 파일 없음"}), 404
    
@app.route("/api/generate-music", methods=["POST"])
def generate_music():
    data = request.get_json()
    mood = data.get("mood", "mysterious and cinematic")
    # music.py를 mood 파라미터로 실행 (예: subprocess)
    result = subprocess.run([
        "python", "backend/app/services/musicgen/music.py", mood
    ])
    music_path = "backend/app/services/musicgen/generated_music.wav"
    if os.path.exists(music_path):
        return send_file(music_path, mimetype="audio/wav")
    else:
        return jsonify({"error": "음악 생성 실패"}), 500

if __name__ == "__main__":
    app.run(debug=True)