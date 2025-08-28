# -*- coding: utf-8 -*-
"""
MusicGen 빠른 프리뷰 → 길게 생성 파이프라인 (OpenWeather 기반 프롬프트)
- CPU에서도 '프리뷰'는 빠르게, GPU면 더 빠르게
- .env에 OPENWEATHER_API_KEY가 있으면 실제 날씨 반영, 없으면 폴백
- --long, --tokens, --mood, --activity 등 CLI 옵션 지원
Usage:
  python musicgen_run.py                      # 프리뷰(256토큰) 생성
  python musicgen_run.py --long 768          # 길게 생성(768토큰)
  python musicgen_run.py --city Seoul --country KR --mood calm --activity jogging
"""

import os
import time
import argparse
import requests
from datetime import datetime
from dotenv import load_dotenv

import torch
import numpy as np
import scipy.io.wavfile as wav

from transformers import AutoProcessor, MusicgenForConditionalGeneration

# -------------------------------
# 0) 설정/유틸
# -------------------------------
SAMPLING_RATE = 32000
MODEL_NAME = "facebook/musicgen-small"

# 캐시 고정(최초 1회 다운로드 후 재사용)
os.environ.setdefault("HF_HOME", os.path.expanduser("~/.cache/huggingface"))
os.environ.setdefault("TRANSFORMERS_CACHE", os.path.expanduser("~/.cache/huggingface/transformers"))

