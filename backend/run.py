#!/usr/bin/env python3
"""
Soomgil Backend Server
경로 추천 시스템 백엔드 서버
"""

import os
import sys
from app import create_app

def create_app_with_context():
    """애플리케이션 컨텍스트와 함께 앱 생성"""
    app = create_app('development')
    return app

if __name__ == '__main__':
    # 환경 변수 설정
    os.environ.setdefault('FLASK_ENV', 'development')
    
    # 서버 실행
    app = create_app_with_context()
    
    print("🌳 Soomgil Backend Server 시작")
    print("📍 API 엔드포인트: http://localhost:5001/api")
    print("🔍 헬스 체크: http://localhost:5001/api/health")
    print("📊 통계 정보: http://localhost:5001/api/statistics")
    print("🚀 경로 추천: POST http://localhost:5001/api/routes/recommend")
    print("\n서버를 중지하려면 Ctrl+C를 누르세요.")
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True
    )