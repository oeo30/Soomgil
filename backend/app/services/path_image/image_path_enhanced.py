import cv2
import numpy as np
import pandas as pd
import geopandas as gpd
import networkx as nx
import folium
from sklearn.neighbors import BallTree
from geopy.distance import geodesic
from IPython.display import IFrame
from scipy.spatial.distance import euclidean
from functools import lru_cache
import json
from datetime import datetime
import os

# GeoJSON 생성 함수들을 직접 정의 (geojson_generator.py 통합)

def create_enhanced_geojson(best_path, best_contour, target_len, best_score, image_name="custom_image", center_lat=None, center_lon=None):
    """
    향상된 GeoJSON 파일 생성 함수
    
    Args:
        best_path: 최적화된 산책 경로 좌표 리스트 [(lat, lon), ...]
        best_contour: 원본 윤곽선 좌표 리스트 [(lat, lon), ...]
        target_len: 목표 거리 (미터)
        best_score: Fréchet 거리 점수
        image_name: 이미지 파일명
        center_lat: 중심 위도
        center_lon: 중심 경도
    
    Returns:
        tuple: (geojson_data, timestamp)
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 경로 거리 계산 (미터 단위)
    def calculate_distance(coords):
        if not coords or len(coords) < 2:
            return 0
        
        total_distance = 0
        for i in range(len(coords) - 1):
            lat1, lon1 = coords[i]
            lat2, lon2 = coords[i + 1]
            # geodesic 거리 계산 (더 정확함)
            distance = geodesic((lat1, lon1), (lat2, lon2)).meters
            total_distance += distance
        return total_distance
    
    actual_distance = calculate_distance(best_path) if best_path else 0
    
    # 경로 Feature
    route_feature = {
        "type": "Feature",
        "properties": {
            "name": f"Custom Walk Route - {image_name}",
            "description": f"Generated from image contour on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "target_distance_km": round(target_len / 1000, 2),
            "actual_distance_km": round(actual_distance / 1000, 2),
            "frechet_distance": round(best_score, 6),
            "total_points": len(best_path) if best_path else 0,
            "type": "route",
            "color": "#0066cc",
            "weight": 3,
            "opacity": 0.9
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [[lon, lat] for lat, lon in best_path] if best_path else []
        }
    }
    
    # 윤곽선 Feature
    contour_feature = {
        "type": "Feature",
        "properties": {
            "name": f"Original Contour - {image_name}",
            "description": "Original image contour outline",
            "type": "contour",
            "color": "#ff0000",
            "weight": 2,
            "opacity": 0.9
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [[lon, lat] for lat, lon in best_contour] if best_contour else []
        }
    }
    
    # FeatureCollection
    feature_collection = {
        "type": "FeatureCollection",
        "properties": {
            "generated_at": datetime.now().isoformat(),
            "image_source": image_name,
            "target_distance_m": target_len,
            "actual_distance_m": actual_distance,
            "frechet_score": best_score,
            "center_lat": center_lat,
            "center_lon": center_lon,
            "route_points": len(best_path) if best_path else 0,
            "contour_points": len(best_contour) if best_contour else 0
        },
        "features": [route_feature, contour_feature]
    }
    
    return feature_collection, timestamp

def print_route_summary(geojson_data):
    """
    경로 정보 요약 출력
    
    Args:
        geojson_data: GeoJSON 데이터
    """
    props = geojson_data['properties']
    
    print("🎯 경로 생성 완료!")
    print("=" * 50)
    print(f"📊 경로 정보:")
    print(f"   - 목표 거리: {props['target_distance_m']/1000:.2f}km")
    print(f"   - 실제 거리: {props['actual_distance_m']/1000:.2f}km")
    print(f"   - 총 포인트: {props['route_points']}개")
    print(f"   - Fréchet 거리: {props['frechet_score']:.6f}")
    print(f"   - 생성 시간: {props['generated_at']}")
    print(f"   - 이미지 소스: {props['image_source']}")
    print("=" * 50)

def contour_length(contour):
    """윤곽선 길이 계산"""
    return np.sum(np.sqrt(np.sum(np.diff(contour, axis=0)**2, axis=1)))

def extract_contour_from_image(image_path):
    """이미지에서 윤곽선 추출"""
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"이미지를 불러올 수 없습니다: {image_path}")
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    kernel = np.ones((5,5), np.uint8)
    closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise ValueError("윤곽선을 찾을 수 없습니다.")
    
    contour = max(contours, key=cv2.contourArea)
    epsilon = 3.0
    approx = cv2.approxPolyDP(contour, epsilon, True)
    contour = approx.reshape(-1, 2)
    
    return contour

def load_network_data():
    """네트워크 데이터 로딩"""
    # 상대 경로로 데이터 파일 접근
    nodes_path = "../../../../data/04_final_data/final_nodes.csv"
    edges_path = "../../../../data/04_final_data/final_edges.geojson"
    
    print(f"📁 데이터 파일 경로:")
    print(f"   - nodes: {nodes_path}")
    print(f"   - edges: {edges_path}")
    print(f"   - 존재 여부: {os.path.exists(nodes_path)}, {os.path.exists(edges_path)}")
    
    nodes = pd.read_csv(nodes_path)
    edges = gpd.read_file(edges_path)
    
    G = nx.Graph()
    for _, row in nodes.iterrows():
        G.add_node(row["osmid"], x=row["lon"], y=row["lat"])
    for _, row in edges.iterrows():
        G.add_edge(row["u"], row["v"], weight=row["length"])
    
    return G, nodes, edges

def calculate_bbox_info(nodes):
    """bbox 정보 계산"""
    min_lon, max_lon = nodes["lon"].min(), nodes["lon"].max()
    min_lat, max_lat = nodes["lat"].min(), nodes["lat"].max()
    center_lat, center_lon = nodes["lat"].mean(), nodes["lon"].mean()
    
    # bbox 실제 크기(m) 계산
    bbox_width_m = geodesic((center_lat, min_lon), (center_lat, max_lon)).m
    bbox_height_m = geodesic((min_lat, center_lon), (max_lat, center_lon)).m
    
    return {
        'min_lon': min_lon, 'max_lon': max_lon,
        'min_lat': min_lat, 'max_lat': max_lat,
        'center_lat': center_lat, 'center_lon': center_lon,
        'bbox_width_m': bbox_width_m, 'bbox_height_m': bbox_height_m
    }

def scale_contour(contour, target_len, bbox_info):
    """윤곽선 스케일링"""
    contour_w = contour[:,0].max() - contour[:,0].min()
    contour_h = contour[:,1].max() - contour[:,1].min()
    
    # 픽셀 → 미터 변환 계수
    px_to_m_x = bbox_info['bbox_width_m'] / contour_w
    px_to_m_y = bbox_info['bbox_height_m'] / contour_h
    px_to_m = (px_to_m_x + px_to_m_y) / 2
    
    # 윤곽선 둘레길이 (픽셀 단위)
    orig_len_px = contour_length(contour)
    
    # 스케일 팩터 계산
    scale_factor = target_len / (orig_len_px * px_to_m)
    
    # 스케일링 적용
    contour_scaled = (contour - contour.mean(0)) * scale_factor + contour.mean(0)
    
    return contour_scaled, px_to_m

def contour_to_geo(contour_scaled, px_to_m, bbox_info, dx=0, dy=0):
    """윤곽선을 위경도로 변환"""
    geo_points = []
    center_lat, center_lon = bbox_info['center_lat'], bbox_info['center_lon']
    
    for px, py in contour_scaled:
        # 픽셀 → 미터
        dx_m = (px - contour_scaled[:,0].mean()) * px_to_m
        dy_m = (py - contour_scaled[:,1].mean()) * px_to_m
        
        # 미터 → 위경도 변환
        lon = center_lon + (dx_m / (111320 * np.cos(np.radians(center_lat)))) + dx
        lat = center_lat - (dy_m / 110540) + dy
        
        geo_points.append((lat, lon))
    return geo_points

def edge_cost(u, n, target_vec, G):
    """엣지 비용 계산"""
    ux, uy = G.nodes[u]["x"], G.nodes[u]["y"]
    nx_, ny_ = G.nodes[n]["x"], G.nodes[n]["y"]
    
    vec = np.array([nx_ - ux, ny_ - uy])
    if np.linalg.norm(vec) < 1e-6:
        return 1e9
    
    cos_sim = np.dot(vec, target_vec) / (np.linalg.norm(vec) * np.linalg.norm(target_vec) + 1e-9)
    dist = np.linalg.norm(vec)
    
    return dist * (1 - cos_sim)

def build_route(contour_geo, G, nodes):
    """경로 생성"""
    coords = np.vstack((nodes["lat"], nodes["lon"])).T
    tree = BallTree(np.radians(coords), metric="haversine")
    
    contour_sampled = contour_geo[::max(1, len(contour_geo)//100)]
    
    snapped_nodes = []
    for lat, lon in contour_sampled:
        _, idx = tree.query([np.radians([lat, lon])], k=1)
        node = nodes.iloc[idx[0][0]]
        snapped_nodes.append(node["osmid"])
    
    route_coords = []
    for i in range(len(snapped_nodes) - 1):
        u, v = snapped_nodes[i], snapped_nodes[i+1]
        
        ux, uy = G.nodes[u]["x"], G.nodes[u]["y"]
        vx, vy = G.nodes[v]["x"], G.nodes[v]["y"]
        target_vec = np.array([vx - ux, vy - uy])
        
        def weight_func(a, b, d):
            return edge_cost(a, b, target_vec, G)
        
        try:
            path = nx.dijkstra_path(G, u, v, weight=weight_func)
            for n in path:
                route_coords.append((G.nodes[n]["y"], G.nodes[n]["x"]))
        except nx.NetworkXNoPath:
            continue
    return route_coords

@lru_cache(maxsize=None)
def _c(i, j, P, Q):
    """Fréchet distance 계산 (캐시된 버전)"""
    if i == 0 and j == 0:
        return euclidean(P[0], Q[0])
    elif i > 0 and j == 0:
        return max(_c(i-1, 0, P, Q), euclidean(P[i], Q[0]))
    elif i == 0 and j > 0:
        return max(_c(0, j-1, P, Q), euclidean(P[0], Q[j]))
    elif i > 0 and j > 0:
        return max(
            min(_c(i-1, j, P, Q), _c(i-1, j-1, P, Q), _c(i, j-1, P, Q)),
            euclidean(P[i], Q[j])
        )
    else:
        return float("inf")

def frechet_distance(P, Q):
    """Fréchet distance 계산"""
    P = tuple(map(tuple, P))
    Q = tuple(map(tuple, Q))
    return _c(len(P)-1, len(Q)-1, P, Q)

def find_optimal_route(contour_scaled, px_to_m, bbox_info, G, nodes, target_len):
    """최적 경로 탐색"""
    best_path = None
    best_score = float("inf")
    best_contour = None
    
    # 슬라이딩 탐색
    dx_vals = np.linspace(bbox_info['min_lon'] - bbox_info['center_lon'], 
                         bbox_info['max_lon'] - bbox_info['center_lon'], 15)
    dy_vals = np.linspace(bbox_info['min_lat'] - bbox_info['center_lat'], 
                         bbox_info['max_lat'] - bbox_info['center_lat'], 15)
    
    for dx in dx_vals:
        for dy in dy_vals:
            shifted = contour_to_geo(contour_scaled, px_to_m, bbox_info, dx=dx, dy=dy)
            route_coords = build_route(shifted, G, nodes)
            if not route_coords:
                continue
            score = frechet_distance(np.array(shifted), np.array(route_coords))
            if score < best_score:
                best_score = score
                best_path = route_coords
                best_contour = shifted
    
    return best_path, best_contour, best_score

def create_visualization(best_path, best_contour, edges, bbox_info, output_path="map.html"):
    """시각화 생성"""
    m = folium.Map(location=[bbox_info['center_lat'], bbox_info['center_lon']], 
                   zoom_start=14, tiles="cartodbpositron")
    
    # 네트워크 전체 (회색)
    for _, row in edges.iterrows():
        coords_edge = list(row["geometry"].coords)
        folium.PolyLine([(lat, lon) for lon, lat in coords_edge],
                        color="gray", weight=1, opacity=0.3).add_to(m)
    
    # 빨강 윤곽선 (최적 위치)
    if best_contour:
        folium.PolyLine(best_contour, color="red", weight=2, opacity=0.9, 
                       tooltip="최적 윤곽선").add_to(m)
    
    # 파랑 경로 (엣지 기반 + Fréchet distance 최적화)
    if best_path:
        folium.PolyLine(best_path, color="blue", weight=3, opacity=0.9, 
                       tooltip="산책 경로").add_to(m)
    
    m.save(output_path)
    return output_path

def generate_custom_route(image_path, target_len=5000, output_dir="./"):
    """
    메인 함수: 이미지에서 커스텀 산책로 생성
    
    Args:
        image_path: 입력 이미지 경로
        target_len: 목표 거리 (미터)
        output_dir: 출력 디렉토리
    
    Returns:
        str: 생성된 GeoJSON 파일 경로
    """
    try:
        print(f"🖼️ 이미지 처리 중: {image_path}")
        print(f"📁 이미지 파일 존재 여부: {os.path.exists(image_path)}")
        print(f"📁 이미지 파일 크기: {os.path.getsize(image_path)} bytes")
        
        # 1. 윤곽선 추출
        contour = extract_contour_from_image(image_path)
        print(f"✅ 윤곽선 추출 완료: {len(contour)}개 포인트")
        
        # 2. 네트워크 데이터 로딩
        G, nodes, edges = load_network_data()
        print("✅ 네트워크 데이터 로딩 완료")
        
        # 3. bbox 정보 계산
        bbox_info = calculate_bbox_info(nodes)
        print(f"✅ bbox 정보 계산 완료: 중심점 ({bbox_info['center_lat']:.6f}, {bbox_info['center_lon']:.6f})")
        
        # 4. 윤곽선 스케일링
        contour_scaled, px_to_m = scale_contour(contour, target_len, bbox_info)
        print(f"✅ 윤곽선 스케일링 완료: 목표 거리 {target_len}m")
        
        # 5. 최적 경로 탐색
        print("🔍 최적 경로 탐색 중...")
        best_path, best_contour, best_score = find_optimal_route(
            contour_scaled, px_to_m, bbox_info, G, nodes, target_len
        )
        print(f"✅ 최적 경로 탐색 완료: Fréchet 거리 {best_score:.6f}")
        
        # 6. GeoJSON 저장 (generate_and_save_route 대신 직접 저장)
        image_name = os.path.basename(image_path).split('.')[0]
        print(f"📊 GeoJSON 생성 정보:")
        print(f"   - 이미지명: {image_name}")
        print(f"   - 경로 포인트 수: {len(best_path) if best_path else 0}")
        print(f"   - 윤곽선 포인트 수: {len(best_contour) if best_contour else 0}")
        print(f"   - Fréchet 점수: {best_score:.6f}")
        
        geojson_data, timestamp = create_enhanced_geojson(
            best_path, best_contour, target_len, best_score,
            image_name, bbox_info['center_lat'], bbox_info['center_lon']
        )
        
        # 파일명 통일
        filename = "custom_route.geojson"
        geojson_path = os.path.join(output_dir, filename)
        
        with open(geojson_path, 'w', encoding='utf-8') as f:
            json.dump(geojson_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ GeoJSON 파일이 저장되었습니다: {geojson_path}")
        
        # 경로 요약 출력
        print_route_summary(geojson_data)
        
        # 7. 시각화 생성
        map_path = os.path.join(output_dir, f"map_{image_name}.html")
        create_visualization(best_path, best_contour, edges, bbox_info, map_path)
        print(f"✅ 시각화 생성 완료: {map_path}")
        
        return geojson_path
        
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        return None

if __name__ == "__main__":
    # 직접 실행 시에만 테스트 코드 실행
    image_path = "./uploads/drawing.png"
    
    if os.path.exists(image_path):
        result = generate_custom_route(image_path, target_len=5000, output_dir="./")
        
        if result:
            print(f"🎉 모든 작업이 완료되었습니다!")
            print(f"📁 결과 파일: {result}")
        else:
            print("❌ 작업이 실패했습니다.")
    else:
        print(f"❌ 이미지 파일이 없습니다: {image_path}")
        print("💡 웹에서 그림을 그린 후 다시 실행하세요.")
