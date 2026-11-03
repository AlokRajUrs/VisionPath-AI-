import os
import cv2
import numpy as np
import onnxruntime as ort
from typing import List, Tuple, Optional

class DepthEstimator:
    """
    Monocular Relative Depth Estimation using MiDaS v2.1 Small ONNX.
    Calculates normalized inverse relative depth for detected objects and scene regions.
    Does NOT fabricate uncalibrated metric distances.
    """

    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, "weights", "midas_small.onnx")

        self.model_path = model_path
        self.session = None
        self.input_name = None
        self.output_name = None
        self.input_size = 256
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
                print(f"[Depth] MiDaS ONNX model initialized successfully: {self.model_path}")
            except Exception as e:
                print(f"[Depth] Error loading MiDaS model: {e}")
                self.session = None
        else:
            print(f"[Depth] MiDaS model weights not found at {self.model_path}")

    def is_ready(self) -> bool:
        return self.session is not None

    def estimate_depth_map(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        Runs MiDaS on input frame and returns a normalized relative inverse depth map (0.0 = far, 1.0 = closest).
        """
        if self.session is None or frame is None or frame.size == 0:
            return None

        h, w = frame.shape[:2]

        try:
            # 1. Resize to 256x256
            img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img_resized = cv2.resize(img, (self.input_size, self.input_size), interpolation=cv2.INTER_CUBIC)
            img_float = img_resized.astype(np.float32) / 255.0

            # 2. Normalize with ImageNet mean/std
            mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
            std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
            img_norm = (img_float - mean) / std

            # 3. Shape [1, 3, 256, 256]
            blob = img_norm.transpose(2, 0, 1)
            blob = np.expand_dims(blob, axis=0)

            # 4. Inference
            output = self.session.run([self.output_name], {self.input_name: blob})[0]
            depth_raw = output[0]  # shape (256, 256)

            # 5. Normalize depth map to [0.0, 1.0]
            d_min = float(np.min(depth_raw))
            d_max = float(np.max(depth_raw))

            if d_max - d_min > 1e-5:
                depth_norm = (depth_raw - d_min) / (d_max - d_min)
            else:
                depth_norm = np.zeros_like(depth_raw)

            # 6. Resize back to original frame size
            depth_map = cv2.resize(depth_norm, (w, h), interpolation=cv2.INTER_LINEAR)
            return depth_map
        except Exception as e:
            print(f"[Depth] Estimation error: {e}")
            return None

    def get_box_depth(self, depth_map: Optional[np.ndarray], box: List[float], calibrated_mode: bool = False, camera_height_m: float = 1.2) -> Tuple[float, Optional[float], str]:
        """
        Extracts relative depth within a normalized bounding box [x1, y1, x2, y2].
        Returns:
            relative_depth: float (0.0 to 1.0, higher = closer)
            estimated_distance_m: Optional[float]
            distance_display: str ("Distance unavailable" or calibrated approximate)
        """
        if depth_map is None:
            # Fallback based on perspective (lower vertical position on screen in walking view corresponds to closer ground proximity)
            rel_depth = round(min(1.0, max(0.0, float(box[3]))), 2)
            return rel_depth, None, "Distance unavailable"

        h, w = depth_map.shape[:2]
        x1 = int(max(0, min(w - 1, box[0] * w)))
        y1 = int(max(0, min(h - 1, box[1] * h)))
        x2 = int(max(x1 + 1, min(w, box[2] * w)))
        y2 = int(max(y1 + 1, min(h, box[3] * h)))

        crop = depth_map[y1:y2, x1:x2]
        if crop.size == 0:
            return 0.5, None, "Distance unavailable"

        # Use 75th percentile of inverse depth inside box (highlights foreground features of obstacle)
        rel_depth = float(np.percentile(crop, 75))
        rel_depth = max(0.0, min(1.0, round(rel_depth, 2)))

        if calibrated_mode:
            # Monocular calibration heuristic based on ground plane intersection
            # Only valid when camera is held at known height and angle
            # Distance inversely scales with normalized inverse depth
            # Avoid showing without user calibration
            approx_dist = round(max(0.4, camera_height_m / (rel_depth + 0.15)), 1)
            dist_display = f"~{approx_dist}m (Calibrated)"
            return rel_depth, approx_dist, dist_display
        else:
            # As explicitly mandated by the user specifications:
            # "If accurate distance is unavailable, show: 'Distance unavailable.' Do not invent distance values."
            return rel_depth, None, "Distance unavailable"
