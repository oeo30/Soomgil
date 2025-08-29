import json
import random
import math
import os
import sys
import pandas as pd
import networkx as nx
from scipy.spatial import KDTree
from typing import Dict, List, Optional, Tuple

# 거리 계산 함수
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """두 지점 간의 거리를 km 단위로 계산 (Haversine 공식)"""
    R = 6371  # 지구의 반지름 (km)
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return distance

# 코스 거리 범위 정의
COURSE_DISTANCES = {
    'short': {'min': 0.0, 'max': 1.0, 'name': '짧은 코스'},
    'medium': {'min': 1.0, 'max': 2.5, 'name': '적당한 코스'},
    'long': {'min': 2.5, 'max': 5.0, 'name': '긴 코스'}
}

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

def load_place_data():
    """data.json과 place_coordinates.py에서 장소 데이터 로드"""
    try:
        # data.json 로드
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(current_dir, '..', 'personalization', 'data.json')
        
        with open(data_path, 'r', encoding='utf-8') as f:
            place_data = json.load(f)
        
        # place_coordinates.py에서 좌표 데이터 가져오기
        sys_path = os.path.join(current_dir, '..', 'personalization')
        sys.path.append(sys_path)
        from place_coordinates import PLACE_COORDINATES
        
        return place_data, PLACE_COORDINATES
        
    except Exception as e:
        print(f"장소 데이터 로드 오류: {e}")
        return None, None

def get_all_places_with_coordinates():
    """모든 장소와 좌표를 리스트로 반환"""
    place_data, coordinates = load_place_data()
    
    if not place_data or not coordinates:
        return []
    
    all_places = []
    
    # 공원 (어린이공원 + 일반공원)
    if "공원" in place_data:
        park_data = place_data["공원"]
        if isinstance(park_data, dict):
            for sub_type, places in park_data.items():
                for place in places:
                    if place in coordinates:
                        all_places.append({
                            'name': place,
                            'type': '공원',
                            'sub_type': sub_type,
                            'coordinates': coordinates[place]
                        })
        else:
            # 기존 방식 (하위분류 없는 경우)
            for place in park_data:
                if place in coordinates:
                    all_places.append({
                        'name': place,
                        'type': '공원',
                        'sub_type': None,
                        'coordinates': coordinates[place]
                    })
    
    # 다른 유형들 (산, 하천)
    for place_type, places in place_data.items():
        if place_type != "공원":
            if isinstance(places, list):
                for place in places:
                    if place in coordinates:
                        all_places.append({
                            'name': place,
                            'type': place_type,
                            'sub_type': None,
                            'coordinates': coordinates[place]
                        })
    
    return all_places

def recommend_place_by_duration(current_lat: float, current_lon: float, user_preference: str) -> Dict:
    """사용자 선호도에 따른 장소 추천"""
    try:
        # 모든 장소와 좌표 가져오기
        all_places = get_all_places_with_coordinates()
        
        if not all_places:
            return {
                'success': False,
                'error': '장소 데이터를 불러올 수 없습니다.'
            }
        
        # 사용자 선호도에 따른 거리 범위 결정 (반대 성향 추천)
        if user_preference == 'short':
            # 짧은 산책 선호 → 긴 코스 추천
            distance_range = COURSE_DISTANCES['long']
        elif user_preference == 'long':
            # 긴 산책 선호 → 짧은 코스 추천
            distance_range = COURSE_DISTANCES['short']
        else:  # medium
            # 적당한 산책 선호 → 긴 코스 추천
            distance_range = COURSE_DISTANCES['long']
        
        # 각 장소까지의 거리 계산 및 필터링
        suitable_places = []
        
        for place in all_places:
            place_lat = place['coordinates']['lat']
            place_lon = place['coordinates']['lng']
            
            distance = calculate_distance(current_lat, current_lon, place_lat, place_lon)
            
            # 거리 범위에 맞는 장소들 필터링
            if distance_range['min'] <= distance <= distance_range['max']:
                suitable_places.append({
                    **place,
                    'distance': distance
                })
        
        if not suitable_places:
            return {
                'success': False,
                'error': f'{distance_range["name"]} 거리 범위에 맞는 장소가 없습니다.'
            }
        
        # 적합한 장소들 중 랜덤 선택
        recommended_place = random.choice(suitable_places)
        
        return {
            'success': True,
            'recommended_place': {
                'name': recommended_place['name'],
                'type': recommended_place['type'],
                'sub_type': recommended_place['sub_type'],
                'coordinates': recommended_place['coordinates'],
                'distance': recommended_place['distance']
            },
            'distance_range': distance_range,
            'total_candidates': len(suitable_places)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'장소 추천 중 오류 발생: {str(e)}'
        }

