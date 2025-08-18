-- 경로 추천 시스템 데이터베이스 스키마
-- PostgreSQL + PostGIS 사용

-- PostGIS 확장 활성화 (이미 되어있음)
-- CREATE EXTENSION IF NOT EXISTS postgis;


-- 2. 나무 특성 테이블 (계절별)
CREATE TABLE IF NOT EXISTS tree_characteristics (
    id SERIAL PRIMARY KEY,
    tree_name VARCHAR(100) NOT NULL,
    diameter_breast_height DECIMAL(5,2),
    spring_characteristic BOOLEAN DEFAULT FALSE,
    summer_characteristic BOOLEAN DEFAULT FALSE,
    autumn_characteristic BOOLEAN DEFAULT FALSE,
    winter_characteristic BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 네트워크 노드 테이블
CREATE TABLE IF NOT EXISTS network_nodes (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(50) UNIQUE NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    node_type VARCHAR(50), -- 교차점, 터미널 등
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 네트워크 엣지 테이블 (보행 경로)
CREATE TABLE IF NOT EXISTS network_edges (
    id SERIAL PRIMARY KEY,
    edge_id VARCHAR(50) UNIQUE NOT NULL,
    start_node_id VARCHAR(50),
    end_node_id VARCHAR(50),
    geometry GEOMETRY(LINESTRING, 4326) NOT NULL,
    length DECIMAL(10, 2), -- 거리(m)
    highway_type VARCHAR(50), -- 도로 유형
    name VARCHAR(200),
    tree_weight DECIMAL(10, 2), -- 나무 가중치
    park_tree_weight DECIMAL(10, 2), -- 공원 나무 가중치
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 지리적 영역 테이블
CREATE TABLE IF NOT EXISTS geographic_areas (
    id SERIAL PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL,
    area_type VARCHAR(50) NOT NULL, -- mountain, park, river
    geometry GEOMETRY(POLYGON, 4326) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 7. 추천 경로 테이블
CREATE TABLE IF NOT EXISTS recommended_routes (
    id SERIAL PRIMARY KEY,
    user_preference_id INTEGER,
    route_name VARCHAR(200),
    total_length DECIMAL(10, 2), -- km
    estimated_duration INTEGER, -- 분
    difficulty_level VARCHAR(20), -- 쉬움, 보통, 어려움
    route_geometry GEOMETRY(LINESTRING, 4326),
    tree_count INTEGER, -- 경로상 나무 개수
    park_count INTEGER, -- 경로상 공원 개수
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_trees_location ON trees USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_network_nodes_location ON network_nodes USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_network_edges_geometry ON network_edges USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_geographic_areas_geometry ON geographic_areas USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_recommended_routes_geometry ON recommended_routes USING GIST(route_geometry);

CREATE INDEX IF NOT EXISTS idx_trees_management_number ON trees(management_number);
CREATE INDEX IF NOT EXISTS idx_network_edges_start_node ON network_edges(start_node_id);
CREATE INDEX IF NOT EXISTS idx_network_edges_end_node ON network_edges(end_node_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 테이블 생성 확인
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;