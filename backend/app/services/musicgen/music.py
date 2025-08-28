import os
import time
from weather import get_weather
from transformers import AutoProcessor, MusicgenForConditionalGeneration
import torch
import numpy as np
import scipy.io.wavfile
import sounddevice as sd

# 날씨 정보 가져오기
weather_info = get_weather(city="Seoul", country="KR")

# 한국어 날씨 영어 변환
weather_map = {
    "맑음": "clear",
    "흐림": "cloudy",
    "튼구름": "partly cloudy",
    "구름많음": "mostly cloudy",
    "비": "rainy",
    "눈": "snowy",
    "소나기": "showers",
    "안개": "foggy"
}

weather_en = weather_map.get(weather_info["description"], "clear")

# user_input 설정
user_input = {
    "weather": weather_en,
    "season": weather_info["season"],
    "activity": "walking",
    "mood": "mysterious and cinematic"
}

# 프롬프트 생성
def generate_prompt(user_input):
    weather = user_input.get("weather")
    season = user_input.get("season")
    activity = user_input.get("activity")
    mood = user_input.get("mood")
    return f"A {mood} {activity} track for a {weather} day in {season}, with natural and ambient sounds."

prompt = generate_prompt(user_input)
print("✅ 생성된 프롬프트:", prompt)

# MusicGen 모델 불러오기
processor = AutoProcessor.from_pretrained("facebook/musicgen-small")
musicgen_model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
musicgen_model.to("cuda" if torch.cuda.is_available() else "cpu")

def generate_music(prompt: str, duration_minutes: int = 1, output_path="generated_music.wav"):
    tokens_per_sec = 16
    MAX_TOKENS_MODEL = 1024
    tokens_per_generate = min(duration_minutes * 60 * tokens_per_sec, MAX_TOKENS_MODEL)

    inputs = processor(text=[prompt], return_tensors="pt").to(musicgen_model.device)
    audio_values = musicgen_model.generate(**inputs, max_new_tokens=tokens_per_generate)

    audio_array = audio_values[0].cpu().numpy()
    if audio_array.ndim > 1:
        audio_array = audio_array.squeeze()

    normalized = audio_array / np.max(np.abs(audio_array))
    int16_audio = (normalized * 32767).astype(np.int16)

    scipy.io.wavfile.write(output_path, rate=32000, data=int16_audio)
    return output_path
# 반복 재생
#repeat_times = walk_minutes  # 1분당 1번 반복
#for i in range(repeat_times):
#    print(f"▶ 재생 {i+1}/{repeat_times}")
#    sd.play(normalized.astype("float32"), samplerate=32000)
#    sd.wait()
#    time.sleep(0.5)  # 반복 사이 잠깐 대기