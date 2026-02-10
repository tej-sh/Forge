from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from summary_generate import get_qa_response
from summary_generate import init_chat
app = FastAPI()
app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_methods=["*"],
      allow_headers=["*"],
  )

class VideoRequest(BaseModel):
    url: str
    question: str  | None = None 

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/load")
async def load(request: VideoRequest):
    return {"success": init_chat(request.url)}



# @app.post("/summary")
# async def generate_summary(request: VideoRequest):
#     summary = get_video_summary(request.url)
#     if not summary:
#         raise HTTPException(status_code=400, detail="Could not generate summary , Could not retrieve transcript or invalid URL  ")
#     return {"summary": summary}

@app.post("/qa")
async def answer_question(request: VideoRequest):
    url = request.url
    question = request.question
    ans = get_qa_response(url,question)
    if not ans:
        raise HTTPException(status_code=400, detail="Could not retrieve transcript or invalid URL")

    if ans.startswith("Error:"):
         # Return 429 (Too Many Requests) or 503 (Service Unavailable)
         raise HTTPException(status_code=429, detail=ans)

    return {"answer":ans}