

import pandas as pd
import ast
from scipy.spatial import KDTree

# 파일 경로
edges = pd.read_csv('data/raw/edges.csv')
trees = pd.read_csv('data/tree-to-edge/street-tree-simple.csv')

# 나무 위치 리스트 생성 (위도, 경도)
tree_points = [(float(row['수목위도']), float(row['수목경도'])) for _, row in trees.iterrows()]
tree_kdtree = KDTree(tree_points)

def edge_has_tree(coords):
    coords_list = ast.literal_eval(coords)
    for lon, lat in coords_list:
        dist, _ = tree_kdtree.query((lat, lon))
        # 위도/경도 단위에서 0.0002는 약 20m (서울 기준)
        if dist < 0.0002:
            return True
    return False

edges['가로수'] = edges['coordinates'].apply(edge_has_tree)
edges.to_csv('edges_with_tree.csv', index=False)
