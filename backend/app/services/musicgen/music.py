# 필요한 모듈 불러오기
import os
import time
import requests
from datetime import datetime
from dotenv import load_dotenv
import torch
import numpy as np
import scipy.io.wavfile
from transformers import AutoProcessor, MusicgenForConditionalGeneration

# 환경변수 불러오기 (.env에서 OPENWEATHER_API_KEY 읽음)
load_dotenv()
API_KEY = os.environ.get("OPENWEATHER_API_KEY")
BASE_URL = "http://api.openweathermap.org/data/2.5/weather"

# 날씨 정보 가져오기 (영어로)
def get_weather(city="Seoul", country="KR"):
    url = f"{BASE_URL}?q={city},{country}&appid={API_KEY}&units=metric&lang=en"
    response = requests.get(url)
    data = response.json()

    if response.status_code == 200:
        weather = {
            "temperature": data["main"]["temp"],
            "description": data["weather"][0]["description"].lower(),  # 영어 소문자
            "season": get_season()
        }
        return weather
    else:
        raise Exception(f"Weather API error: {data}")

# 계절 정보 구하기
def get_season():
    month = datetime.now().month
    if month in [12, 1, 2]:
        return "winter"
    elif month in [3, 4, 5]:
        return "spring"
    elif month in [6, 7, 8]:
        return "summer"
    else:
        return "autumn"

# 프롬프트 생성
def generate_prompt(user_input):
    weather = user_input.get("weather")
    season = user_input.get("season")
    activity = user_input.get("activity")
    mood = user_input.get("mood")
    return f"A {mood} {activity} track for a {weather} day in {season}, with natural and ambient sounds."

# 실행
weather_info = get_weather(city="Seoul", country="KR")

user_input = {
    "weather": weather_info["description"],  # 영어라 그대로 사용
    "season": weather_info["season"],
    "activity": "walking",
    "mood": "energetic and uplifting"
}

prompt = generate_prompt(user_input)
print("✅ 생성된 프롬프트:", prompt)

# MusicGen 모델 불러오기
processor = AutoProcessor.from_pretrained("facebook/musicgen-small")
musicgen_model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
musicgen_model.to("cuda" if torch.cuda.is_available() else "cpu")

# 음악 생성 파라미터
walk_minutes = 1
tokens_per_sec = 16
MAX_TOKENS_MODEL = 1024

tokens_per_generate = min(walk_minutes * 60 * tokens_per_sec, MAX_TOKENS_MODEL)
print(f"✅ 생성 토큰: {tokens_per_generate} tokens")

# 오디오 생성
inputs = processor(text=[prompt], return_tensors="pt").to(musicgen_model.device)
audio_values = musicgen_model.generate(**inputs, max_new_tokens=tokens_per_generate)
audio_array = audio_values[0].cpu().numpy()
if audio_array.ndim > 1:
    audio_array = audio_array.squeeze()

normalized = audio_array / np.max(np.abs(audio_array))
int16_audio = (normalized * 32767).astype(np.int16)

# 파일 저장
output_dir = "musicgen_output"
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "generated_music.wav")
scipy.io.wavfile.write(output_path, rate=32000, data=int16_audio)
print(f"✅ 음악 생성 완료! 저장됨 → {output_path}")