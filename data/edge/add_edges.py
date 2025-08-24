from flask import Flask, render_template, request, jsonify, redirect, url_for
import folium
import pandas as pd
import geopandas as gpd
import os
import json
from geopy.distance import geodesic   # edge length 계산용

app = Flask(__name__)

# 파일 경로
NODE_PATH = "data/raw/nodes.csv"
NODE_ADDED_PATH = "data/node/nodes_added.csv"
EDGE_PATH = "data/raw/edges.geojson"
EDGE_ADDED_PATH = "data/edge/edges_added.geojson"

# 기본 데이터 불러오기
node_base = pd.read_csv(NODE_PATH)
edge_base = gpd.read_file("data/raw/edges.geojson")

def save_added_edges(new_edges):
    if os.path.exists(EDGE_ADDED_PATH):
        with open(EDGE_ADDED_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = {
            "type": "FeatureCollection",
            "name": "edges_added",
            "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
            "features": []
        }

    data["features"].extend(new_edges)

    with open(EDGE_ADDED_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)



def make_map():
    center = [node_base["lat"].mean(), node_base["lon"].mean()]
    m = folium.Map(location=center, zoom_start=14, width="90%", height="90%")

    # Esri 타일
    folium.TileLayer(
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attr="Tiles © Esri",
        name="Esri.WorldImagery"
    ).add_to(m)

    # 기본 노드 (파란색)
    for row in node_base.itertuples():
        folium.CircleMarker(
            location=[row.lat, row.lon],
            radius=3, color="blue", fill=True, fill_opacity=0.7,
            tooltip=str(row.osmid)
        ).add_to(m)

    # 추가 노드 (빨간색)
    if os.path.exists(NODE_ADDED_PATH):
        df_added = pd.read_csv(NODE_ADDED_PATH)
        for row in df_added.itertuples():
            folium.CircleMarker(
                location=[row.lat, row.lon],
                radius=3, color="red", fill=True, fill_opacity=0.7,
                tooltip=str(row.osmid)
            ).add_to(m)

    # 기존 edges (파란색)
    folium.GeoJson(
            data=edge_base.to_json(),
            name="edges_default",
            style_function=lambda _feat: {"color": "#0079cf", "weight": 3, "opacity": 0.8},
        ).add_to(m)

    # 추가된 edges (빨간색)
    if os.path.exists(EDGE_ADDED_PATH):
        edges_added = gpd.read_file(EDGE_ADDED_PATH)
        
        folium.GeoJson(
            data=edges_added.to_json(),
            name="edges_added",
            style_function=lambda _feat: {"color": "#bf00ff", "weight": 4, "opacity": 0.8},
        ).add_to(m)

    map_name = m.get_name()
    html = m.get_root().render()
    html += f"<script>var map = {map_name};</script>"
    return html


@app.route("/", methods=["GET", "POST"])
def index():
    map_html = make_map()
    return render_template("index.html", map_html=map_html)


@app.route("/save_edges", methods=["POST"])
def save_edges_api():
    data = request.get_json()
    edges = data.get("edges", [])

    if not edges:
        return jsonify({"status": "no edges received"})

    processed = []
    for edge in edges:
        u = int(edge["u"])
        v = int(edge["v"])
        latlon_u = (edge["u_lat"], edge["u_lon"])
        latlon_v = (edge["v_lat"], edge["v_lon"])
        length = geodesic(latlon_u, latlon_v).meters

        feature = {
            "type": "Feature",
            "properties": {"u": u, "v": v, "length": length},
            "geometry": {"type": "LineString", "coordinates": [
                [edge["u_lon"], edge["u_lat"]],
                [edge["v_lon"], edge["v_lat"]]
            ]}
        }
        processed.append(feature)

    save_added_edges(processed)
    return jsonify({"status": "success", "saved": processed})


if __name__ == "__main__":
    app.run(debug=True)
