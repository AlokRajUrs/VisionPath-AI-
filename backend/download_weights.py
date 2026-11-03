import os
import urllib.request

WEIGHTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "weights")
os.makedirs(WEIGHTS_DIR, exist_ok=True)

MODELS = [
    {
        "name": "yolov5n.onnx",
        "url": "https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5n.onnx",
        "size_mb": "~4 MB"
    },
    {
        "name": "midas_small.onnx",
        "url": "https://github.com/isl-org/MiDaS/releases/download/v2_1/model-small.onnx",
        "size_mb": "~66 MB"
    }
]

def download_models():
    print("[VisionPath AI] Checking neural network model weights...")
    for m in MODELS:
        dest = os.path.join(WEIGHTS_DIR, m["name"])
        if not os.path.exists(dest) or os.path.getsize(dest) < 1000000:
            print(f"Downloading {m['name']} ({m['size_mb']}) from {m['url']} ...")
            req = urllib.request.Request(m["url"], headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=120) as resp, open(dest, "wb") as f:
                f.write(resp.read())
            print(f"Saved: {dest} ({os.path.getsize(dest)} bytes)")
        else:
            print(f"Found existing: {m['name']} ({os.path.getsize(dest)} bytes)")
    print("[VisionPath AI] All weights verified and ready.")

if __name__ == "__main__":
    download_models()
