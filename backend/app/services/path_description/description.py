# Cell 1: 라이브러리 임포트 및 설정
import os

# 환경 변수에서 project_root 가져오기
project_root = os.environ.get("PROJECT_ROOT", "/Users/taknayeon/Development/Projects/Soomgil")
import google.generativeai as genai
from dotenv import load_dotenv
from weather import get_weather, get_season
import json

load_dotenv()
try:
    api_key = os.environ.get("GEMINI_API_KEY")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash') # 최신 경량 모델
except Exception as e:
    print("error: Gemini API 키 설정에 문제가 발생했습니다. 환경 변수 또는 코드에 키를 입력해주세요.")
    print(f"오류: {e}")
    model = None

# Cell 2: 함수 정의 및 메인 로직
def generate_path_description_gemini(path_name: str, weather: str, season: str, trees: list) -> str:
    if not model:
        return "Gemini 모델이 초기화되지 않았습니다."
    tree_list_str = ", ".join(trees) if trees else "특별한 나무는 없지만"
    prompt = f"""
                너는 사용자에게 산책로를 추천해주는 친절한 가이드야. 아래 주어진 정보를 바탕으로, 
                감성적이고 부드러운 톤으로 2 문장의 산책로 추천 문구를 한국어로 작성해 줘.

                ### 정보
                - 주요 경로 이름: {path_name}
                - 날씨: {weather}
                - 계절: {season}
                - 특별한 나무: {tree_list_str}

                ### 이제 아래 정보로 추천 문구를 생성해 줘.
                """

    try:
        response = model.generate_content(prompt) #API 호출
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API 호출 중 오류가 발생했습니다: {e}")
        return None

# 프로젝트 루트 기준으로 절대 경로 사용
print(f"🔍 프로젝트 루트: {project_root}")
print(f"📁 현재 작업 디렉토리: {os.getcwd()}")

weather_info = get_weather(city="Seoul", country="KR")
season = get_season()

# 절대 경로로 poi_tree_list.json 파일 읽기
poi_tree_path = os.path.join(project_root, "backend/app/services/path_reccomendation/poi_tree_list.json")
print(f"🔍 poi_tree_list.json 경로: {poi_tree_path}")

with open(poi_tree_path, "r", encoding="utf-8") as f:
    poi_tree_list = json.load(f)

path_data_list = []
description_results = []
for item in poi_tree_list:
    path_name = item[0] if item and isinstance(item[0], str) else "경로명 없음"
    trees = item[1] if len(item) > 1 else []
    description = generate_path_description_gemini(
        path_name=path_name,
        weather=weather_info,
        season=season,
        trees=trees
    )
    print(f"--- {path_name} 설명 ---")
    if description:
        print(description)
    else:
        print("경로 설명 생성 실패")
    
    # 경로별 이모티콘 매칭
    emoji = ""  # 기본값 (이모티콘 없음)
    if "mountain" in path_name.lower():
        emoji = "🟢"  # 초록색 (산)
    elif "river" in path_name.lower():
        emoji = "🔵"  # 파란색 (하천)
    elif "park" in path_name.lower():
        emoji = "🟠"  # 주황색 (공원)
    
    # 이모티콘이 있으면 추가, 없으면 경로명만
    display_name = f"{emoji} {path_name}"
    display_name = display_name.split("-")[0]
    
    description_results.append({
        "path_name": display_name,
        "description": description if description else "경로 설명 생성 실패"
    })

# 모든 경로 설명 결과를 json 파일로 저장
output_path = os.path.join(project_root, "backend/app/services/path_description/description_results.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(description_results, f, ensure_ascii=False, indent=2)
print(f"✅ description_results.json 파일로 경로별 설명 결과가 저장되었습니다: {output_path}")
