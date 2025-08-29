import json
import random
import os
from typing import List, Dict, Optional
from datetime import datetime, timedelta

class DurationAnalyzer:
    def __init__(self):
        self.duration_categories = {
            'short': {'max_minutes': 30, 'name': '짧은 산책'},
            'medium': {'min_minutes': 30, 'max_minutes': 90, 'name': '적당한 산책'},
            'long': {'min_minutes': 90, 'max_minutes': 120, 'name': '긴 산책'}
        }
        self.load_personalized_texts()
    
    def load_personalized_texts(self):
        """개인화된 텍스트 데이터를 로드합니다."""
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            json_path = os.path.join(current_dir, 'personalized_text.json')
            with open(json_path, 'r', encoding='utf-8') as f:
                self.personalized_texts = json.load(f)
        except FileNotFoundError:
            print("personalized_text.json 파일을 찾을 수 없습니다.")
            self.personalized_texts = {}
    
    def categorize_duration(self, duration_minutes: int) -> str:
        """산책 시간을 카테고리로 분류합니다."""
        if duration_minutes <= self.duration_categories['short']['max_minutes']:
            return 'short'
        elif duration_minutes <= self.duration_categories['medium']['max_minutes']:
            return 'medium'
        else:
            return 'long'
    
    def analyze_user_preference(self, walk_history: List[Dict]) -> Dict:
        """사용자의 산책 기록을 분석하여 선호도를 파악합니다."""
        if not walk_history:
            return {'preference': 'medium', 'confidence': 0.0, 'total_walks': 0}
        
        duration_counts = {'short': 0, 'medium': 0, 'long': 0}
        total_duration = 0
        
        for walk in walk_history:
            # routeHistory.js의 데이터 구조에 맞춰 durationMin 사용
            duration = walk.get('durationMin', 0)
            if duration and duration > 0:
                category = self.categorize_duration(duration)
                duration_counts[category] += 1
                total_duration += duration
        
        total_walks = sum(duration_counts.values())
        if total_walks == 0:
            return {'preference': 'medium', 'confidence': 0.0, 'total_walks': 0}
        
        # 가장 많이 선택한 카테고리 찾기
        max_count = max(duration_counts.values())
        preference = [k for k, v in duration_counts.items() if v == max_count][0]
        
        # 신뢰도 계산 (가장 많이 선택한 비율)
        confidence = max_count / total_walks
        
        # 평균 산책 시간
        avg_duration = total_duration / total_walks if total_walks > 0 else 0
        
        return {
            'preference': preference,
            'confidence': confidence,
            'total_walks': total_walks,
            'avg_duration': avg_duration,
            'duration_distribution': duration_counts
        }
    
    def generate_personalized_message(self, user_preference: str, confidence: float) -> str:
        """사용자 선호도에 따른 개인화된 메시지를 생성합니다."""
        if confidence < 0.3:  # 신뢰도가 낮으면 기본 메시지
            return "🌱 오늘은 어떤 산책을 즐겨보시겠어요?"
        
        # 선호도에 따른 추천 방향 결정
        if user_preference == 'short':
            # 짧은 산책 선호 → 긴 코스 제안
            messages = self.personalized_texts.get('short_preference', [])
        elif user_preference == 'long':
            # 긴 산책 선호 → 짧은 코스 제안
            messages = self.personalized_texts.get('long_preference', [])
        else:  # medium
            # 중간 산책 선호 → 변주 제안
            messages = self.personalized_texts.get('medium_preference', [])
        
        if messages:
            return random.choice(messages)
        else:
            return "🌱 오늘은 새로운 산책 코스를 시도해보세요!"
    
    def get_recommended_duration_range(self, user_preference: str) -> Dict:
        """사용자 선호도에 따른 추천 산책 시간 범위를 반환합니다."""
        if user_preference == 'short':
            # 짧은 산책 선호자에게 긴 코스 추천
            return {
                'min_minutes': 60,
                'max_minutes': 120,
                'description': '긴 코스로 색다른 여유를 느껴보세요'
            }
        elif user_preference == 'long':
            # 긴 산책 선호자에게 짧은 코스 추천
            return {
                'min_minutes': 15,
                'max_minutes': 45,
                'description': '짧고 산뜻한 산책으로 새로운 리듬을 느껴보세요'
            }
        else:  # medium
            # 중간 산책 선호자에게 변주 추천
            return {
                'min_minutes': 45,
                'max_minutes': 90,
                'description': '새로운 거리로 색다른 기분을 느껴보세요'
            }
    
    def analyze_and_recommend(self, walk_history: List[Dict]) -> Dict:
        """전체 분석 및 추천을 수행합니다."""
        # 사용자 선호도 분석
        analysis = self.analyze_user_preference(walk_history)
        
        # 개인화된 메시지 생성
        message = self.generate_personalized_message(
            analysis['preference'], 
            analysis['confidence']
        )
        
        # 추천 산책 시간 범위
        recommended_duration = self.get_recommended_duration_range(analysis['preference'])
        
        return {
            'analysis': analysis,
            'personalized_message': message,
            'recommended_duration': recommended_duration,
            'timestamp': datetime.now().isoformat()
        }

# API 엔드포인트용 함수 - 개인화된 메시지만 반환
def get_duration_personalized_messages(walk_history: List[Dict]) -> Dict:
    """사용자의 산책 기록을 받아서 개인화된 메시지만 반환합니다."""
    try:
        analyzer = DurationAnalyzer()
        result = analyzer.analyze_and_recommend(walk_history)
        
        # 메시지가 기본 메시지가 아닌 경우에만 반환
        if result['personalized_message'] != "🌱 오늘은 어떤 산책을 즐겨보시겠어요?":
            return {
                'success': True,
                'messages': [result['personalized_message']]
            }
        else:
            return {
                'success': False,
                'messages': []
            }
    except Exception as e:
        print(f"시간대별 개인화 메시지 생성 실패: {e}")
        return {
            'success': False,
            'messages': []
        }

# 전체 분석 결과를 반환하는 함수
def get_duration_recommendation(user_id: str, walk_history: List[Dict]) -> Dict:
    """사용자 ID와 산책 기록을 받아서 개인화된 추천을 반환합니다."""
    analyzer = DurationAnalyzer()
    return analyzer.analyze_and_recommend(walk_history)

# 테스트용 함수
def test_duration_analysis():
    """시스템 테스트를 위한 함수입니다."""
    # 샘플 산책 기록 (routeHistory.js 구조에 맞춤)
    sample_history = [
        {'durationMin': 20, 'date': '2024-01-01'},
        {'durationMin': 25, 'date': '2024-01-03'},
        {'durationMin': 15, 'date': '2024-01-05'},
        {'durationMin': 30, 'date': '2024-01-07'},
        {'durationMin': 18, 'date': '2024-01-09'},
    ]
    
    analyzer = DurationAnalyzer()
    result = analyzer.analyze_and_recommend(sample_history)
    
    print("=== 산책 시간 분석 결과 ===")
    print(f"사용자 선호도: {result['analysis']['preference']}")
    print(f"신뢰도: {result['analysis']['confidence']:.2f}")
    print(f"총 산책 횟수: {result['analysis']['total_walks']}")
    print(f"평균 산책 시간: {result['analysis']['avg_duration']:.1f}분")
    print(f"개인화 메시지: {result['personalized_message']}")
    print(f"추천 시간 범위: {result['recommended_duration']['min_minutes']}-{result['recommended_duration']['max_minutes']}분")
    print(f"추천 설명: {result['recommended_duration']['description']}")
    
    return result

if __name__ == "__main__":
    test_duration_analysis()
