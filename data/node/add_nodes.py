from flask import Flask, render_template, request, redirect, url_for
import folium
import pandas as pd
import os

app = Flask(__name__)

# CSV 경로
NODE_PATH = "data/raw/nodes.csv"
NODE_ADDED_PATH = "data/raw/nodes_added.csv"

# 전역 데이터프레임
df_nodes = None  # 기본 노드 + 새 노드 포함된 데이터
df_base = pd.read_csv(NODE_PATH)

def load_nodes(path=NODE_PATH):
    return pd.read_csv(path)


def save_added_node(new_node):
    """추가된 노드를 nodes_added.csv에만 저장"""
    if os.path.exists(NODE_ADDED_PATH):
        df_added = pd.read_csv(NODE_ADDED_PATH)
        df_added = pd.concat([df_added, pd.DataFrame([new_node])], ignore_index=True)
    else:
        df_added = pd.DataFrame([new_node])
    df_added.to_csv(NODE_ADDED_PATH, index=False)


def make_map():
    global df_base

    """기본 노드 = 파란색, 추가 노드 = 빨간색"""

    # 추가 노드 (없으면 빈 DF)
    if os.path.exists(NODE_ADDED_PATH):
        df_added = pd.read_csv(NODE_ADDED_PATH)
    else:
        df_added = pd.DataFrame(columns=["osmid", "lat", "lon"])

    center = [df_base["lat"].mean(), df_base["lon"].mean()]

    m = folium.Map(location=center, zoom_start=14)

    # Esri 타일
    folium.TileLayer(
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attr="Tiles © Esri",
        name="Esri.WorldImagery",
        overlay=False,
        control=True,
    ).add_to(m)

    # 기본 노드 (파란색)
    for _, row in df_base.iterrows():
        folium.CircleMarker(
            location=[row["lat"], row["lon"]],
            radius=2,
            color="blue",
            fill=True,
            fill_opacity=0.7,
            popup=f"osmid: {row['osmid']} (기본)",
        ).add_to(m)

    # 추가 노드 (빨간색)
    for _, row in df_added.iterrows():
        folium.CircleMarker(
            location=[row["lat"], row["lon"]],
            radius=4,
            color="red",
            fill=True,
            fill_opacity=0.9,
            popup=f"osmid: {row['osmid']} (추가)",
        ).add_to(m)

    # 클릭 이벤트
    m.add_child(folium.LatLngPopup())
    return m._repr_html_()


@app.route("/", methods=["GET", "POST"])
def index():
    global df_nodes

    # 처음 접근 시 기본 노드만 로드
    if df_nodes is None:
        df_nodes = df_base

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

        # 전역 데이터프레임에는 누적
        df_nodes = pd.concat([df_nodes, pd.DataFrame([new_node])], ignore_index=True)

        # 새 노드만 별도 저장
        save_added_node(new_node)

        print("새로운 노드를 추가했습니다:", new_node)
        return redirect(url_for("index"))

    # 지도 생성 (기본 + 추가)
    map_html = make_map()
    return render_template("index.html", map_html=map_html)


@app.route("/refresh", methods=["GET"])
def refresh():
    # 새로고침 시에도 기본 + 추가 노드 같이 표시
    map_html = make_map()
    return render_template("index.html", map_html=map_html)


if __name__ == "__main__":
    app.run(debug=True)
