import geopandas as gpd

# GeoJSON 읽기
edges_gdf = gpd.read_file("data/raw/edges.geojson")

# 필요한 컬럼만 선택 (u, v, length, geometry)
edges_gdf = edges_gdf[["u", "v", "length", "geometry"]]

# 새로운 GeoJSON 파일로 저장
edges_gdf.to_file("data/edge/edges_filtered.geojson", driver="GeoJSON", encoding="utf-8")
