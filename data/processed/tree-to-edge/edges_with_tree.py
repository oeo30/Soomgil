import pandas as pd
from scipy.spatial import KDTree
import json

# 파일 경로
with open('data/01_raw/edges.geojson', encoding='utf-8') as f:
    geo = json.load(f)
trees = pd.read_csv('data/02_intermediate/street-tree-simple.csv')

# 나무 위치 리스트 생성 (위도, 경도)
tree_points = [(float(row['수목위도']), float(row['수목경도'])) for _, row in trees.iterrows()]
tree_kdtree = KDTree(tree_points)

for feature in geo['features']:
    coords = feature['geometry']['coordinates']
    has_tree = False
    for lon, lat in coords:
        dist, _ = tree_kdtree.query((lat, lon))
        if dist < 0.0002:  # 약 20m
            has_tree = True
            break
    feature['properties']['가로수'] = has_tree

with open('data/tree-to-edge/edges_with_tree.geojson', 'w', encoding='utf-8') as f:
    f.write('{\n')
    f.write(f'  "type": "{geo["type"]}",\n')
    f.write(f'  "name": "{geo["name"]}",\n')
    f.write(f'  "crs": {json.dumps(geo["crs"])},\n')
    f.write('  "features": [\n')

    num_features = len(geo['features'])
    for i, feature in enumerate(geo['features']):
        feature_string = json.dumps(feature, ensure_ascii=False)
        f.write(f'    {feature_string}')
        if i < num_features - 1:
            f.write(',\n')
        else:
            f.write('\n')

    f.write('  ]\n')
    f.write('}\n')
