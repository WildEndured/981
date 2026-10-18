# server.py
# pip install fastapi uvicorn python-multipart opencv-python-headless anime-face-detector
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from anime_face_detector import create_detector

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # для локальной разработки
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модель загружается один раз при старте
detector = create_detector("yolov3")


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    raw = await file.read()
    arr = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return {"error": "cannot decode image"}

    preds = detector(img)

    # Приводим numpy-массивы к обычным спискам для JSON
    result = []
    for p in preds:
        result.append({
            "bbox": p["bbox"].tolist(),        # [x1, y1, x2, y2, score]
            "keypoints": p["keypoints"].tolist()  # (28, 3): x, y, conf
        })
    return {"faces": result}
