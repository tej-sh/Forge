import time
import os
from urllib.parse import urlparse, parse_qs

from youtube_transcript_api import YouTubeTranscriptApi
from google import genai
from google.genai.errors import ClientError
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

PRIMARY_MODEL = "gemini-3-flash-preview"
FALLBACK_MODEL = "gemini-2.5-flash"

active_chats = {}

def get_video_id(url):
    u = urlparse(url)
    if u.query:
        qs = parse_qs(u.query)
        if "v" in qs:
            return qs["v"][0]
    if u.path:
        return u.path.lstrip("/")
    return None

def raw_transcript_generator(video_id):
    try:
        raw_transcript = ""
        x = YouTubeTranscriptApi().fetch(video_id)
        for i in x:
            seconds = int(i.start)
            h, m, s = seconds // 3600, (seconds % 3600) // 60, seconds % 60
            timestamp = f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"
            raw_transcript += f"[{timestamp}]: {i.text} "
        return raw_transcript
    except Exception as e:
        print(f"unable to fetch transcript: {e}")
        return None

def init_chat(url):
    if url in active_chats:
        return True

    video_id = get_video_id(url)
    raw_transcript = raw_transcript_generator(video_id)
    if not raw_transcript:
        return False

    initial_prompt = (
        "here is the transcript of the video. "
        "I will ask you questions about it.\n\n "
        + raw_transcript
    )

    for model in (PRIMARY_MODEL, FALLBACK_MODEL):
        try:
            chat = client.chats.create(model=model)
            chat.send_message(initial_prompt)
            active_chats[url] = {
                "chat": chat,
                "model": model,
                "created_at": time.time()
            }
            return True
        except ClientError as e:
            print(f"gemini error ({model}): {e}")
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                continue
            return False
        except Exception as e:
            print(f"initial_chat exception: {e}")
            return False

    return False

# def get_video_summary(url):
#     video_id = get_video_id(url)
#     raw_transcript = raw_transcript_generator(video_id)
#     try:
#         response = client.models.generate_content(
#             model=PRIMARY_MODEL,
#             contents="Summarize this in one sentence: " + raw_transcript
#         )
#         return response.text
#     except Exception as e:
#         print(f"gemini err : {e}")

def get_qa_response(url, question):
    try:
        chat = active_chats[url]["chat"]
        response = chat.send_message(question)
        return response.text
    except Exception as e:
        print(f"Chat error: {e}")
        return None
