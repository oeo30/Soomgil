# 장소별 좌표 데이터
PLACE_COORDINATES = {
    # 어린이공원
    "어린이 놀이터": {"lat": 37.5839, "lng": 127.0559},
    "마로니에 어린이 공원": {"lat": 37.5840, "lng": 127.0560},
    "늘봄 어린이 공원": {"lat": 37.5841, "lng": 127.0561},
    "샛별 어린이 공원": {"lat": 37.5842, "lng": 127.0562},
    "한내 어린이 공원": {"lat": 37.5843, "lng": 127.0563},
    "아름드리 어린이 공원": {"lat": 37.5844, "lng": 127.0564},
    "활터 어린이 공원": {"lat": 37.5845, "lng": 127.0565},
    "우산각 어린이 공원": {"lat": 37.5846, "lng": 127.0566},
    "방아다리 어린이 공원": {"lat": 37.5847, "lng": 127.0567},
    
    # 일반공원
    "장안 근린 공원": {"lat": 37.5848, "lng": 127.0568},
    "장미 공원": {"lat": 37.5849, "lng": 127.0569},
    "장평 근린 공원": {"lat": 37.5850, "lng": 127.0570},
    "초화원": {"lat": 37.5851, "lng": 127.0571},
    "간데메 공원": {"lat": 37.5852, "lng": 127.0572},
    "용두 공원": {"lat": 37.5853, "lng": 127.0573},
    
    # 산
    "배봉산": {"lat": 37.5854, "lng": 127.0574},
    "천장산": {"lat": 37.5855, "lng": 127.0575},
    
    # 하천
    "정릉천": {"lat": 37.5856, "lng": 127.0576},
    "중랑천": {"lat": 37.5857, "lng": 127.0577},
    "성북천": {"lat": 37.5858, "lng": 127.0578},
    "청계천": {"lat": 37.5859, "lng": 127.0579}
}

def get_place_coordinates(place_name):
    """장소명으로 좌표 반환"""
    return PLACE_COORDINATES.get(place_name)

def get_latest_visited_coordinates(user_history):
    """사용자 히스토리에서 가장 최근 방문한 장소의 좌표 반환"""
    if not user_history or len(user_history) == 0:
        return None
    
    # 가장 최근 기록에서 장소명 추출
    latest_route = user_history[0]
    place_name = latest_route.get('title', '')
    
    # 이모지 제거
    if place_name:
        # 이모지 제거 (🟠, 🟢, 🔵 등)
        import re
        place_name = re.sub(r'[🟠🟢🔵🟡🟣🔴⚪⚫]', '', place_name).strip()
        
        # 좌표 반환
        return get_place_coordinates(place_name)
    
    return None
