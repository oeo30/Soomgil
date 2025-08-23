#!/usr/bin/env python3
"""
데이터베이스 연결 테스트 스크립트
"""

import psycopg2
from psycopg2.extras import RealDictCursor

def test_database_connection():
    """PostgreSQL 데이터베이스 연결 테스트"""
    
    print("🔍 데이터베이스 연결 테스트 시작...")
    
    try:
        # 데이터베이스 연결
        # 연결 부분을 다음과 같이 변경
        conn = psycopg2.connect(
            host="localhost",
            database="soomgil_dev",
            user="",        # 기본 postgres 사용자
            password="",            # 비밀번호 없음
            port="5432"
)
        
        print("✅ PostgreSQL 연결 성공!")
        
        # 커서 생성
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # PostgreSQL 버전 확인
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"📊 PostgreSQL 버전: {version['version']}")
        
        # PostGIS 확장 확인
        cur.execute("SELECT PostGIS_Version();")
        postgis_version = cur.fetchone()
        print(f"��️ PostGIS 버전: {postgis_version['postgis_version']}")
        
        # 데이터베이스 정보 확인
        cur.execute("SELECT current_database(), current_user;")
        db_info = cur.fetchone()
        print(f"📁 현재 데이터베이스: {db_info['current_database']}")
        print(f"�� 현재 사용자: {db_info['current_user']}")
        
        # 테이블 목록 확인 (아직 없을 수 있음)
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cur.fetchall()
        
        if tables:
            print(f"📋 현재 테이블 목록:")
            for table in tables:
                print(f"  - {table['table_name']}")
        else:
            print("📋 테이블이 아직 없습니다. (정상)")
        
        # 연결 종료
        cur.close()
        conn.close()
        
        print("✅ 모든 테스트 통과!")
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ 연결 오류: {e}")
        print("\n🔧 해결 방법:")
        print("1. PostgreSQL 서비스가 실행 중인지 확인")
        print("2. 데이터베이스 'soomgil_dev'가 존재하는지 확인")
        print("3. 사용자 'soomgil_user'가 생성되었는지 확인")
        print("4. 비밀번호가 올바른지 확인")
        return False
        
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        return False

if __name__ == "__main__":
    test_database_connection()