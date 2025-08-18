from weather import get_weather
from music_generator import generate_music

if __name__ == "__main__":
    city = "Seoul"
    weather = get_weather(city)

    print("======== 날씨 정보 ========")
    for key, value in weather.items():
        print(f"{key}: {value}")

    # 사용자 입력
    mood = input("원하는 무드를 입력하세요 (예: 편안한, 신나는, 몽환적인): ")
    duration = int(input("음악 길이를 분 단위로 입력하세요: "))
    test_mode_input = input("테스트용 샘플 음악으로 만들까요? (y/n): ").lower()
    test_mode = True if test_mode_input == 'y' else False

    # 음악 생성
    music_file = generate_music(weather, mood, duration, test_mode=test_mode)