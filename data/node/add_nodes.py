from flask import Flask, render_template, request, redirect, url_for, jsonify
import folium
import pandas as pd
import os

app = Flask(__name__)

# CSV 경로
NODE_PATH = "data/raw/nodes.csv"
NODE_ADDED_PATH = "data/raw/nodes_added.csv"

# 전역 데이터프레임
df_base = pd.read_csv(NODE_PATH)
df_nodes = df_base  # 기본 노드 + 추가된 노드 저장할 변수


def load_nodes(path=NODE_PATH):
    return pd.read_csv(path)


def save_added_nodes(new_nodes):
    # 여러 노드를 nodes_added.csv에 append
    if os.path.exists(NODE_ADDED_PATH):
        df_added = pd.read_csv(NODE_ADDED_PATH)
        df_added = pd.concat([df_added, pd.DataFrame(new_nodes)], ignore_index=True)
    else:
        df_added = pd.DataFrame(new_nodes)

    df_added.to_csv(NODE_ADDED_PATH, index=False, float_format="%.7f")


def make_map():
    center = [df_base["lat"].mean(), df_base["lon"].mean()]

    m = folium.Map(location=center, zoom_start=14, width="90%", height="90%")

    # Esri 타일
    folium.TileLayer(
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attr="Tiles © Esri",
        name="Esri.WorldImagery",
        overlay=False,
        control=True,
    ).add_to(m)

    # 기본 노드 (파란색)
    for row in df_base.itertuples():
        folium.CircleMarker(
            location=[row.lat, row.lon],
            radius=2,
            color="blue",
            fill=True,
            fill_opacity=0.7,
            popup=f"osmid: {row.osmid} (기본)",
        ).add_to(m)

    # 추가 노드 (없으면 빈 데이터프레임)
    if os.path.exists(NODE_ADDED_PATH):
        df_added = pd.read_csv(NODE_ADDED_PATH)
    else:
        df_added = pd.DataFrame(columns=["osmid", "lat", "lon"])
    
    # 추가 노드 (빨간색)
    for row in df_added.itertuples():
        folium.CircleMarker(
            location=[row.lat, row.lon],
            radius=2,
            color="red",
            fill=True,
            fill_opacity=0.7,
            popup=f"osmid: {row.osmid} (추가) [{row.lat:.7f}, {row.lon:.7f}]",
        ).add_to(m)

    map_name = m.get_name()  # 예: 'map_f1c9f3f7f2d34f5c9c8e9d5f92f2f3d7'
    html = m.get_root().render()
    html += f"<script>var map = {map_name};</script>"
    return html


@app.route("/", methods=["GET", "POST"])
def index():
    global df_nodes

    # POST 요청 (노드 추가)
    if request.method == "POST":
        lat = request.form.get("lat", "").strip()
        lon = request.form.get("lon", "").strip()

        if not lat or not lon:
            return redirect(url_for("index"))

        lat = float(lat)
        lon = float(lon)
        new_osmid = int(df_nodes["osmid"].max() + 1)

        new_node = {"osmid": new_osmid, "lat": lat, "lon": lon}

        # 전역 데이터프레임에 누적
        df_nodes = pd.concat([df_nodes, pd.DataFrame([new_node])], ignore_index=True)

        # 새 노드만 별도 저장
        save_added_nodes(new_node)

        return redirect(url_for("index"))

    # 지도 생성 (기본 + 추가)
    map_html = make_map()
    return render_template("index.html", map_html=map_html)

@app.route("/save_nodes", methods=["POST"])
def save_nodes():
    global df_nodes

    data = request.get_json()
    new_nodes = data.get("nodes", [])

    if not new_nodes:
        return jsonify({"status": "no nodes received"})

    # osmid 자동 증가
    max_osmid = int(df_base["osmid"].max())
    if os.path.exists(NODE_ADDED_PATH):
        df_added = pd.read_csv(NODE_ADDED_PATH)
        if not df_added.empty:
            max_osmid = max(max_osmid, int(df_added["osmid"].max()))

    processed = []
    for node in new_nodes:
        max_osmid += 1
        processed.append({
            "osmid": max_osmid,
            "lat": round(float(node["lat"]), 7),
            "lon": round(float(node["lon"]), 7)
        })

    # CSV에 저장
    save_added_nodes(processed)

    return jsonify({"status": "success", "saved": processed})


if __name__ == "__main__":
    app.run(debug=True)
