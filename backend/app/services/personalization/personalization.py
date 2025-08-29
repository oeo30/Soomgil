import json
import random
from collections import Counter
import os

# 장소 유형 분류 데이터 로드
def load_place_types():
    """장소 유형 분류 데이터 로드"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "data.json")
    
    try:
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"장소 유형 데이터 로드 오류: {e}")
        # 기본 데이터 반환
        return {
            "공원": ["어린이놀이터", "장안근린공원", "늘봄어린이공원"],
            "하천": ["정릉천", "중랑천", "성북천", "청계천"],
            "산": ["배봉산", "천장산"]
        }

# 사용자 취향 분석
def analyze_user_preference(user_history):
    """사용자 산책 기록을 분석하여 취향 파악"""
    if not user_history:
        return None
    
    # 장소 유형 분류 데이터 로드
    place_types = load_place_types()
    
    # 사용자가 방문한 장소들 추출
    visited_places = []
    for record in user_history:
        title = record.get("title", "")
        # 이모지 제거하고 장소명만 추출
        if "🟢" in title:
            title = title.replace("🟢", "").strip()
        elif "🔵" in title:
            title = title.replace("🔵", "").strip()
        elif "🟠" in title:
            title = title.replace("🟠", "").strip()
        
        visited_places.append(title)
    
    # 장소 유형별 방문 횟수 계산 (하위분류 포함)
    type_counts = {"산": 0, "공원": 0, "하천": 0}
    sub_type_counts = {"어린이공원": 0, "일반공원": 0}
    
    for place in visited_places:
        # 공원 하위분류 확인
        if "공원" in place_types:
            park_data = place_types["공원"]
            if isinstance(park_data, dict):  # 하위분류가 있는 경우
                for sub_type, sub_places in park_data.items():
                    if place in sub_places:
                        type_counts["공원"] += 1
                        sub_type_counts[sub_type] += 1
                        break
            else:  # 기존 방식 (하위분류 없는 경우)
                if place in park_data:
                    type_counts["공원"] += 1
                    break
        else:
            # 다른 유형들 확인
            for place_type, places in place_types.items():
                if place_type != "공원" and place in places:
                    type_counts[place_type] += 1
                    break
    
    # 가장 많이 방문한 유형 찾기
    if sum(type_counts.values()) == 0:
        return None
    
    favorite_type = max(type_counts, key=type_counts.get)
    
    # 공원인 경우 하위분류도 확인
    favorite_sub_type = None
    if favorite_type == "공원" and type_counts["공원"] > 0:
        favorite_sub_type = max(sub_type_counts, key=sub_type_counts.get) if sub_type_counts[max(sub_type_counts, key=sub_type_counts.get)] > 0 else None
    
    return {
        "favorite_type": favorite_type,
        "favorite_sub_type": favorite_sub_type,
        "visited_places": visited_places,
        "type_counts": type_counts,
        "sub_type_counts": sub_type_counts
    }

# 개인화된 멘트 생성
def generate_personalized_message(user_preference):
    """사용자 취향에 따른 개인화된 멘트 생성"""
    if not user_preference:
        # 기록이 없는 경우 기본 멘트들
        return [
            "🌼 처음 만나는 중랑천 산책길을 느껴보세요!",
            "🌼 요즘에는 늘봄공원 벚꽃이 예뻐요!",
            "🌼 SNS에서 사랑받는 청량리 꿈의 숲길 만나보세요!"
        ]
    
    favorite_type = user_preference["favorite_type"]
    favorite_sub_type = user_preference.get("favorite_sub_type")
    visited_places = user_preference["visited_places"]
    
    # 장소 유형 분류 데이터 로드
    place_types = load_place_types()
    
    # 추천할 장소 선택
    recommended_place = None
    
    if favorite_type == "공원":
        park_data = place_types.get("공원", {})
        if isinstance(park_data, dict):
            if favorite_sub_type == "어린이공원":
                # 어린이공원 선호 시 어린이공원에서만 추천
                sub_places = park_data["어린이공원"]
                unvisited_places = [place for place in sub_places if place not in visited_places]
                if unvisited_places:
                    recommended_place = random.choice(unvisited_places)
                else:
                    recommended_place = random.choice(sub_places)
            elif favorite_sub_type == "일반공원":
                # 일반공원 선호 시 어린이공원 + 일반공원 전체에서 추천
                all_park_places = park_data["어린이공원"] + park_data["일반공원"]
                unvisited_places = [place for place in all_park_places if place not in visited_places]
                if unvisited_places:
                    recommended_place = random.choice(unvisited_places)
                else:
                    recommended_place = random.choice(all_park_places)
            else:
                # 하위분류가 없는 경우 전체 공원에서 추천
                all_park_places = park_data["어린이공원"] + park_data["일반공원"]
                unvisited_places = [place for place in all_park_places if place not in visited_places]
                if unvisited_places:
                    recommended_place = random.choice(unvisited_places)
                else:
                    recommended_place = random.choice(all_park_places)
        else:
            # 기존 방식 (하위분류 없는 경우)
            all_places = park_data
            unvisited_places = [place for place in all_places if place not in visited_places]
            if unvisited_places:
                recommended_place = random.choice(unvisited_places)
            else:
                recommended_place = random.choice(all_places)
    else:
        # 공원이 아닌 다른 유형들
        all_places = place_types.get(favorite_type, [])
        if isinstance(all_places, list):
            unvisited_places = [place for place in all_places if place not in visited_places]
            if unvisited_places:
                recommended_place = random.choice(unvisited_places)
            else:
                recommended_place = random.choice(all_places)
    
    # 한 줄로 된 개인화된 멘트 생성
    if favorite_type == "산":
        message = f"🌼 산을 좋아하시네요? 오늘은 {recommended_place}에서 새로운 산책을 시작해보세요!"
    elif favorite_type == "공원":
        if favorite_sub_type == "어린이공원":
            message = f"🌼 어린이공원 많이 가시네요? 오늘은 {recommended_place}에서 새로운 산책을 시작해보세요!"
        elif favorite_sub_type == "일반공원":
            message = f"🌼 공원을 좋아하시네요? 오늘은 {recommended_place}에서 새로운 산책을 시작해보세요!"
        else:
            message = f"🌼 공원을 좋아하시네요? 오늘은 {recommended_place}에서 새로운 산책을 시작해보세요!"
    elif favorite_type == "하천":
        message = f"🌼 하천을 좋아하시네요? 오늘은 {recommended_place}에서 새로운 산책을 시작해보세요!"
    else:
        message = f"🌼 {favorite_type}을 좋아하시네요? 오늘은 {recommended_place}에서 새로운 산책을 시작해보세요!"
    
    # 기본 멘트들과 함께 반환
    messages = [
        message,
        "🌼 요즘에는 늘봄공원 벚꽃이 예뻐요!",
        "🌼 SNS에서 사랑받는 청량리 꿈의 숲길 만나보세요!"
    ]
    
    return messages

# 메인 함수
def get_personalized_messages(user_history):
    """사용자 기록을 받아서 개인화된 멘트 반환"""
    try:
        # 사용자 취향 분석
        user_preference = analyze_user_preference(user_history)
        
        # 개인화된 멘트 생성
        messages = generate_personalized_message(user_preference)
        
        return {
            "success": True,
            "messages": messages,
            "user_preference": user_preference
        }
        
    except Exception as e:
        print(f"개인화 메시지 생성 중 오류: {e}")
        return {
            "success": False,
            "messages": [
                "🌼 처음 만나는 중랑천 산책길을 느껴보세요!",
                "🌼 요즘에는 늘봄공원 벚꽃이 예뻐요!",
                "🌼 SNS에서 사랑받는 청량리 꿈의 숲길 만나보세요!"
            ],
            "error": str(e)
        }

# 테스트용 함수
if __name__ == "__main__":
    # 다양한 테스트 데이터
    test_cases = [
        {
            "name": "산을 좋아하는 사용자",
            "history": [
                {"title": "🟢 배봉산", "summary": "배봉산 산책"},
                {"title": "🟢 천장산", "summary": "천장산 산책"},
                {"title": "🟢 배봉산", "summary": "배봉산 산책"}
            ]
        },
        {
            "name": "공원을 좋아하는 사용자", 
            "history": [
                {"title": "🟠 어린이놀이터", "summary": "어린이놀이터 산책"},
                {"title": "🟠 장안근린공원", "summary": "장안근린공원 산책"},
                {"title": "🟠 늘봄어린이공원", "summary": "늘봄어린이공원 산책"},
                {"title": "🟠 장미공원", "summary": "장미공원 산책"}
            ]
        },
        {
            "name": "하천을 좋아하는 사용자",
            "history": [
                {"title": "🔵 중랑천", "summary": "중랑천 산책"},
                {"title": "🔵 정릉천", "summary": "정릉천 산책"},
                {"title": "🔵 청계천", "summary": "청계천 산책"}
            ]
        },
        {
            "name": "기록이 없는 사용자",
            "history": []
        }
    ]
    
    for test_case in test_cases:
        print(f"\n=== {test_case['name']} ===")
        result = get_personalized_messages(test_case['history'])
        if result.get('user_preference'):
            print(f"취향: {result['user_preference'].get('favorite_type', '없음')}")
            print(f"하위취향: {result['user_preference'].get('favorite_sub_type', '없음')}")
            print(f"방문 횟수: {result['user_preference'].get('type_counts', {})}")
            print(f"하위분류 횟수: {result['user_preference'].get('sub_type_counts', {})}")
        else:
            print("취향: 기록 없음")
        print(f"첫 번째 메시지: {result['messages'][0]}")
        print("-" * 50)
