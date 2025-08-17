import folium
import geopandas as gpd
import pandas as pd

# 1) 데이터 읽기
nodes_df = pd.read_csv("/Users/minju/Practice/2025_K_HTML_Hackathon/Soomgil/path/test_minju/nodes.csv")
edges_gdf = gpd.read_file("/Users/minju/Practice/2025_K_HTML_Hackathon/Soomgil/path/test_minju/edges.geojson")

# tree.csv 읽기
tree_df = pd.read_csv(
    "/Users/minju/Practice/2025_K_HTML_Hackathon/Soomgil/path/test_minju/tree.csv",
    encoding="cp949"
)

# park_tree.csv 읽기
park_tree_df = pd.read_csv(
    "/Users/minju/Practice/2025_K_HTML_Hackathon/Soomgil/path/test_minju/park_tree.csv",
    encoding="cp949"
)

# 2) 지도 중심 좌표
center_lat = nodes_df["lat"].mean()
center_lon = nodes_df["lon"].mean()
m = folium.Map(location=[center_lat, center_lon], zoom_start=14)

# 기본 타일레이어
folium.TileLayer(
    tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr='Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    name='Esri.WorldImagery',
    overlay=False,
    control=True
).add_to(m)

# 3) edges.geojson 시각화
available_fields = list(edges_gdf.columns)
tooltip_fields = [f for f in ["name", "highway", "length"] if f in available_fields]

folium.GeoJson(
    data=edges_gdf.to_json(),
    name="walk_edges",
    style_function=lambda _feat: {"color": "#3388ff", "weight": 3, "opacity": 0.9},
    tooltip=folium.features.GeoJsonTooltip(fields=tooltip_fields, aliases=tooltip_fields, sticky=False)
).add_to(m)

# 4) 노드 표시
for _, row in nodes_df.iterrows():
    folium.CircleMarker(
        location=[row["lat"], row["lon"]],
        radius=2,
        color="#ff6b6b",
        fill=True,
        fill_opacity=0.8
    ).add_to(m)

# 5) 나무 위치 표시 (tree.csv)
for _, row in tree_df.iterrows():
    folium.CircleMarker(
        location=[row["수목위도"], row["수목경도"]],
        radius=3,
        color="lime",
        fill=True,
        fill_opacity=0.7,
        tooltip=f"관리번호: {row['관리번호']}"
    ).add_to(m)

# 6) 공원 나무 위치 표시 (park_tree.csv)
for _, row in park_tree_df.iterrows():
    folium.CircleMarker(
        location=[row["수목위도"], row["수목경도"]],
        radius=3,
        color="darkgreen",
        fill=True,
        fill_opacity=0.7,
        tooltip=f"관리번호: {row['관리번호']}"
    ).add_to(m)

# 레이어 컨트롤
folium.LayerControl(collapsed=False).add_to(m)

m.save("dongdaemun_walk_network_with_trees.html")
print("✅ dongdaemun_walk_network_with_trees.html 생성 완료")
