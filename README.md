# VISIONPATH AI
## AI-Powered Smart Navigation Assistant for Visually Impaired People
> **Tagline:** *"See the Path Through AI"*  
> **Mission:** *"Smart Vision. Safer Navigation."*

VisionPath AI is a fully functional, real-time, responsive assistive navigation web application designed to help blind and visually impaired individuals identify obstacles, analyze ground hazards, understand their immediate physical surroundings, and receive real-time spoken guidance through their smartphone or Bluetooth headphones.

---

## 1. System Architecture & Tech Stack

```
+-------------------------------------------------------------------------+
|                         Android Smartphone / Browser                    |
|  - HTML5 Video MediaDevices (Rear Camera Environment / Front Camera)   |
|  - Real-Time Visual HUD Canvas (Left | Center | Right Zone Dividers)    |
|  - Web Speech API (Multilingual Synthesis in English, Kannada, Hindi)   |
|  - Web Speech Recognition API (Voice Commands)                          |
|  - Geolocation API (Explicit-permission GPS fix for Emergency SOS)     |
+-------------------------------------------------------------------------+
                                    │ ▲
     JPEG Frames (Base64) @ ~7 FPS  │ │ NavigationResponse (JSON Telemetry)
         via WebSocket / REST       ▼ │
+-------------------------------------------------------------------------+
|                         FastAPI ASGI Backend (Python)                   |
|  - Asynchronous WebSocket Server (`/ws/navigation`)                     |
|  - Hybrid Detector:                                                     |
|      * Real YOLO ONNX Model (SIMD-accelerated CPU Inference)            |
|      * Ground Hazard CV Engine (Stones, Bricks, Cables, Stairs, Potholes)|
|  - Monocular Relative Depth Estimator (Intel ISL MiDaS v2.1 Small ONNX) |
|  - Walkable-Area & Safe-Path Analyzer (3-Corridor Ground Plane Scorer)  |
|  - Multilingual Alert Manager & Warning Cooldown Orchestrator           |
+-------------------------------------------------------------------------+
```

### Frontend
- **React 19 & TypeScript**: Responsive, accessible, mobile-first design.
- **Tailwind CSS**: Dark navy blue theme (`#060B14`, `#0A0F1D`) with high-contrast cyan (`#00F0FF`) and safety status indicators.
- **Lucide React Icons**: Semantic, crisp visual indicators.
- **Web Speech API**: Real-time voice announcements in **English (`en-US`)**, **Kannada (`kn-IN`)**, and **Hindi (`hi-IN`)**.
- **Speech Recognition API**: Hands-free voice commands.
- **PWA Ready**: Web App Manifest (`manifest.json`) and mobile viewport optimization.

### Backend
- **FastAPI & Uvicorn**: High-performance asynchronous REST and WebSockets.
- **ONNX Runtime (SIMD CPU)**: Sub-50ms neural inference on standard CPUs without GPU dependencies.
- **YOLOv5n ONNX**: Real 80-class object detection (people, cars, buses, bikes, chairs, tables, etc.).
- **Ground Hazard CV Pipeline**: Canny edge and Probabilistic Hough Line transforms for wires/cables; contrast blob contour analysis for small stones and footpath blocks; horizontal gradient grouping for stairs and curbs.
- **MiDaS v2.1 Small ONNX**: Normalized monocular relative depth estimation.
- **Walkable Corridor Analyzer**: Evaluates Left, Center, and Right traversal clearance and formulates cautious directional guidance.

---

## 2. Completed Application Pages

1. **Home (`/`)**:
   - Hero banner with tagline *"See the Path Through AI"*.
   - Prominent **Start Navigation** button and **How It Works** workflow.
   - Assistive visual HUD illustration simulating camera scan and hazard detection.
   - Full technology stack summary and safety disclosures.

2. **Navigation Dashboard (`/dashboard`)**:
   - Live video feed with augmented canvas overlays (3 vertical zones, ground walking corridor, bounding boxes, risk tags).
   - Real-time AI detection feed (confidence, risk level, direction, distance display).
   - Safe-path clearance cards (Left, Center, Right corridor statuses).
   - Voice assistant panel with active announcement display, speech speed controls, language selector, and **Repeat Last Warning** button.
   - Hands-free voice command recognition.

3. **Live Assist (`/live`)**:
   - Dedicated full-screen high-contrast assistive screen designed specifically for smartphone chest mounts or handheld walking.
   - Massive tactile buttons (Start/Stop, Repeat, Switch Camera, SOS).
   - Massive high-visibility spoken alert banner at the bottom.
   - Mobile haptic vibration buzz on high-risk hazards.

4. **Detection History (`/history`)**:
   - Session audit log of detected obstacles, timestamps, directions, and risk levels.
   - Filter by risk level (All, High, Medium, Low).
   - Clear history button.
   - Strict privacy guarantee: no camera video or images are stored or uploaded.

5. **Settings (`/settings`)**:
   - Language selector (English, Kannada, Hindi).
   - Voice audio toggle, speech rate (0.75x to 1.4x), haptic feedback toggle.
   - Camera hardware selector (Rear environment, Front user, USB webcams) and resolution (480p / 720p).
   - Metric calibration mode: Option to input camera height (e.g. 1.2m) for approximate metric estimates, or maintain the default safe mode showing *"Distance unavailable"*.
   - Emergency contact configuration (Name, Phone number, Custom SMS template).

6. **Emergency Assistance (`/emergency`)**:
   - Emergency SOS trigger with confirmation modal to prevent accidental activation.
   - Direct phone call shortcut (`tel:`) launching the phone dialer.
   - Direct assistance SMS shortcut (`sms:`) with prefilled text and coordinates.
   - GPS location module: Queries latitude, longitude, and accuracy with explicit user permission and provides a Google Maps link.

