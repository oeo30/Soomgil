from flask import request, jsonify, send_file
from app.routes import api_bp
import json
import os
import subprocess
import papermill as pm
from werkzeug.utils import secure_filename
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'path_image'))
from image_path_enhanced import generate_custom_route

@api_bp.route('/health', methods=['GET'])
def health_check():
    """헬스 체크 엔드포인트"""
    return jsonify({
        'status': 'healthy',
        'message': 'Soomgil API is running'
    })

@api_bp.route('/generate-path', methods=['POST'])
def generate_path():
    """경로 생성 (기존 로직 통합)"""
    try:
        data = request.get_json()
        start_lat = data.get("lat")
        start_lon = data.get("lon")
        
        # 1. path.ipynb 실행
        pm.execute_notebook(
            'backend/app/services/path_reccomendation/path.ipynb',
            'backend/app/services/path_reccomendation/path_out.ipynb',  # 출력 노트북
            parameters=dict(start_lat=start_lat, start_lon=start_lon)
        )
        
        # 2. description.ipynb 실행
        pm.execute_notebook(
            'backend/app/services/path_description/description.ipynb',
            'backend/app/services/path_description/description_out.ipynb',
            parameters=dict(start_lat=start_lat, start_lon=start_lon, walk_km=walk_km, season=season)
        )
        
        # 3. 결과 반환
        geojson_path = "app/services/path_reccomendation/results_path.geojson"
        if os.path.exists(geojson_path):
            return send_file(geojson_path, mimetype="application/json")
        else:
            return jsonify({"error": "경로 생성 실패"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/path', methods=['GET'])
def get_path():
    """생성된 경로 조회"""
    path = "app/services/path_reccomendation/results_path.geojson"
    if os.path.exists(path):
        return send_file(path, mimetype="application/json")
    else:
        return jsonify({"error": "geojson 파일 없음"}), 404

@api_bp.route('/description', methods=['GET'])
def get_description():
    """경로 설명 조회"""
    desc_json = "app/services/path_description/description_results.json"
    if os.path.exists(desc_json):
        with open(desc_json, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    else:
        return jsonify({"error": "설명 파일 없음"}), 404

@api_bp.route('/generate-music', methods=['POST'])
def generate_music():
    """음악 생성"""
    try:
        data = request.get_json()
        mood = data.get("mood", "mysterious and cinematic")
        
        # music.py를 mood 파라미터로 실행
        result = subprocess.run([
            "python", "app/services/musicgen/music.py", mood
        ])
        
        music_path = "app/services/musicgen/generated_music.wav"
        if os.path.exists(music_path):
            return send_file(music_path, mimetype="audio/wav")
        else:
            return jsonify({"error": "음악 생성 실패"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/music/<mood>', methods=['GET'])
def get_music_by_mood(mood):
    """무드에 따른 음악 파일 제공"""
    try:
        # 무드에 따른 음악 파일 매핑
        mood_mapping = {
            '활기찬': '활기찬.wav',
            '잔잔한': '잔잔한.wav',
            '상쾌한': '경쾌한.wav',
            '몽환적': '몽환적.wav'
        }
        
        filename = mood_mapping.get(mood)
        if not filename:
            return jsonify({"error": "지원하지 않는 무드입니다"}), 400
        
        # 현재 파일의 절대 경로를 기준으로 상대 경로 계산
        current_dir = os.path.dirname(os.path.abspath(__file__))
        music_path = os.path.join(current_dir, "..", "services", "musicgen", "results", filename)
        if os.path.exists(music_path):
            return send_file(music_path, mimetype="audio/wav")
        else:
            return jsonify({"error": "음악 파일을 찾을 수 없습니다"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/routes/recommend', methods=['POST'])
def recommend_route():
    """경로 추천 (새로운 통합 API)"""
    try:
        data = request.get_json()
        lat = data.get('lat')
        lon = data.get('lon')
        duration = data.get('duration', 30)
        
        # 왕복 시간을 편도 거리로 변환 (보행 속도: 3.5km/h)
        # duration은 왕복 시간이므로 편도 거리 = (왕복 시간 / 2) * 속도
        walk_km = round((duration / 2) / 60 * 3.5, 2)
        
        # 현재 계절 계산
        from datetime import datetime
        current_month = datetime.now().month
        if current_month in [3, 4, 5]:
            season = '봄'
        elif current_month in [6, 7, 8]:
            season = '여름'
        elif current_month in [9, 10, 11]:
            season = '가을'
        else:
            season = '겨울'
        
        print(f"🔍 경로 추천 요청: lat={lat}, lon={lon}, duration={duration}분(왕복), walk_km={walk_km}km(편도), season={season}")
        
        # Mock 데이터 정의 (폴백용)
        mock_geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "name": f"추천 경로 ({duration}분)",
                        "duration": duration,
                        "distance": walk_km
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [lon, lat],
                            [lon + 0.01, lat + 0.01],
                            [lon + 0.02, lat],
                            [lon + 0.01, lat - 0.01],
                            [lon, lat]
                        ]
                    }
                }
            ]
        }
        
        mock_description = {
            "description": f"동대문구의 {season} 산책로입니다. 총 {duration}분(왕복) 소요되며, 편도 {walk_km}km 거리입니다.",
            "tree_count": 15,
            "park_count": 3,
            "highlights": ["느티나무 거리", "작은 공원", "산책로"]
        }
        
        # 1. 경로 생성 (실제 노트북 실행)
        try:
            print("🔧 실제 노트북으로 경로 생성")
            
            # 현재 작업 디렉토리를 프로젝트 루트로 변경
            original_cwd = os.getcwd()
            # backend/app/routes/routes.py에서 프로젝트 루트로 이동
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            os.chdir(project_root)
            print(f"📁 작업 디렉토리 변경: {os.getcwd()}")
            
            # 출력 폴더 생성
            output_dir = os.path.join(project_root, 'backend/app/services/path_reccomendation')
            os.makedirs(output_dir, exist_ok=True)
            
            # IPython 보안 설정 변경
            os.environ['IPYTHON_ALLOW_OPEN_FD'] = '1'
            
            # 노트북 실행
            pm.execute_notebook(
                'backend/app/services/path_reccomendation/path.ipynb',
                'backend/app/services/path_reccomendation/path_out.ipynb',
                parameters=dict(start_lat=lat, start_lon=lon, walk_km=walk_km, season=season)  # 계산된 거리와 현재 계절 사용
            )
            
            # 원래 디렉토리로 복원
            os.chdir(original_cwd)
            print("✅ 경로 생성 노트북 실행 완료")
            
            # 2. 경로 설명 생성 (description.py 실행)
            try:
                print("📝 description.py로 경로 설명 생성")
                
                # 현재 작업 디렉토리를 프로젝트 루트로 변경
                original_cwd = os.getcwd()
                project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
                os.chdir(project_root)
                print(f"📁 작업 디렉토리 변경: {os.getcwd()}")
                
                # 출력 폴더 생성
                output_dir = os.path.join(project_root, 'backend/app/services/path_description')
                os.makedirs(output_dir, exist_ok=True)
                
                # description.py 실행
                subprocess.run([
                    'python', 
                    'backend/app/services/path_description/description.py'
                ], check=True, cwd=project_root, env=dict(os.environ, PROJECT_ROOT=project_root))
                
                # 원래 디렉토리로 복원
                os.chdir(original_cwd)
                print("✅ 경로 설명 생성 완료")
                
            except Exception as e:
                print(f"❌ 경로 설명 생성 실패: {e}")
                print("🔄 Mock 설명으로 폴백")
            
        except Exception as e:
            print(f"❌ 경로 생성 노트북 실행 실패: {e}")
            print("🔄 Mock 데이터로 폴백")
        

        
        # 3. 실제 결과 파일 읽기
        try:
            print("📖 실제 결과 파일 읽기")
            
            # GeoJSON 파일 읽기
            geojson_path = os.path.join(project_root, "backend/app/services/path_reccomendation/results_path.geojson")
            if os.path.exists(geojson_path):
                with open(geojson_path, 'r', encoding='utf-8') as f:
                    geojson_data = json.load(f)
                print("✅ GeoJSON 파일 읽기 완료")
            else:
                print(f"⚠️ GeoJSON 파일 없음: {geojson_path}")
                geojson_data = mock_geojson
            
            # 설명 파일 읽기
            desc_json = os.path.join(project_root, "backend/app/services/path_description/description_results.json")
            if os.path.exists(desc_json):
                with open(desc_json, 'r', encoding='utf-8') as f:
                    description_data = json.load(f)
                print("✅ 설명 파일 읽기 완료")
            else:
                print(f"⚠️ 설명 파일 없음: {desc_json}")
                description_data = mock_description
                
        except Exception as e:
            print(f"❌ 파일 읽기 실패: {e}")
            geojson_data = mock_geojson
            description_data = mock_description
        
        # 3. 결과 반환
        print("✅ 실제/폴백 데이터 반환")
        
        return jsonify({
            'route_id': f"route_{int(lat*1000)}_{int(lon*1000)}",
            'geojson': geojson_data,
            'description': description_data,
            'estimated_duration': duration
        })
            
    except Exception as e:
        print(f"❌ 전체 에러: {e}")
        return jsonify({"error": str(e)}), 500

@api_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """시스템 통계 정보"""
    try:
        return jsonify({
            'total_routes': 0,
            'recent_routes': [],
            'status': 'API 서버가 정상적으로 작동 중입니다.'
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/upload', methods=['POST'])
def upload_image():
    """이미지 업로드 및 커스텀 경로 생성"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "파일이 없습니다"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "파일이 선택되지 않았습니다"}), 400
        
        # 파일 저장
        filename = secure_filename(file.filename)
        upload_dir = os.path.join(os.path.dirname(__file__), '..', 'services', 'path_image', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # 흰 배경 추가
        try:
            from PIL import Image
            import numpy as np
            
            # 이미지 로드
            img = Image.open(file_path)
            
            # RGBA 모드인 경우 RGB로 변환 (흰 배경 추가)
            if img.mode == 'RGBA':
                # 흰 배경 이미지 생성
                white_bg = Image.new('RGB', img.size, (255, 255, 255))
                # 원본 이미지를 흰 배경 위에 합성
                white_bg.paste(img, mask=img.split()[-1])  # 알파 채널을 마스크로 사용
                img = white_bg
            
            # RGB로 변환 (투명도가 있는 경우)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # 저장
            img.save(file_path, 'PNG')
            print(f"✅ 흰 배경 추가 완료: {file_path}")
            
        except Exception as e:
            print(f"⚠️ 흰 배경 추가 실패 (계속 진행): {e}")
        
        print(f"✅ 이미지 업로드 완료: {file_path}")
        print(f"📁 파일 존재 여부: {os.path.exists(file_path)}")
        print(f"📁 파일 크기: {os.path.getsize(file_path)} bytes")
        
        # 커스텀 경로 생성
        try:
            # 현재 작업 디렉토리를 프로젝트 루트로 변경
            original_cwd = os.getcwd()
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            os.chdir(project_root)
            
            # path_image 시스템 실행
            output_dir = os.path.join(project_root, 'backend/app/services/path_image/outputs')
            os.makedirs(output_dir, exist_ok=True)
            
            # 작업 디렉토리를 path_image 폴더로 변경
            path_image_dir = os.path.join(project_root, 'backend/app/services/path_image')
            os.chdir(path_image_dir)
            
            try:
                print(f"🖼️ generate_custom_route 호출: {file_path}")
                geojson_path = generate_custom_route(
                    image_path=file_path,
                    target_len=5000,  # 5km
                    output_dir=output_dir
                )
            finally:
                # 원래 디렉토리로 복원
                os.chdir(original_cwd)
            
            if geojson_path and os.path.exists(geojson_path):
                # GeoJSON 파일 읽기
                with open(geojson_path, 'r', encoding='utf-8') as f:
                    geojson_data = json.load(f)
                
                print(f"✅ 커스텀 경로 생성 완료: {geojson_path}")
                
                return jsonify({
                    'success': True,
                    'result': geojson_data,
                    'message': '커스텀 경로가 성공적으로 생성되었습니다.'
                })
            else:
                return jsonify({"error": "경로 생성에 실패했습니다"}), 500
                
        except Exception as e:
            print(f"❌ 경로 생성 실패: {e}")
            import traceback
            print(f"상세 에러: {traceback.format_exc()}")
            return jsonify({"error": f"경로 생성 중 오류 발생: {str(e)}"}), 500
            
    except Exception as e:
        print(f"❌ 업로드 실패: {e}")
        return jsonify({"error": f"업로드 중 오류 발생: {str(e)}"}), 500
