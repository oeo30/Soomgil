import folium
import geopandas as gpd
import pandas as pd
import os

data_dir = "path/test_seyeon"
# 1) 데이터 읽기

nodes_df = pd.read_csv("path/test_seyeon/nodes.csv")
edges_gdf = gpd.read_file("path/test_seyeon/edges.geojson")

# 2) 지도 중심 좌표
center_lat = nodes_df["lat"].mean()
center_lon = nodes_df["lon"].mean()
m = folium.Map(location=[center_lat, center_lon], zoom_start=14, tiles="cartodbpositron")

# 3) edges.geojson에 없는 컬럼 제거
available_fields = list(edges_gdf.columns)
tooltip_fields = [f for f in ["name", "highway", "length"] if f in available_fields]

folium.GeoJson(
    data=edges_gdf.to_json(),
    name="walk_edges",
    style_function=lambda _feat: {"color": "#3388ff", "weight": 3, "opacity": 0.9},
    tooltip=folium.features.GeoJsonTooltip(fields=tooltip_fields, aliases=tooltip_fields, sticky=False)
).add_to(m)

# 4) 노드 표시 (옵션)
show_nodes = True
if show_nodes:
    for _, row in nodes_df.iterrows():
        folium.CircleMarker(
            location=[row["lat"], row["lon"]],
            radius=2,
            color="#ff6b6b",
            fill=True,
            fill_opacity=0.8
        ).add_to(m)

folium.LayerControl(collapsed=False).add_to(m)
output_path = os.path.join(data_dir, "dongdaemun_walk_network_from_files.html")
m.save(output_path)
print(f"✅ HTML 파일 생성 완료: {output_path}")