7. **About VisionPath AI (`/about`)**:
   - Project mission and assistive technology principles.
   - Mandatory safety rules and prototype disclosures.
   - Technical model specifications.

---

## 3. How to Run on Windows

### Prerequisites
- Python 3.10+ (installed on PATH)
- Node.js 18+ and npm

### Step 1: Start the Python FastAPI Backend
Open a terminal (PowerShell or Command Prompt):
```powershell
cd C:\Users\alokr\.gemini\antigravity\scratch\visionpath-ai\backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
*The backend will automatically load `weights/yolov5n.onnx` and `weights/midas_small.onnx` and start listening on port 8000.*

### Step 2: Start the React Frontend
Open a second terminal:
```powershell
cd C:\Users\alokr\.gemini\antigravity\scratch\visionpath-ai\frontend
npm run preview -- --host 0.0.0.0 --port 5173
```
*Alternatively for development: `npm run dev -- --host 0.0.0.0 --port 5173`.*

Open your browser to:
- **Local Laptop:** [http://localhost:5173](http://localhost:5173)

---

## 4. How to Test on an Android Smartphone

To test VisionPath AI on your Android phone using your rear camera while the backend runs on your laptop:

### Method A: Over Local Wi-Fi Network
1. Ensure your Android smartphone and Windows laptop are connected to the same Wi-Fi network (or smartphone mobile hotspot).
2. Find your laptop's local IPv4 address (e.g. `10.220.197.63` or `10.226.146.63` via `ipconfig`).
3. Open Chrome on your Android phone.
4. **Important for Camera Permissions on Mobile Chrome:**
   Mobile browsers restrict camera access (`getUserMedia`) to secure contexts (`localhost` or `https:`). To allow camera access on local IP over HTTP:
   - In Chrome on Android, navigate to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
   - Enable the flag.
   - In the text box, enter: `http://<YOUR_LAPTOP_IP>:5173,http://<YOUR_LAPTOP_IP>:8000`
   - Tap **Relaunch** at the bottom of Chrome.
5. Navigate to: `http://<YOUR_LAPTOP_IP>:5173`
6. Tap **START NAVIGATION** and grant camera permissions when prompted. The rear camera will turn on automatically!

### Method B: Via USB Cable & ADB Reverse (Zero Wi-Fi Latency)
If you have an Android device connected via USB with USB Debugging enabled:
```powershell
adb reverse tcp:5173 tcp:5173
adb reverse tcp:8000 tcp:8000
```
Then on your phone's browser simply open:
`http://localhost:5173`
*Chrome treats `localhost` as an intrinsically secure origin, so camera permissions are granted immediately without any flags!*

### Installing as a Progressive Web App (PWA) on Android
1. Open VisionPath AI in Chrome on your phone.
2. Tap the three dots menu (⋮) in the top-right corner.
3. Tap **Add to Home screen** or **Install app**.
4. VisionPath AI will now launch in standalone full-screen mode like a native app.

---

## 5. Voice Commands Reference

When Voice Commands (Microphone) are active, you can speak naturally to control the assistant:
- **"Start navigation"** or **"Start"**: Begins camera scanning and audio guidance.
- **"Stop navigation"** or **"Stop"**: Stops scanning and releases the camera.
- **"Pause scanning"** / **"Resume scanning"**: Pauses or resumes detection loop.
- **"Repeat warning"** / **"Repeat"**: Speaks the most recent hazard warning again.
- **"Tell me what is in front of me"** / **"What is ahead"**: Describes obstacles in the central walking path.
- **"Enable voice"** / **"Disable voice"**: Toggles spoken speech output.
- **"English"** / **"Kannada"** / **"Hindi"**: Switches voice announcement language.
- **"Check camera status"**: Speaks current camera operational state.
- **"Check navigation status"**: Speaks active detections count and system health.

---

## 6. Real-World Testing & Scenarios

The system has been designed and tested for:
1. **Stationary & Moving People:** Detects people entering traversal path; announces *"Person approaching from the front"*.
2. **Vehicles & Cycles:** Detects cars, bikes, buses, and trucks; announces high-priority warnings (*"Vehicle detected nearby. Stay alert."*).
3. **Small Ground Hazards:**
   - **Cables & Wires:** Canny & Hough line transforms detect thin curvilinear lines lying across the walking floor; announces *"Cable detected on the walking surface"*.
   - **Stones & Bricks:** Contrast contour segmentation isolates raised objects in the lower 50% of the frame; announces direction and proximity.
   - **Stairs & Steps:** Clustered horizontal edge detection alerts before descending/ascending steps; announces *"Stairs detected ahead. Please stop."*
4. **Walkable-Area Directional Guidance:**
   - When Center is blocked and Left is clear: *"Obstacle ahead. Left side appears less obstructed. Please check before moving."*
   - When Left, Center, and Right are all blocked: *"Warning! Unable to identify a clear path. Please stop."*
5. **Distance Reporting:**
   - Displays *"Distance unavailable"* unless metric calibration is enabled in Settings, preventing fabricated metric measurements.

---

## 7. Important Safety & Assistive Disclaimers

1. **Experimental Prototype:** VisionPath AI is an assistive technology demonstration and prototype. It is NOT a medical device.
2. **Orientation & Mobility Priority:** It MUST NEVER replace a white cane, guide dog, or tactile navigation tools.
3. **Environmental Factors:** Poor lighting, camera smudges, fast panning, or heavy occlusions can affect computer vision accuracy. Always test in controlled environments with a sighted supervisor first.
4. **Data Privacy:** All camera video processing occurs strictly in RAM and is discarded immediately. No video files or frames are ever saved or transmitted to third-party cloud services.
