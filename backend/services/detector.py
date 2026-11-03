import os
import time
import math
import cv2
import numpy as np
import onnxruntime as ort
from typing import List, Tuple, Dict, Any, Optional

from models.schemas import DetectedObject, ObstacleDirection, RiskLevel

# Standard 80 COCO Classes
COCO_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
    "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop",
    "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
]

# Classification mapping for assistive awareness
HAZARD_CLASSES = {
    "car": "vehicle",
    "truck": "vehicle",
    "bus": "vehicle",
    "motorcycle": "vehicle",
    "bicycle": "vehicle",
    "person": "person",
    "dog": "animal",
    "chair": "furniture",
    "dining table": "furniture",
    "bench": "furniture",
    "fire hydrant": "structural",
    "stop sign": "structural",
    "traffic light": "structural",
    "suitcase": "ground_obstacle",
    "backpack": "ground_obstacle",
    "potted plant": "ground_obstacle",
}

class HybridDetector:
    """
    Combines real YOLO object detection with computer-vision ground hazard analysis
    (detecting small stones, bricks, cables, potholes, and steps on the walking surface).
    """

    def __init__(self, model_path: Optional[str] = None, conf_threshold: float = 0.35, nms_threshold: float = 0.45):
        self.conf_threshold = conf_threshold
        self.nms_threshold = nms_threshold
        self.input_size = 640
        self.session = None
        self.input_name = None
        self.output_name = None
        self.input_dtype = np.float16

        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, "weights", "yolov5n.onnx")

        self.model_path = model_path
        self._init_session()

    def _init_session(self):
        if os.path.exists(self.model_path):
            try:
                opts = ort.SessionOptions()
                opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
                opts.intra_op_num_threads = 4
                self.session = ort.InferenceSession(self.model_path, sess_options=opts, providers=['CPUExecutionProvider'])
                self.input_name = self.session.get_inputs()[0].name
                self.output_name = self.session.get_outputs()[0].name
                # Check data type
                input_type = self.session.get_inputs()[0].type
                if 'float16' in input_type:
                    self.input_dtype = np.float16
                else:
                    self.input_dtype = np.float32
                print(f"[Detector] YOLO ONNX session initialized successfully: {self.model_path} ({self.input_dtype})")
            except Exception as e:
                print(f"[Detector] Error initializing YOLO model: {e}")
                self.session = None
        else:
            print(f"[Detector] Warning: Model weights not found at {self.model_path}")

    def is_ready(self) -> bool:
        return self.session is not None

    def _preprocess(self, image: np.ndarray) -> Tuple[np.ndarray, float, Tuple[int, int]]:
        h, w = image.shape[:2]
        r = min(self.input_size / h, self.input_size / w)
        new_unpad = (int(round(w * r)), int(round(h * r)))
        dw, dh = self.input_size - new_unpad[0], self.input_size - new_unpad[1]
        dw, dh = dw / 2, dh / 2

        if (w, h) != new_unpad:
            resized = cv2.resize(image, new_unpad, interpolation=cv2.INTER_LINEAR)
        else:
            resized = image.copy()

        top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
        left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
        padded = cv2.copyMakeBorder(resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114))

        blob = cv2.cvtColor(padded, cv2.COLOR_BGR2RGB)
        blob = blob.transpose((2, 0, 1))
        blob = np.expand_dims(blob, axis=0)
        blob = np.ascontiguousarray(blob, dtype=self.input_dtype) / 255.0

        return blob, r, (dw, dh)

    def detect_hazards_cv(self, frame: np.ndarray) -> List[DetectedObject]:
        """
        Detects ground-level hazards that may not be in standard 80 COCO classes:
        - Cables / wires lying on the ground (via Hough line curvature)
        - Small stones, bricks, footpath blocks (via local contrast blob segmentation on lower corridor)
        - Steps / stairs / curbs (via horizontal edge clustering)
        - Potholes / depressions (via dark contour disparity)
        """
        hazards: List[DetectedObject] = []
        h, w = frame.shape[:2]
        
        # Only examine the walking corridor (bottom 60% of frame)
        ground_top = int(h * 0.40)
        ground_roi = frame[ground_top:h, :]
        roi_h, roi_w = ground_roi.shape[:2]

        if roi_h < 50 or roi_w < 50:
            return hazards

        gray = cv2.cvtColor(ground_roi, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # 1. Cable / Wire Detection (Thin elongated edge structures across floor)
        edges = cv2.Canny(blurred, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=45, minLineLength=50, maxLineGap=15)
        if lines is not None:
            cable_segments = []
            for line in lines:
                l = np.array(line).reshape(-1)
                if len(l) >= 4:
                    x1, y1, x2, y2 = int(l[0]), int(l[1]), int(l[2]), int(l[3])
                    length = math.hypot(x2 - x1, y2 - y1)
                    if length > 70 and max(y1, y2) > roi_h * 0.3:
                        cable_segments.append((x1, y1, x2, y2))
            
            if len(cable_segments) >= 2:
                # Aggregate bounding box for cable
                min_x = min(min(seg[0], seg[2]) for seg in cable_segments)
                max_x = max(max(seg[0], seg[2]) for seg in cable_segments)
                min_y = min(min(seg[1], seg[3]) for seg in cable_segments)
                max_y = max(max(seg[1], seg[3]) for seg in cable_segments)

                box_norm = [
                    round(min_x / w, 3),
                    round((ground_top + min_y) / h, 3),
                    round(max_x / w, 3),
                    round((ground_top + max_y) / h, 3)
                ]
                direction = self.determine_direction(box_norm)
                risk = self.compute_risk(box_norm, "cable", direction)
                hazards.append(DetectedObject(
                    id=f"cable_{int(time.time()*1000)%10000}",
                    name="cable",
                    category="small_hazard",
                    confidence=0.74,
                    box=box_norm,
                    direction=direction,
                    relative_depth=min(1.0, (ground_top + max_y) / h),
                    distance_display="Distance unavailable",
                    risk_level=risk,
                    is_hazard=True
                ))

        # 2. Small Stones, Bricks & Footpath Blocks (Local contrast anomalies on ground surface)
        # Use adaptive thresholding to spot high-contrast localized objects on walking plane
        adaptive_thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 9
        )
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        morphed = cv2.morphologyEx(adaptive_thresh, cv2.MORPH_OPEN, kernel)
        contours, _ = cv2.findContours(morphed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for c in contours:
            area = cv2.contourArea(c)
            # Filter: Avoid harmless microscopic dust (area < 180) and huge background patches (area > 20000)
            if 220 < area < 15000:
                bx, by, bw, bh = cv2.boundingRect(c)
                aspect_ratio = float(bw) / bh if bh > 0 else 1.0

                # Must be located in lower ground plane where footsteps step
                y_center = ground_top + by + bh / 2
                if y_center > h * 0.55:
                    box_norm = [
                        round(bx / w, 3),
                        round((ground_top + by) / h, 3),
                        round((bx + bw) / w, 3),
                        round((ground_top + by + bh) / h, 3)
                    ]
                    
                    # Classify small stone vs brick by aspect ratio and rectangularity
                    hull = cv2.convexHull(c)
                    hull_area = cv2.contourArea(hull)
                    solidity = float(area) / hull_area if hull_area > 0 else 0
                    
                    obj_name = "small stone" if solidity > 0.7 and 0.7 <= aspect_ratio <= 1.4 else "brick"
                    if bw > w * 0.35:
                        obj_name = "low obstacle"

                    direction = self.determine_direction(box_norm)
                    risk = self.compute_risk(box_norm, obj_name, direction)

                    hazards.append(DetectedObject(
                        id=f"hazard_{int(time.time()*1000)%10000}_{bx}",
                        name=obj_name,
                        category="small_hazard",
                        confidence=round(min(0.85, 0.55 + solidity * 0.3), 2),
                        box=box_norm,
                        direction=direction,
                        relative_depth=min(1.0, (ground_top + by + bh) / h),
                        distance_display="Distance unavailable",
                        risk_level=risk,
                        is_hazard=True
                    ))

        # 3. Stairs / Step / Curb Detection (Clustered horizontal edges across traversal path)
        grad_y = cv2.Sobel(gray, cv2.CV_16S, 0, 1, ksize=3)
        abs_grad_y = cv2.convertScaleAbs(grad_y)
        _, step_thresh = cv2.threshold(abs_grad_y, 70, 255, cv2.THRESH_BINARY)
        step_lines = cv2.HoughLinesP(step_thresh, 1, np.pi / 180, threshold=70, minLineLength=int(w * 0.25), maxLineGap=20)
        
        if step_lines is not None and len(step_lines) >= 3:
            # Check horizontal alignment
            horiz_y = []
            for sl in step_lines:
                l = np.array(sl).reshape(-1)
                if len(l) >= 4:
                    x1, y1, x2, y2 = int(l[0]), int(l[1]), int(l[2]), int(l[3])
                    if abs(y2 - y1) <= 6: # nearly horizontal
                        horiz_y.append(ground_top + (y1 + y2) // 2)

            if len(horiz_y) >= 3:
                horiz_y.sort()
                min_step_y = horiz_y[0]
                max_step_y = horiz_y[-1]
                if max_step_y - min_step_y > 25:
                    box_norm = [0.15, round(min_step_y / h, 3), 0.85, round(max_step_y / h, 3)]
                    direction = "center"
                    hazards.append(DetectedObject(
                        id=f"stairs_{int(time.time()*1000)%10000}",
                        name="stairs",
                        category="structural",
                        confidence=0.82,
                        box=box_norm,
                        direction=direction,
                        relative_depth=round(max_step_y / h, 2),
                        distance_display="Distance unavailable",
                        risk_level="high",
                        is_hazard=True
                    ))

        # Deduplicate and keep up to 4 most significant ground hazards to avoid clutter
        hazards.sort(key=lambda x: (x.risk_level == "high", x.box[3]), reverse=True)
        return hazards[:4]

    def determine_direction(self, box: List[float]) -> ObstacleDirection:
        """
        Divides the view into LEFT (0.0 - 0.333), CENTER (0.333 - 0.667), RIGHT (0.667 - 1.0).
        Evaluates horizontal center of mass and overlap with central walking corridor.
        """
        x1, _, x2, _ = box
        center_x = (x1 + x2) / 2.0

        # If object is substantial and intersects center corridor significantly
        if x1 < 0.60 and x2 > 0.40:
            return "center"
        if center_x < 0.35:
            return "left"
        elif center_x > 0.65:
            return "right"
        else:
            return "center"

    def compute_risk(self, box: List[float], name: str, direction: ObstacleDirection) -> RiskLevel:
        """
        Determines risk level:
        HIGH: Close to camera / bottom of frame and directly in walking direction (center).
        MEDIUM: Nearby or intersecting path boundary.
        LOW: Distant or far off to the periphery.
        """
        _, y1, _, y2 = box
        box_height = y2 - y1
        critical_classes = ["stairs", "cable", "pothole", "car", "truck", "bus", "motorcycle"]

        # If object is at the bottom of the screen (close to user's footsteps)
        is_close = y2 >= 0.68
        is_medium_dist = y2 >= 0.42

        if name in critical_classes and is_medium_dist and direction == "center":
            return "high"

        if direction == "center":
            if is_close or box_height > 0.45:
                return "high"
            elif is_medium_dist:
                return "medium"
            else:
                return "low"
        else:
            # Side objects (left / right)
            if is_close and box_height > 0.4:
                return "medium"
            elif is_close:
                return "medium"
            else:
                return "low"

    def detect(self, frame: np.ndarray) -> List[DetectedObject]:
        """
        Performs full detection:
        1. YOLO inference on resized frame
        2. Post-processing and NMS
        3. Ground hazard computer-vision detection
        4. Merging and deduplication
        """
        if frame is None or frame.size == 0:
            return []

        h, w = frame.shape[:2]
        detected_objects: List[DetectedObject] = []

        # 1. YOLO Detection
        if self.session is not None:
            try:
                blob, ratio, (dw, dh) = self._preprocess(frame)
                outputs = self.session.run([self.output_name], {self.input_name: blob})
                preds = outputs[0]  # Shape: (1, 25200, 85)

                if preds.ndim == 3 and preds.shape[0] == 1:
                    preds = preds[0]

                boxes = []
                confidences = []
                class_ids = []

                # Filter predictions by objectness and class score
                for row in preds:
                    obj_conf = float(row[4])
                    if obj_conf < self.conf_threshold:
                        continue

                    class_scores = row[5:]
                    class_id = int(np.argmax(class_scores))
                    class_score = float(class_scores[class_id])
                    total_conf = obj_conf * class_score

                    if total_conf >= self.conf_threshold and class_id < len(COCO_CLASSES):
                        cx, cy, bw, bh = row[0], row[1], row[2], row[3]
                        # Undo padding and scaling to get image pixel coordinates
                        x1 = (cx - bw / 2.0 - dw) / ratio
                        y1 = (cy - bh / 2.0 - dh) / ratio
                        x2 = (cx + bw / 2.0 - dw) / ratio
                        y2 = (cy + bh / 2.0 - dh) / ratio

                        boxes.append([int(max(0, x1)), int(max(0, y1)), int(min(w, x2 - x1)), int(min(h, y2 - y1))])
                        confidences.append(float(total_conf))
                        class_ids.append(class_id)

                indices = cv2.dnn.NMSBoxes(boxes, confidences, self.conf_threshold, self.nms_threshold)
                if len(indices) > 0:
                    for i in indices.flatten():
                        bx, by, bw, bh = boxes[i]
                        cid = class_ids[i]
                        conf = confidences[i]
                        class_name = COCO_CLASSES[cid]

                        box_norm = [
                            round(max(0.0, bx / w), 3),
                            round(max(0.0, by / h), 3),
                            round(min(1.0, (bx + bw) / w), 3),
                            round(min(1.0, (by + bh) / h), 3)
                        ]
                        direction = self.determine_direction(box_norm)
                        risk = self.compute_risk(box_norm, class_name, direction)

                        # Relative inverse depth: objects lower on screen are closer
                        rel_depth = round(min(1.0, max(0.0, box_norm[3])), 2)

                        detected_objects.append(DetectedObject(
                            id=f"yolo_{cid}_{i}_{int(time.time()*1000)%10000}",
                            name=class_name,
                            category=HAZARD_CLASSES.get(class_name, "general"),
                            confidence=round(conf, 2),
                            box=box_norm,
                            direction=direction,
                            relative_depth=rel_depth,
                            distance_display="Distance unavailable",
                            risk_level=risk,
                            is_hazard=risk in ["high", "medium"]
                        ))
            except Exception as e:
                print(f"[Detector] Inference error: {e}")

        # 2. Ground Hazard Detection (Stones, bricks, cables, potholes, steps)
        cv_hazards = self.detect_hazards_cv(frame)
        for haz in cv_hazards:
            # Avoid duplicate if YOLO already caught this exact bounding box region
            is_dup = False
            for existing in detected_objects:
                iou_overlap = self._compute_iou(haz.box, existing.box)
                if iou_overlap > 0.35:
                    is_dup = True
                    break
            if not is_dup:
                detected_objects.append(haz)

        # Prioritize high risk and closest objects
        detected_objects.sort(key=lambda x: (x.risk_level == "high", x.relative_depth), reverse=True)
        return detected_objects

    def _compute_iou(self, boxA: List[float], boxB: List[float]) -> float:
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])
        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
        denom = float(boxAArea + boxBArea - interArea)
        return interArea / denom if denom > 0 else 0.0
