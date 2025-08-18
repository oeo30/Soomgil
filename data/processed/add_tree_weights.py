import pandas as pd
import geopandas as gpd

# -------------------
# 1) 데이터 불러오기
# -------------------
nodes_df = pd.read_csv("nodes.csv")
edges_gdf = gpd.read_file("edges.geojson")

tree_df = pd.read_csv("../raw/ddm-street-tree.csv")
park_tree_df = pd.read_csv("../raw/ddm-park-tree.csv")

# -------------------
# 2) GeoDataFrame 변환
# -------------------
edges_gdf = edges_gdf.to_crs(epsg=3857)  # meter 단위로 변환 (거리 계산용)

tree_gdf = gpd.GeoDataFrame(
    tree_df,
    geometry=gpd.points_from_xy(tree_df["수목경도"], tree_df["수목위도"]),
    crs="EPSG:4326"
).to_crs(epsg=3857)

park_tree_gdf = gpd.GeoDataFrame(
    park_tree_df,
    geometry=gpd.points_from_xy(park_tree_df["수목경도"], park_tree_df["수목위도"]),
    crs="EPSG:4326"
).to_crs(epsg=3857)

# -------------------
# 3) 거리 계산
# -------------------
edges_gdf["tree_nearest_dist"] = edges_gdf.geometry.apply(
    lambda line: tree_gdf.distance(line).min()
)

edges_gdf["park_tree_nearest_dist"] = edges_gdf.geometry.apply(
    lambda line: park_tree_gdf.distance(line).min()
)

# -------------------
# 4) 가중치 규칙 함수
# -------------------
def weight_func(length, dist):
    if dist < 10:      # 10m 이내
        return length * 0.5
    elif dist < 30:    # 30m 이내
        return length * 0.8
    else:
        return length

# 각각 따로 가중치 계산
edges_gdf["tree_weight"] = edges_gdf.apply(
    lambda row: weight_func(row["length"], row["tree_nearest_dist"]), axis=1
)

edges_gdf["park_tree_weight"] = edges_gdf.apply(
    lambda row: weight_func(row["length"], row["park_tree_nearest_dist"]), axis=1
)

# -------------------
# 5) 저장
# -------------------
# GeoJSON (geometry 포함, 시각화 및 네트워크 분석 가능)
edges_gdf.to_file("edges_with_tree_park_weight.geojson", driver="GeoJSON", encoding="utf-8")

# CSV (geometry 제거, 분석/디버깅용)
edges_gdf.drop(columns="geometry").to_csv(
    "edges_with_tree_park_weight.csv",
    index=False,
    encoding="utf-8-sig"
)

print("✅ edges_with_tree_park_weight.geojson / .csv 저장 완료")