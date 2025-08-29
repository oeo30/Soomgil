import json
import pandas as pd
import networkx as nx
from scipy.spatial import KDTree
import os

def get_preference_score(data):
    """매력도 계산 (단순화)"""
    # 공원, 산, 하천을 선호하는 가중치
    type_weight_map = { 
        'park': 0.3, 
        'river': 0.3, 
        'mountain': 0.3, 
        'tree-line': 0.5, 
        'road': 1.5
    }
    
    return type_weight_map.get(data.get('type'), 1.0)

def edge_weight(u, v, G):
    """엣지 가중치 계산 (단순화)"""
    data = G[u][v]
    preference_score = get_preference_score(data)
    return preference_score * data['length']

def find_optimal_path(G, node_pos, start_osmid, dest_osmid):
    """시작점에서 목적지까지의 최적 경로 찾기"""
    # 경로 탐색용 가중치 적용 (매력도+거리)
    for u, v in G.edges():
        G[u][v]['weight'] = edge_weight(u, v, G)
    
    try:
        # 최적 경로 계산 (가중치 반영)
        optimal_path = nx.shortest_path(G, start_osmid, dest_osmid, weight='weight')
        
        # 경로 길이 계산
        path_length = sum(G.edges[optimal_path[i], optimal_path[i+1]]['length'] 
                         for i in range(len(optimal_path)-1))
        
        return optimal_path, path_length
        
    except nx.NetworkXNoPath:
        print(f"error: 시작점 {start_osmid}에서 목적지 {dest_osmid}까지 경로를 찾을 수 없습니다.")
        return None, None

def generate_personalized_route(start_lat, start_lon, destination_lat, destination_lon, destination_name):
    """개인화된 경로 생성 메인 함수 (단순화)"""
    
    # 데이터 로드
    with open('data/04_final_data/final_edges.geojson', encoding='utf-8') as f:
        edges_geo = json.load(f)
    nodes_df = pd.read_csv('data/04_final_data/final_nodes.csv')
    
    # 노드 위치 정보
    node_pos = {row['osmid']: (row['lat'], row['lon']) for _, row in nodes_df.iterrows()}
    
    # 동대문구 전체 그래프 생성
    G = nx.Graph()
    for feature in edges_geo['features']:
        props = feature['properties']
        u, v = props['u'], props['v']
        length = props.get('length', 1)
        type_keys = ['park', 'mountain', 'river', 'tree-line', 'road']
        edge_type = next((k for k in type_keys if props.get(k, 0) == 1), 'road')
        tree_names = props.get('tree', '').split()
        road_name = props.get('name', '')
        G.add_edge(u, v, length=length, type=edge_type, tree=tree_names, road_name=road_name)
    
    print(f"그래프 생성 완료: {G.number_of_nodes()}개 노드, {G.number_of_edges()}개 엣지")
    
    # 시작점과 목적지 노드 찾기
    node_coords = list(node_pos.values())
    node_osmids = list(node_pos.keys())
    kdtree = KDTree(node_coords)
    
    # 시작점 노드 찾기
    _, start_node_idx = kdtree.query([start_lat, start_lon])
    start_osmid = node_osmids[start_node_idx]
    start_node_pos = node_pos[start_osmid]
    
    # 목적지 노드 찾기
    _, dest_node_idx = kdtree.query([destination_lat, destination_lon])
    dest_osmid = node_osmids[dest_node_idx]
    dest_node_pos = node_pos[dest_osmid]
    
    print(f"시작점: {start_osmid} ({start_node_pos[0]:.6f}, {start_node_pos[1]:.6f})")
    print(f"목적지: {dest_osmid} ({dest_node_pos[0]:.6f}, {dest_node_pos[1]:.6f})")
    print(f"목적지명: {destination_name}")
    
    # 경로 찾기
    optimal_path, path_length = find_optimal_path(G, node_pos, start_osmid, dest_osmid)
    
    if not optimal_path:
        print("경로를 찾을 수 없습니다.")
        return None, None
    
    print(f"경로 찾기 성공!")
    print(f"경로 길이: {path_length/1000:.2f} km")
    print(f"예상 소요 시간: {path_length/1000/3.5*60:.0f}분 (보행 속도 3.5km/h 기준)")
    print(f"경로 노드 수: {len(optimal_path)}개")
    

    
    # GeoJSON으로 경로 저장
    coords = [node_pos[node] for node in optimal_path]
    
    geojson_feature = {
        "type": "Feature",
        "properties": {
            "name": f"{destination_name}까지의 경로",
            "destination": destination_name,
            "length_km": round(path_length/1000, 2),
            "estimated_time_min": round(path_length/1000/3.5*60, 0),

        },
        "geometry": {
            "type": "LineString",
            "coordinates": [[lon, lat] for lat, lon in coords]
        }
    }
    
    geojson_obj = {
        "type": "FeatureCollection",
        "features": [geojson_feature]
    }
    
    # GeoJSON 파일 저장
    with open('backend/app/services/personalization/personalized_route.geojson', 'w', encoding='utf-8') as f:
        json.dump(geojson_obj, f, ensure_ascii=False, indent=2)
    print('personalized_route.geojson 파일로 경로가 저장되었습니다.')
    
    # 감성적인 경로 설명 생성
    length_km = round(path_length/1000, 1)
    time_min = round(path_length/1000/3.5*60, 0)
    
    # 감성적인 설명 템플릿
    emotional_descriptions = [
        f"잔잔한 길을 따라 걷다 보면 {destination_name}에 닿습니다. 총 {length_km}km, 약 {time_min}분의 여유로운 산책길입니다.",
        f"고요한 길을 걸어 {destination_name}로 향합니다. 총 {length_km}km, 약 {time_min}분의 평화로운 산책길입니다.",
        f"부드러운 길을 따라 걷다 보면 {destination_name}에 도착합니다. 총 {length_km}km, 약 {time_min}분의 힐링 산책길입니다.",
        f"차분한 길을 걸어 {destination_name}까지 향합니다. 총 {length_km}km, 약 {time_min}분의 아름다운 산책길입니다.",
        f"편안한 길을 따라 걷다 보면 {destination_name}에 닿습니다. 총 {length_km}km, 약 {time_min}분의 고요한 산책길입니다."
    ]
    
    import random
    selected_description = random.choice(emotional_descriptions)
    
    description_data = {
        "description": selected_description
    }
    
    with open('backend/app/services/personalization/personalized_description.json', 'w', encoding='utf-8') as f:
        json.dump(description_data, f, ensure_ascii=False, indent=2)
    print('personalized_description.json 파일로 경로 설명이 저장되었습니다.')
    

    
    return geojson_obj, description_data

if __name__ == "__main__":
    # 환경변수에서 파라미터 가져오기
    start_lat = float(os.environ.get('START_LAT', 37.575785))
    start_lon = float(os.environ.get('START_LON', 127.048772))
    destination_lat = float(os.environ.get('DEST_LAT', 37.57982305))
    destination_lon = float(os.environ.get('DEST_LON', 127.05931575))
    destination_name = os.environ.get('DEST_NAME', "아름드리 어린이 공원")
    
    print(f"파라미터: 시작점({start_lat}, {start_lon}) -> 목적지({destination_lat}, {destination_lon}) - {destination_name}")
    
    generate_personalized_route(start_lat, start_lon, destination_lat, destination_lon, destination_name)