def generate_duration_based_route(start_lat: float, start_lon: float, user_preference: str) -> Dict:
    """시간대별 개인화 경로 생성 (실제 도로 경로)"""
    try:
        # 장소 추천
        recommendation = recommend_place_by_duration(start_lat, start_lon, user_preference)
        
        if not recommendation['success']:
            return recommendation
        
        recommended_place = recommendation['recommended_place']
        destination_lat = recommended_place['coordinates']['lat']
        destination_lon = recommended_place['coordinates']['lng']
        destination_name = recommended_place['name']
        
        print(f"🎯 추천 장소: {destination_name} ({destination_lat}, {destination_lon})")
        
        # 실제 도로 경로 생성
        try:
            # 데이터 로드
            current_dir = os.path.dirname(os.path.abspath(__file__))
            edges_path = os.path.join(current_dir, '..', '..', '..', '..', 'data', '04_final_data', 'final_edges.geojson')
            nodes_path = os.path.join(current_dir, '..', '..', '..', '..', 'data', '04_final_data', 'final_nodes.csv')
            
            with open(edges_path, encoding='utf-8') as f:
                edges_geo = json.load(f)
            nodes_df = pd.read_csv(nodes_path)
            
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
            
            # 경로 찾기
            optimal_path, path_length = find_optimal_path(G, node_pos, start_osmid, dest_osmid)
            
            if not optimal_path:
                print("경로를 찾을 수 없습니다. 직선 경로로 대체합니다.")
                # 직선 경로로 대체
                route_geojson = {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "properties": {
                                "name": f"{destination_name}까지의 {recommendation['distance_range']['name']}",
                                "length_km": round(recommended_place['distance'], 2),
                                "estimated_time_min": int(recommended_place['distance'] * 20),
                                "destination": destination_name,
                                "course_type": recommendation['distance_range']['name']
                            },
                            "geometry": {
                                "type": "LineString",
                                "coordinates": [
                                    [start_lon, start_lat],
                                    [destination_lon, destination_lat]
                                ]
                            }
                        }
                    ]
                }
            else:
                print(f"경로 찾기 성공!")
                print(f"경로 길이: {path_length/1000:.2f} km")
                print(f"예상 소요 시간: {path_length/1000/3.5*60:.0f}분 (보행 속도 3.5km/h 기준)")
                print(f"경로 노드 수: {len(optimal_path)}개")
                
                # GeoJSON으로 경로 저장
                coords = [node_pos[node] for node in optimal_path]
                
                route_geojson = {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "properties": {
                                "name": f"{destination_name}까지의 {recommendation['distance_range']['name']}",
                                "length_km": round(path_length/1000, 2),
                                "estimated_time_min": round(path_length/1000/3.5*60, 0),
                                "destination": destination_name,
                                "course_type": recommendation['distance_range']['name']
                            },
                            "geometry": {
                                "type": "LineString",
                                "coordinates": [[lon, lat] for lat, lon in coords]
                            }
                        }
                    ]
                }
            
            # 경로 설명 생성
            if optimal_path:
                length_km = round(path_length/1000, 1)
                time_min = round(path_length/1000/3.5*60)  # 정수로 반올림
                description = f"🌱 {destination_name}까지의 {recommendation['distance_range']['name']}입니다. "
                description += f"총 거리는 {length_km}km로, "
                description += f"약 {time_min}분 정도 소요됩니다."
            else:
                description = f"🌱 {destination_name}까지의 {recommendation['distance_range']['name']}입니다. "
                description += f"총 거리는 {round(recommended_place['distance'], 1)}km로, "
                description += f"약 {round(recommended_place['distance'] * 20)}분 정도 소요됩니다."
            
            return {
                'success': True,
                'geojson': route_geojson,
                'description': description,
                'recommended_place': recommended_place,
                'distance_range': recommendation['distance_range']
            }
            
        except Exception as route_error:
            print(f"실제 경로 생성 실패: {route_error}")
            # 직선 경로로 대체
            route_geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "name": f"{destination_name}까지의 {recommendation['distance_range']['name']}",
                            "length_km": round(recommended_place['distance'], 2),
                            "estimated_time_min": int(recommended_place['distance'] * 20),
                            "destination": destination_name,
                            "course_type": recommendation['distance_range']['name']
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [start_lon, start_lat],
                                [destination_lon, destination_lat]
                            ]
                        }
                    }
                ]
            }
            
            description = f"🌱 {destination_name}까지의 {recommendation['distance_range']['name']}입니다. "
            description += f"총 거리는 {round(recommended_place['distance'], 1)}km로, "
            description += f"약 {int(recommended_place['distance'] * 20)}분 정도 소요됩니다."
            
            return {
                'success': True,
                'geojson': route_geojson,
                'description': description,
                'recommended_place': recommended_place,
                'distance_range': recommendation['distance_range']
            }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'경로 생성 중 오류 발생: {str(e)}'
        }

# 테스트 함수
def test_duration_route():
    """시간대별 경로 추천 시스템 테스트"""
    print("=== 시간대별 경로 추천 시스템 테스트 ===")
    
    # 테스트 위치 (동대문구 중심)
    test_lat, test_lon = 37.5839, 127.0559
    
    # 모든 장소와 거리 확인
    print(f"\n--- 모든 장소 거리 확인 (시작점: {test_lat}, {test_lon}) ---")
    all_places = get_all_places_with_coordinates()
    
    for place in all_places:
        place_lat = place['coordinates']['lat']
        place_lon = place['coordinates']['lng']
        distance = calculate_distance(test_lat, test_lon, place_lat, place_lon)
        print(f"{place['name']}: {distance:.3f}km")
    
    # 각 선호도별 테스트
    for preference in ['short', 'medium', 'long']:
        print(f"\n--- {COURSE_DISTANCES[preference]['name']} 테스트 ---")
        
        result = generate_duration_based_route(test_lat, test_lon, preference)
        
        if result['success']:
            place = result['recommended_place']
            print(f"추천 장소: {place['name']}")
            print(f"거리: {place['distance']:.2f}km")
            print(f"설명: {result['description']}")
        else:
            print(f"오류: {result['error']}")

if __name__ == "__main__":
    test_duration_route()
