#!/usr/bin/env python3
"""
데이터 마이그레이션 스크립트
CSV 파일들을 PostgreSQL 데이터베이스로 마이그레이션
"""

import os
import pandas as pd
import geopandas as gpd
from sqlalchemy import create_engine, text
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, LineString, Polygon
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataMigrator:
    """데이터 마이그레이션 클래스"""
    
    def __init__(self):
        # 데이터베이스 연결
        self.engine = create_engine('postgresql:///soomgil_dev')
        
        # 데이터 폴더 경로 (현재 파일 위치에서 상대 경로로 수정)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.join(current_dir, '..', '..', '..', '..')
        self.data_dir = os.path.join(project_root, 'data')
        self.raw_dir = os.path.join(self.data_dir, 'raw')
        self.processed_dir = os.path.join(self.data_dir, 'processed')
        self.polygon_dir = os.path.join(self.data_dir, 'polygon', 'polygon_data')
    
    def migrate_all(self):
        """모든 데이터 마이그레이션 실행"""
        logger.info("🚀 데이터 마이그레이션 시작")
        
        try:
            # 1. 나무 특성 데이터 마이그레이션
            self.migrate_tree_characteristics()
            
            # 2. 네트워크 노드 마이그레이션
            self.migrate_network_nodes()
            
            # 3. 네트워크 엣지 마이그레이션
            self.migrate_network_edges()
            
            # 4. 지리적 영역 마이그레이션
            self.migrate_geographic_areas()
            
            logger.info("✅ 모든 데이터 마이그레이션 완료!")
            
        except Exception as e:
            logger.error(f"❌ 마이그레이션 중 오류 발생: {str(e)}")
            raise
    
    def migrate_tree_characteristics(self):
        """나무 특성 데이터 마이그레이션"""
        logger.info("📊 나무 특성 데이터 마이그레이션 시작")
        
        try:
            # CSV 파일 읽기
            csv_path = os.path.join(self.raw_dir, 'ddm-tree-characteristics.csv')
            df = pd.read_csv(csv_path)
            
            # 필요한 컬럼만 선택
            df = df[['수목명', '흉고직경(m)', '봄', '여름', '가을', '겨울']]
            
            # 컬럼명 매핑
            df = df.rename(columns={
                '수목명': 'tree_name',
                '흉고직경(m)': 'diameter_breast_height',
                '봄': 'spring_characteristic',
                '여름': 'summer_characteristic',
                '가을': 'autumn_characteristic',
                '겨울': 'winter_characteristic'
            })
            
            # 불린 값 변환
            boolean_columns = ['spring_characteristic', 'summer_characteristic', 'autumn_characteristic', 'winter_characteristic']
            for col in boolean_columns:
                df[col] = df[col].map({1: True, 0: False}).fillna(False)
            
            # 데이터베이스에 저장
            df.to_sql('tree_characteristics', self.engine, if_exists='replace', index=False)
            
            logger.info(f"✅ 나무 특성 데이터 {len(df)}개 마이그레이션 완료")
            
        except Exception as e:
            logger.error(f"❌ 나무 특성 마이그레이션 오류: {str(e)}")
            raise
    
    def migrate_network_nodes(self):
        """네트워크 노드 마이그레이션"""
        logger.info("📍 네트워크 노드 마이그레이션 시작")
        
        try:
            # CSV 파일 읽기
            csv_path = os.path.join(self.processed_dir, 'nodes.csv')
            df = pd.read_csv(csv_path)
            
            # 위치 정보를 지오메트리로 변환
            df['location'] = df.apply(
                lambda row: f"POINT({row['lon']} {row['lat']})", axis=1
            )
            
            # 컬럼명 매핑
            df = df.rename(columns={
                'id': 'node_id',
                'lat': 'latitude',
                'lon': 'longitude'
            })
            
            # 데이터베이스에 저장
            df.to_sql('network_nodes', self.engine, if_exists='replace', index=False)
            
            logger.info(f"✅ 네트워크 노드 {len(df)}개 마이그레이션 완료")
            
        except Exception as e:
            logger.error(f"❌ 네트워크 노드 마이그레이션 오류: {str(e)}")
            raise
    
    def migrate_network_edges(self):
        """네트워크 엣지 마이그레이션"""
        logger.info("🛣️ 네트워크 엣지 마이그레이션 시작")
        
        try:
            # GeoJSON 파일 읽기
            geojson_path = os.path.join(self.processed_dir, 'edges_with_tree_park_weight.geojson')
            gdf = gpd.read_file(geojson_path)
            
            # 컬럼명 매핑
            gdf = gdf.rename(columns={
                'id': 'edge_id',
                'u': 'start_node_id',
                'v': 'end_node_id'
            })
            
            # 데이터베이스에 저장
            gdf.to_postgis('network_edges', self.engine, if_exists='replace', index=False)
            
            logger.info(f"✅ 네트워크 엣지 {len(gdf)}개 마이그레이션 완료")
            
        except Exception as e:
            logger.error(f"❌ 네트워크 엣지 마이그레이션 오류: {str(e)}")
            raise
    
    def migrate_geographic_areas(self):
        """지리적 영역 마이그레이션"""
        logger.info("🗺️ 지리적 영역 마이그레이션 시작")
        
        try:
            # 산, 공원, 하천 영역 처리
            area_files = {
                'mountain': 'mountain_area.geojson',
                'park': 'park_area.geojson',
                'river': 'river_area.geojson'
            }
            
            for area_type, filename in area_files.items():
                geojson_path = os.path.join(self.polygon_dir, filename)
                
                if os.path.exists(geojson_path):
                    gdf = gpd.read_file(geojson_path)
                    
                    # area_type 컬럼 추가
                    gdf['area_type'] = area_type
                    gdf['area_name'] = f"{area_type}_area"
                    gdf['description'] = f"{area_type} 지역"
                    
                    # 데이터베이스에 저장
                    gdf.to_postgis('geographic_areas', self.engine, if_exists='append', index=False)
                    
                    logger.info(f"✅ {area_type} 영역 {len(gdf)}개 마이그레이션 완료")
            
        except Exception as e:
            logger.error(f"❌ 지리적 영역 마이그레이션 오류: {str(e)}")
            raise
    
    def verify_migration(self):
        """마이그레이션 결과 검증"""
        logger.info("🔍 마이그레이션 결과 검증")
        
        with self.engine.connect() as conn:
            # 각 테이블의 레코드 수 확인
            tables = ['tree_characteristics', 'network_nodes', 'network_edges', 'geographic_areas']
            
            for table in tables:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.fetchone()[0]
                logger.info(f"  - {table}: {count}개")

def main():
    """메인 실행 함수"""
    migrator = DataMigrator()
    
    try:
        # 데이터 마이그레이션 실행
        migrator.migrate_all()
        
        # 결과 검증
        migrator.verify_migration()
        
        print("🎉 데이터 마이그레이션이 성공적으로 완료되었습니다!")
        
    except Exception as e:
        print(f"❌ 마이그레이션 실패: {str(e)}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
