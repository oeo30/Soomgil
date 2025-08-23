import pandas as pd
import folium
import json

# 1. 노드 데이터 불러오기
nodes = pd.read_csv('data/raw/nodes.csv')

# 2. 지도 생성 (중심 좌표는 노드 평균값)
center = [nodes['lat'].mean(), nodes['lon'].mean()]
m = folium.Map(location=center, zoom_start=14)

# 3. 엣지(경로) 시각화 (edges.csv 사용)

import ast
edges = pd.read_csv('data/tree-to-edge/edges_with_tree.csv')
for _, row in edges.iterrows():
    coords = ast.literal_eval(row['coordinates'])
    points = [[lat, lon] for lon, lat in coords]
    color = 'green' if row['가로수'] == True or str(row['가로수']).lower() == 'true' else 'red'
    folium.PolyLine(points, color=color, weight=2).add_to(m)

# 4. 노드 시각화 (엣지 위에 보이도록 나중에 그림)
'''
for _, row in nodes.iterrows():
    folium.CircleMarker(
        location=[row['lat'], row['lon']],
        radius=1.5,
        color='grey',
        fill=True,
        fill_color='grey',
        fill_opacity=1,
        popup=str(row['osmid'])
    ).add_to(m)
'''

'''
# 5. street-tree-simple.csv의 나무 위치 시각화 (초록색)
trees = pd.read_csv('data/tree-to-edge/street-tree-simple.csv')
for _, row in trees.iterrows():
    folium.CircleMarker(
        location=[row['수목위도'], row['수목경도']],
        radius=4,
        color='green',
        fill=True,
        fill_color='green',
        fill_opacity=1,
        popup=row['수목명']
    ).add_to(m)
'''

# 6. 지도 저장
m.save('data/tree-to-edge/nodes_edges_map.html')