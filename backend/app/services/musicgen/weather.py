import requests
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("OPENWEATHER_API_KEY")
BASE_URL = "http://api.openweathermap.org/data/2.5/weather"

def get_weather(city="Seoul", country="KR"):
    url = f"{BASE_URL}?q={city},{country}&appid={API_KEY}&units=metric&lang=en"
    response = requests.get(url)
    data = response.json()

    if response.status_code == 200:
        weather = {
            "temperature": data["main"]["temp"],
            "description": data["weather"][0]["description"],
            "season": get_season()
        }
        return weather
    else:
        raise Exception(f"Weather API error: {data}")

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
