# file: export_walk_ddm.py
import osmnx as ox
import geopandas as gpd

# 예의상 UA 설정(선택)
ox.settings.default_user_agent = "ddm-walk-network/0.1"
ox.settings.overpass_endpoint = "https://overpass-api.de/api"

place = "Dongdaemun-gu, Seoul, South Korea"

# 1) 보행 네트워크 다운로드(Overpass 내부 호출)
G = ox.graph_from_place(place, network_type="walk", simplify=True)

# 2) 노드/엣지 GDF 분리
nodes_gdf, edges_gdf = ox.graph_to_gdfs(G)

# 3) 파일 저장
# 노드: CSV(경도/위도 분리)
nodes_out = nodes_gdf.reset_index()[["osmid", "y", "x"]].rename(columns={"y": "lat", "x": "lon"})
nodes_out.to_csv("nodes.csv", index=False, encoding="utf-8")

# 엣지: GeoJSON(선형 geometry 보존)
# u, v, key 인덱스는 보존하고 geometry 포함해 저장
edges_out = edges_gdf.reset_index()[["u", "v", "key", "length", "highway", "name", "geometry"]]
edges_out.to_file("edges.geojson", driver="GeoJSON")

print("✅ 저장 완료: nodes.csv, edges.geojson")
