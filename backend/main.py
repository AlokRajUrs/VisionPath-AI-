import time
import base64
import os
import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from models.schemas import NavigationResponse, DetectedObject, PathAnalysis
from services.detector import HybridDetector
from services.depth import DepthEstimator
from services.walkable import WalkableAreaAnalyzer
from services.audio_translator import AlertManager, TRANSLATIONS

app = FastAPI(
    title="VISIONPATH AI Backend",
    description="Assistive smart navigation engine for visually impaired users with real YOLO, MiDaS depth, ground hazard detection, and multilingual voice synthesis",
    version="1.0.0"
)

# Enable CORS for local network and mobile testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI and CV Engines
print("[VisionPath AI] Loading neural models and computer vision pipelines...")
detector = HybridDetector()
depth_estimator = DepthEstimator()
walkable_analyzer = WalkableAreaAnalyzer()
alert_manager = AlertManager(cooldown_sec=2.2)

# In-memory detection event history
event_history: List[Dict[str, Any]] = []
MAX_HISTORY_ITEMS = 150

class FrameRequest(BaseModel):
    image: str # Base64 encoded JPEG or PNG
    calibrated_mode: bool = False
    camera_height_m: float = 1.2
    language: str = "en"

def decode_image_base64(data_str: str) -> Optional[np.ndarray]:
    try:
        if "," in data_str:
            data_str = data_str.split(",", 1)[1]
        img_bytes = base64.b64decode(data_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"[API] Error decoding base64 image: {e}")
        return None

def process_frame_pipeline(frame: np.ndarray, calibrated_mode: bool = False, camera_height_m: float = 1.2) -> NavigationResponse:
    start_t = time.time()
    
    # 1. Object & Small Hazard Detection
    detections = detector.detect(frame)
    
    # 2. Monocular Depth Estimation
    depth_map = depth_estimator.estimate_depth_map(frame)

    # 3. Enrich Detections with Depth Analysis
    for obj in detections:
        rel_depth, dist_m, dist_disp = depth_estimator.get_box_depth(
            depth_map, obj.box, calibrated_mode=calibrated_mode, camera_height_m=camera_height_m
        )
        obj.relative_depth = rel_depth
        obj.estimated_distance_m = dist_m
        obj.distance_display = dist_disp

    # 4. Walkable-Area & Safe-Path Analysis
    path_analysis = walkable_analyzer.analyze(frame, detections, depth_map)

    # 5. Multilingual Alert Generation & Prioritization
    alert_key, announcements, priority = alert_manager.generate_alerts(detections, path_analysis)

    elapsed_ms = (time.time() - start_t) * 1000.0
    fps = round(1000.0 / elapsed_ms, 1) if elapsed_ms > 0 else 30.0

    # 6. Record significant events in history
    now_ts = time.time()
    for obj in detections:
        if obj.risk_level in ["high", "medium"]:
            event_history.insert(0, {
                "id": obj.id,
                "timestamp": now_ts,
                "time_str": time.strftime("%H:%M:%S", time.localtime(now_ts)),
                "name": obj.name,
                "direction": obj.direction,
                "risk_level": obj.risk_level,
                "distance_display": obj.distance_display,
                "confidence": obj.confidence
            })
            if len(event_history) > MAX_HISTORY_ITEMS:
                event_history.pop()

    return NavigationResponse(
        timestamp=now_ts,
        detections=detections,
        path_analysis=path_analysis,
        primary_warning=alert_key,
        voice_announcements=announcements,
        alert_priority=priority,
        repeat_warning=alert_manager.get_last_warning().get("en"),
        fps=fps,
        processing_time_ms=round(elapsed_ms, 1),
        models_ready=detector.is_ready() and depth_estimator.is_ready()
    )

@app.get("/api/health")
def get_health():
    return {
        "status": "online",
        "service": "VISIONPATH AI",
        "yolo_ready": detector.is_ready(),
        "midas_ready": depth_estimator.is_ready(),
        "device": "CPU (Optimized SIMD / ONNX Runtime)",
        "timestamp": time.time()
    }

@app.get("/api/models/status")
def get_models_status():
    return {
        "yolo_model": "YOLOv5n ONNX (FP16 optimized)",
        "yolo_ready": detector.is_ready(),
        "depth_model": "MiDaS v2.1 Small ONNX",
        "depth_ready": depth_estimator.is_ready(),
        "walkable_engine": "Computer Vision Adaptive Corridor Segmentation",
        "supported_languages": ["en", "kn", "hi"],
        "small_hazard_classes": ["small stone", "brick", "cable", "stairs", "pothole", "low obstacle"]
    }

@app.post("/api/process-frame", response_model=NavigationResponse)
def process_frame(req: FrameRequest):
    img = decode_image_base64(req.image)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image payload")
    return process_frame_pipeline(img, calibrated_mode=req.calibrated_mode, camera_height_m=req.camera_height_m)

@app.get("/api/history")
def get_history(limit: int = 50, risk_filter: Optional[str] = None):
    res = event_history
    if risk_filter and risk_filter.lower() != "all":
        res = [e for e in res if e.get("risk_level") == risk_filter.lower()]
    return res[:limit]

@app.post("/api/history/clear")
def clear_history():
    global event_history
    event_history.clear()
    return {"status": "cleared", "count": 0}

@app.get("/api/repeat-warning")
def repeat_warning():
    return alert_manager.get_last_warning()

@app.websocket("/ws/navigation")
async def websocket_navigation(websocket: WebSocket):
    await websocket.accept()
    print("[WebSocket] Client connected for real-time assistive navigation")
    
    calibrated_mode = False
    camera_height_m = 1.2
    is_paused = False

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "frame")

            if msg_type == "pause":
                is_paused = True
                await websocket.send_json({
                    "type": "status",
                    "status": "paused",
                    "voice_announcements": TRANSLATIONS["scanning_paused"]
                })
                continue
            elif msg_type == "resume":
                is_paused = False
                await websocket.send_json({
                    "type": "status",
                    "status": "resumed",
                    "voice_announcements": TRANSLATIONS["scanning_resumed"]
                })
                continue
            elif msg_type == "config":
                calibrated_mode = data.get("calibrated_mode", calibrated_mode)
                camera_height_m = data.get("camera_height_m", camera_height_m)
                continue
            elif msg_type == "repeat_warning":
                last_w = alert_manager.get_last_warning()
                await websocket.send_json({
                    "type": "repeat_warning",
                    "voice_announcements": last_w
                })
                continue

            if is_paused:
                continue

            image_str = data.get("image")
            if not image_str:
                continue

            img = decode_image_base64(image_str)
            if img is None:
                continue

            # Process frame through full pipeline
            resp = process_frame_pipeline(img, calibrated_mode=calibrated_mode, camera_height_m=camera_height_m)
            await websocket.send_json(resp.model_dump())

    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected")
    except Exception as e:
        print(f"[WebSocket] Error during session: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
