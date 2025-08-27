import os
import google.generativeai as genai
from dotenv import load_dotenv

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
너는 사용자에게 산책로를 추천해주는 친절한 가이드야. 아래 주어진 정보를 바탕으로, 감성적이고 부드러운 톤으로 2 문장의 산책로 추천 문구를 한국어로 작성해 줘.

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
    example_path_data = {
        "path_name": "용마산 등산로",
        "weather": "하늘이 맑고 공기가 상쾌한",
        "season": "여름",
        "trees": ["소나무", "신갈나무"]
    }

    description = generate_path_description_gemini(
        path_name=example_path_data["path_name"],
        weather=example_path_data["weather"],
        season=example_path_data["season"],
        trees=example_path_data["trees"]
    )

    if description:
        print("--- 생성된 경로 설명 ---")
        print(description)