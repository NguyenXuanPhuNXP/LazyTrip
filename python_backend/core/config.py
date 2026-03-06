import os
from dotenv import load_dotenv

load_dotenv()

OPEN_WEATHER_KEY = os.getenv("OPEN_WEATHER_KEY")
