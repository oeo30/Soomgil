import json
import pandas as pd
from scipy.spatial import KDTree

# 파일 경로
edges_path = 'data/03_processed/add_tag/final_edges_with_tag.geojson'
tree_path = 'data/03_processed/add_tree/merged_tree_data.csv'

# 데이터 로드
with open(edges_path, encoding='utf-8') as f:
	edges_geo = json.load(f)
tree_df = pd.read_csv(tree_path)

# 나무 위치 및 이름 리스트
tree_points = [(float(row['수목위도']), float(row['수목경도'])) for _, row in tree_df.iterrows()]
tree_names = [row['수목명'] for _, row in tree_df.iterrows()]
tree_kdtree = KDTree(tree_points)

# 엣지별 tree 속성 추가
for feature in edges_geo['features']:
	coords = feature['geometry']['coordinates']
	edge_trees = set()
	for lon, lat in coords:
		# 가장 가까운 나무 찾기 (20m 이내)
		dist, idx = tree_kdtree.query((lat, lon))
		if dist < 0.0002:
			edge_trees.add(tree_names[idx])
	feature['properties']['tree'] = ' '.join(sorted(edge_trees)) if edge_trees else ''

# 저장
with open('data/03_processed/add_tree/final_edges_with_type_and_tree.geojson', 'w', encoding='utf-8') as f:
    f.write('{\n')
    f.write(f'  "type": "{edges_geo["type"]}",\n')
    if "name" in edges_geo:
        f.write(f'  "name": "{edges_geo["name"]}",\n')
    if "crs" in edges_geo:
        f.write(f'  "crs": {json.dumps(edges_geo["crs"])},\n')
    f.write('  "features": [\n')

    num_features = len(edges_geo['features'])
    for i, feature in enumerate(edges_geo['features']):
        feature_string = json.dumps(feature, ensure_ascii=False)
        f.write(f'    {feature_string}')
        if i < num_features - 1:
            f.write(',\n')
        else:
            f.write('\n')

    f.write('  ]\n')
    f.write('}\n')