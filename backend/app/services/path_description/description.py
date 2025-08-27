import os
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

if __name__ == "__main__":
    weather_info = get_weather(city="Seoul", country="KR")
    season = get_season()

    with open("backend/app/services/path_reccomendation/poi_tree_list.json", "r", encoding="utf-8") as f:
        poi_tree_list = json.load(f)

    path_data_list = []
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
        if 'description_results' not in locals():
            description_results = []
        description_results.append({
            "path_name": path_name,
            "description": description if description else "경로 설명 생성 실패"
        })

    # 모든 경로 설명 결과를 json 파일로 저장
    with open("backend/app/services/path_description/description_results.json", "w", encoding="utf-8") as f:
        json.dump(description_results, f, ensure_ascii=False, indent=2)
    print("description_results.json 파일로 경로별 설명 결과가 저장되었습니다.")
