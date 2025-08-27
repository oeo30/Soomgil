import pandas as pd

import folium
import json
import pandas as pd

# 데이터 경로
edges_path = "data/03_processed/add_tag/final_edges_with_tag.geojson"
nodes_path = "data/03_processed/add_node/final_nodes.csv"

# 데이터 로드
with open(edges_path, encoding="utf-8") as f:
    edges_geo = json.load(f)
nodes_df = pd.read_csv(nodes_path)

# 색상 매핑 함수
def get_edge_color(props):
    if props.get("park") == 1:
        return "coral"
    elif props.get("tree-line") == 1:
        return "green"
    elif props.get("river") == 1:
        return "blue"
    elif props.get("mountain") == 1:
        return "purple"
    else:
        return "darkgray"

# 지도 중심 계산
center_lat = nodes_df["lat"].mean()
center_lon = nodes_df["lon"].mean()
m = folium.Map(location=[center_lat, center_lon], zoom_start=14)

# 노드 시각화 (회색)
for _, row in nodes_df.iterrows():
    folium.CircleMarker(
        location=[row["lat"], row["lon"]],
        radius=1,
        color="grey",
        fill=True,
        fill_opacity=0.5
    ).add_to(m)

# 엣지 시각화
for feature in edges_geo["features"]:
    props = feature["properties"]
    color = get_edge_color(props)
    folium.GeoJson(
        feature["geometry"],
        style_function=lambda feat, color=color: {
            "color": color,
            "weight": 3,
            "opacity": 0.8
        }
    ).add_to(m)

# 지도 저장
m.save("data/03_processed/add_tag/final_tag_map.html")


