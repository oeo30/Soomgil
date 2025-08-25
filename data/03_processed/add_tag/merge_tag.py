import json

# 파일 경로
polygon_path = "data/03_processed/add_tag/edges_with_polygon.geojson"
tree_path = "data/03_processed/add_tag/edges_with_tree.geojson"
output_path = "data/03_processed/add_tag/final_edges_with_tag.geojson"

# 파일 로드
def load_geojson(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

polygon_data = load_geojson(polygon_path)
tree_data = load_geojson(tree_path)

# tree geojson의 (u,v)별 tree-line 속성 dict 생성
tree_dict = {}
for feat in tree_data["features"]:
    props = feat["properties"]
    key = (props.get("u"), props.get("v"))
    tree_dict[key] = props.get("tree-line", 0)  # tree_line이 없으면 0

# park/mountain/river 속성 우선, 없으면 tree-line
for feat in polygon_data["features"]:
    props = feat["properties"]
    u, v = props.get("u"), props.get("v")
    if props.get("park", 1) or props.get("mountain", 1) or props.get("river", 1):
        props["tree-line"] = 0
        props["road"] = 0
        continue
    else:
        tree_line = tree_dict.get((u, v), 0)
        if(tree_line == 1):
            props["tree-line"] = 1
            props["road"] = 0
        else:
            props["tree-line"] = 0
            props["road"] = 1

# 저장 (줄바꿈 및 들여쓰기 맞춤)
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('{\n')
    f.write(f'  "type": "{polygon_data["type"]}",\n')
    if "name" in polygon_data:
        f.write(f'  "name": "{polygon_data["name"]}",\n')
    if "crs" in polygon_data:
        f.write(f'  "crs": {json.dumps(polygon_data["crs"])},\n')
    f.write('  "features": [\n')

    num_features = len(polygon_data['features'])
    for i, feature in enumerate(polygon_data['features']):
        feature_string = json.dumps(feature, ensure_ascii=False)
        f.write(f'    {feature_string}')
        if i < num_features - 1:
            f.write(',\n')
        else:
            f.write('\n')

    f.write('  ]\n')
    f.write('}\n')