def choose_device_and_threads():
    """CUDA > MPS(애플 실리콘) > CPU 선택, CPU일 때 스레드 튜닝"""
    if torch.cuda.is_available():
        device = "cuda"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = "mps"
    else:
        device = "cpu"
        # CPU 스레드 과다 사용 방지
        try:
            torch.set_num_threads(max(1, os.cpu_count() // 2))
            torch.set_num_interop_threads(1)
        except Exception:
            pass
    return device

def get_season():
    m = datetime.now().month
    if m in (12, 1, 2):
        return "winter"
    if m in (3, 4, 5):
        return "spring"
    if m in (6, 7, 8):
        return "summer"
    return "autumn"

def fetch_weather(city="Seoul", country="KR"):
    """OPENWEATHER_API_KEY 없거나 실패해도 폴백으로 동작"""
    load_dotenv()
    API_KEY = os.environ.get("OPENWEATHER_API_KEY")
    if not API_KEY:
        return {"temperature": None, "description": "clear sky", "season": get_season()}

    url = f"http://api.openweathermap.org/data/2.5/weather?q={city},{country}&appid={API_KEY}&units=metric&lang=en"
    try:
        r = requests.get(url, timeout=10)
        data = r.json()
        if r.status_code == 200:
            return {
                "temperature": data["main"]["temp"],
                "description": data["weather"][0]["description"].lower(),
                "season": get_season()
            }
    except Exception:
        pass
    # 실패 시 폴백
    return {"temperature": None, "description": "clear sky", "season": get_season()}

def build_prompt(weather_desc: str, season: str, activity: str, mood: str) -> str:
    return (f"A {mood} {activity} track for a {weather_desc} day in {season}, "
            f"with natural and ambient sounds.")

def normalize_audio(x: np.ndarray) -> np.ndarray:
    x = x.astype(np.float32)
    peak = np.max(np.abs(x)) if x.size else 0.0
    if peak < 1e-9:
        return x
    return x / peak

def save_wav(path: str, audio: np.ndarray, sr: int = SAMPLING_RATE):
    audio16 = (np.clip(audio, -1, 1) * 32767).astype(np.int16)
    wav.write(path, rate=sr, data=audio16)

# -------------------------------
# 1) 메인 파이프라인
# -------------------------------
def generate_music(
    city="Seoul", country="KR",
    activity="walking",
    mood="energetic and uplifting",
    tokens=256,
    out_dir="musicgen_output",
    out_name=None
):
    t_total = time.time()

    # 1) 장치/스레드
    device = choose_device_and_threads()
    print(f"▶ Device: {device} | CUDA:{torch.cuda.is_available()} | "
          f"MPS:{hasattr(torch.backends,'mps') and torch.backends.mps.is_available()}")

    # 2) 날씨 → 프롬프트
    t0 = time.time()
    w = fetch_weather(city, country)
    prompt = build_prompt(w["description"], w["season"], activity, mood)
    print(f"▶ Weather: {w['description']} / {w['season']}")
    print(f"▶ Prompt:  {prompt}")
    print(f"  (weather fetch: {time.time()-t0:.2f}s)")

    # 3) 모델/프로세서 로드
    t1 = time.time()
    processor = AutoProcessor.from_pretrained(MODEL_NAME)
    print(f"  processor loaded in {time.time()-t1:.2f}s")

    t2 = time.time()
    model = MusicgenForConditionalGeneration.from_pretrained(MODEL_NAME)
    model.to(device)
    model.eval()
    print(f"  model loaded in {time.time()-t2:.2f}s")

    # 4) 입력 준비
    t3 = time.time()
    inputs = processor(text=[prompt], return_tensors="pt").to(device)
    print(f"  prep in {time.time()-t3:.2f}s")

    # 5) 생성 (프리뷰/롱 둘 다 동일 함수, 토큰만 달라짐)
    print(f"▶ Generating... max_new_tokens={tokens}")
    t4 = time.time()
    with torch.inference_mode():
        if device == "cuda":
            from torch.cuda.amp import autocast
            with autocast(dtype=torch.float16):
                audio_values = model.generate(
                    **inputs,
                    max_new_tokens=tokens,
                    do_sample=True,
                    top_k=50,
                    top_p=0.95,
                    temperature=1.0
                )
        else:
            audio_values = model.generate(
                **inputs,
                max_new_tokens=tokens,
                do_sample=True,
                top_k=50,
                top_p=0.95,
                temperature=1.0
            )
    print(f"  generate in {time.time()-t4:.2f}s")

    # 6) 후처리/저장
    t5 = time.time()
    audio = audio_values[0].detach().cpu().numpy()
    if audio.ndim > 1:
        audio = audio.squeeze()
    audio = normalize_audio(audio)

    os.makedirs(out_dir, exist_ok=True)
    if out_name is None:
        # 파일명에 토큰/도시/무드 요약
        mood_tag = mood.replace(" ", "_")[:20]
        out_name = f"{city}_{mood_tag}_{tokens}t.wav"
    out_path = os.path.join(out_dir, out_name)
    save_wav(out_path, audio, SAMPLING_RATE)
    print(f"▶ Saved: {out_path} (post {time.time()-t5:.2f}s)")

    print(f"✓ Done. Total {time.time()-t_total:.2f}s")
    return out_path

# -------------------------------
# 2) CLI
# -------------------------------
def parse_args():
    p = argparse.ArgumentParser(description="MusicGen weather-aware generator")
    p.add_argument("--city", type=str, default="Seoul", help="도시명 (영문)")
    p.add_argument("--country", type=str, default="KR", help="국가 코드 (예: KR, US)")
    p.add_argument("--activity", type=str, default="walking", help="활동 (walking/jogging 등)")
    p.add_argument("--mood", type=str, default="energetic and uplifting", help="분위기 (calm, dreamy 등 자유롭게)")
    p.add_argument("--tokens", type=int, default=256, help="프리뷰/생성 토큰 수 (256 권장, 512/768/1024로 점진적 증가)")
    p.add_argument("--long", type=int, default=None, help="길게 다시 생성할 토큰 수 (예: 768). 지정시 2개 파일 생성.")
    p.add_argument("--out_dir", type=str, default="musicgen_output", help="출력 폴더")
    return p.parse_args()

def main():
    args = parse_args()

    # 1) 프리뷰 or 단일 생성
    preview_path = generate_music(
        city=args.city,
        country=args.country,
        activity=args.activity,
        mood=args.mood,
        tokens=args.tokens,
        out_dir=args.out_dir,
        out_name=None
    )

    # 2) --long 지정 시 길게 한 번 더 생성
    if args.long:
        print("\n=== Long version requested ===")
        _ = generate_music(
            city=args.city,
            country=args.country,
            activity=args.activity,
            mood=args.mood,
            tokens=args.long,
            out_dir=args.out_dir,
            out_name=None
        )

if __name__ == "__main__":
    main()
