import json
import random
import os
from collections import Counter

# 시간대별 분류 기준
DURATION_CATEGORIES = {
    "short": {"min": 0, "max": 30, "name": "짧은 산책"},
    "medium": {"min": 30, "max": 90, "name": "적당한 산책"}, 
    "long": {"min": 90, "max": 120, "name": "긴 산책"}
}

def load_personalized_text():
    """개인화된 텍스트 로드"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    text_path = os.path.join(current_dir, "personalized_text.json")
    
    try:
        with open(text_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"개인화 텍스트 로드 오류: {e}")
        return {}

def categorize_duration(duration_min):
    """산책 시간을 카테고리로 분류"""
    for category, criteria in DURATION_CATEGORIES.items():
        if criteria["min"] <= duration_min <= criteria["max"]:
            return category
    return "medium"  # 기본값

def analyze_duration_preference(user_history):
    """사용자의 산책 시간 선호도 분석"""
    if not user_history:
        return None
    
    # 각 산책의 시간대별 분류
    duration_categories = []
    for record in user_history:
        duration_min = record.get("durationMin", 0)
        category = categorize_duration(duration_min)
        duration_categories.append(category)
    
    # 가장 많이 선택한 시간대 찾기
    if not duration_categories:
        return None
    
    category_counts = Counter(duration_categories)
    most_common_category = category_counts.most_common(1)[0][0]
    
    return {
        "preferred_category": most_common_category,
        "category_name": DURATION_CATEGORIES[most_common_category]["name"],
        "category_counts": dict(category_counts),
        "total_walks": len(duration_categories)
    }

def generate_duration_message(duration_preference):
    """시간대 선호도에 따른 반대 성향 추천 메시지 생성"""
    if not duration_preference:
        return "🌼 동대문구의 숨은 산책로를 찾아보아요!"
    
    # 개인화된 텍스트 로드
    personalized_text = load_personalized_text()
    
    preferred_category = duration_preference["preferred_category"]
    
    # 반대 성향 추천 로직
    if preferred_category == "short":
        # 짧은 산책 선호 → 긴 코스 제안
        messages = personalized_text.get("short_preference", [])
    elif preferred_category == "long":
        # 긴 산책 선호 → 짧은 코스 제안
        messages = personalized_text.get("long_preference", [])
    else:  # medium
        # 중간 산책 선호 → 변주 제안 (긴/짧은 코스 랜덤)
        messages = personalized_text.get("medium_preference", [])
    
    # 랜덤 메시지 선택
    if messages:
        return random.choice(messages)
    else:
        return "🌼 동대문구의 숨은 산책로를 찾아보아요!"

def get_duration_personalized_messages(user_history):
    """사용자 기록을 받아서 시간대별 개인화된 메시지 반환"""
    try:
        # 시간대 선호도 분석
        duration_preference = analyze_duration_preference(user_history)
        
        # 개인화된 메시지 생성
        message = generate_duration_message(duration_preference)
        
        return {
            "success": True,
            "messages": [message],
            "duration_preference": duration_preference
        }
        
    except Exception as e:
        print(f"시간대별 개인화 메시지 생성 중 오류: {e}")
        return {
            "success": False,
            "messages": ["🌼 동대문구의 숨은 산책로를 찾아보아요!"],
            "error": str(e)
        }

# 테스트용 함수
if __name__ == "__main__":
    # 다양한 테스트 데이터
    test_cases = [
        {
            "name": "짧은 산책 선호 사용자",
            "history": [
                {"durationMin": 15, "title": "🟠 활터 어린이 공원"},
                {"durationMin": 20, "title": "🟠 활터 어린이 공원"},
                {"durationMin": 25, "title": "🔵 정릉천"}
            ]
        },
        {
            "name": "긴 산책 선호 사용자", 
            "history": [
                {"durationMin": 100, "title": "🟢 배봉산"},
                {"durationMin": 110, "title": "🟢 천장산"},
                {"durationMin": 95, "title": "🔵 중랑천"}
            ]
        },
        {
            "name": "중간 산책 선호 사용자",
            "history": [
                {"durationMin": 45, "title": "🟠 활터 어린이 공원"},
                {"durationMin": 60, "title": "🟢 배봉산"},
                {"durationMin": 75, "title": "🔵 정릉천"}
            ]
        },
        {
            "name": "기록이 없는 사용자",
            "history": []
        }
    ]
    
    for test_case in test_cases:
        print(f"\n=== {test_case['name']} ===")
        result = get_duration_personalized_messages(test_case['history'])
        
        if result.get('duration_preference'):
            pref = result['duration_preference']
            print(f"선호 시간대: {pref['category_name']} ({pref['preferred_category']})")
            print(f"시간대별 횟수: {pref['category_counts']}")
            print(f"총 산책 횟수: {pref['total_walks']}")
        else:
            print("선호 시간대: 기록 없음")
        
        print(f"개인화 메시지: {result['messages'][0]}")
        print("-" * 50)
