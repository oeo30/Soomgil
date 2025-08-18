from audiocraft.models import MusicGen
import torch

# 모델 로드
print("모델 로드 중... (처음 실행 시 다운로드)")
model = MusicGen.get_pretrained('medium')

def generate_music(weather, mood, duration_minutes, test_mode=False):
    prompt = f"{weather['season']} {weather['description']} 날씨, {mood} 무드 음악"
    print("🎵 생성할 음악 설명:", prompt)

    if test_mode:
        model.set_generation_params(duration=5)  # 샘플 5초
    else:
        model.set_generation_params(duration=duration_minutes * 60)

    audio = model.generate([prompt])[0]
    filename = f"music_{mood}_{duration_minutes}min.mp3" if not test_mode else f"music_{mood}_sample.mp3"
    model.save_audio(audio, filename)
    print("생성된 음악 파일:", filename)
    return filename