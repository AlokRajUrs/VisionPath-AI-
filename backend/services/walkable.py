import cv2
import numpy as np
from typing import List, Tuple, Optional, Literal
from models.schemas import DetectedObject, PathAnalysis, PathStatus

class WalkableAreaAnalyzer:
    """
    Computer Vision-based Walkable-Area & Safe-Path Analysis.
    Evaluates ground-plane continuity, visual clutter, edge roughness,
    and bounding-box obstruction across Left, Center, and Right corridors.
    Provides cautious directional suggestions.
    """

    def __init__(self):
        pass

    def analyze(self, frame: np.ndarray, detections: List[DetectedObject], depth_map: Optional[np.ndarray] = None) -> PathAnalysis:
        if frame is None or frame.size == 0:
            return PathAnalysis(
                left_status="caution",
                center_status="caution",
                right_status="caution",
                left_clearance=0.5,
                center_clearance=0.5,
                right_clearance=0.5,
                recommended_direction="none",
                voice_guidance="Camera feed unavailable. Please check camera.",
                cautious_advisory="Do not move while camera is offline."
            )

        h, w = frame.shape[:2]

        # 1. Base clearance scores (1.0 = completely open)
        left_clearance = 1.0
        center_clearance = 1.0
        right_clearance = 1.0

        # 2. Factor in Detected Obstacles
        for obj in detections:
            x1, y1, x2, y2 = obj.box
            # If obstacle is in the forward ground or walking height (y2 > 0.4)
            if y2 > 0.38:
                box_weight = 0.5 if obj.risk_level == "high" else (0.28 if obj.risk_level == "medium" else 0.12)
                # Objects closer to feet penalize clearance more severely
                ground_proximity_penalty = min(1.0, max(0.2, (y2 - 0.38) / 0.62))
                effective_penalty = box_weight * ground_proximity_penalty

                # Check horizontal span against left (0-0.35), center (0.28-0.72), right (0.65-1.0)
                if x1 < 0.38:
                    left_clearance = max(0.0, left_clearance - effective_penalty * (1.2 if obj.direction == "left" else 0.7))
                if x1 < 0.70 and x2 > 0.30:
                    center_clearance = max(0.0, center_clearance - effective_penalty * 1.5)
                if x2 > 0.62:
                    right_clearance = max(0.0, right_clearance - effective_penalty * (1.2 if obj.direction == "right" else 0.7))

        # 3. Factor in Ground Texture / Edge Clutter (surface roughness, drop-offs, potholes)
        ground_top = int(h * 0.50)
        ground_roi = frame[ground_top:h, :]
        if ground_roi.shape[0] > 20 and ground_roi.shape[1] > 60:
            gray = cv2.cvtColor(ground_roi, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 40, 120)

            gw = edges.shape[1]
            left_w = int(gw * 0.33)
            center_w = int(gw * 0.67)

            left_edges = np.count_nonzero(edges[:, :left_w]) / float(edges[:, :left_w].size)
            center_edges = np.count_nonzero(edges[:, left_w:center_w]) / float(edges[:, left_w:center_w].size)
            right_edges = np.count_nonzero(edges[:, center_w:]) / float(edges[:, center_w:].size)

            # High edge density indicates uneven terrain, clutter or sudden drop-offs
            if left_edges > 0.14:
                left_clearance = max(0.0, left_clearance - (left_edges - 0.14) * 2.0)
            if center_edges > 0.12:
                center_clearance = max(0.0, center_clearance - (center_edges - 0.12) * 2.4)
            if right_edges > 0.14:
                right_clearance = max(0.0, right_clearance - (right_edges - 0.14) * 2.0)

        # Round clearance values
        left_clearance = round(max(0.0, min(1.0, left_clearance)), 2)
        center_clearance = round(max(0.0, min(1.0, center_clearance)), 2)
        right_clearance = round(max(0.0, min(1.0, right_clearance)), 2)

        # 4. Determine status: "clear" (>0.68), "caution" (0.35-0.68), "blocked" (<0.35)
        def to_status(c: float) -> PathStatus:
            if c >= 0.68:
                return "clear"
            elif c >= 0.35:
                return "caution"
            else:
                return "blocked"

        left_status = to_status(left_clearance)
        center_status = to_status(center_clearance)
        right_status = to_status(right_clearance)

        # 5. Formulate Cautious Navigation Recommendation
        recommended_dir: Literal["left", "center", "right", "none"] = "center"
        voice_guidance = "Center path is clear ahead."
        cautious_advisory = "Walk forward with normal caution."

        if center_status == "clear":
            recommended_dir = "center"
            voice_guidance = "Center path appears clear ahead."
            cautious_advisory = "Path ahead looks open. Continue scanning."
        elif center_status in ["caution", "blocked"]:
            # Center is obstructed or risky
            if left_clearance > 0.60 and left_clearance > right_clearance + 0.1:
                recommended_dir = "left"
                voice_guidance = "Obstacle ahead. Left side appears less obstructed. Please check before moving."
                cautious_advisory = "Caution: Left side is more open, but verify with your cane."
            elif right_clearance > 0.60 and right_clearance > left_clearance + 0.1:
                recommended_dir = "right"
                voice_guidance = "Obstacle ahead. Right side appears less obstructed. Please check before moving."
                cautious_advisory = "Caution: Right side is more open, but verify with your cane."
            elif left_status != "blocked" and right_status == "blocked":
                recommended_dir = "left"
                voice_guidance = "Obstacle ahead. Left side appears less obstructed. Please check before moving."
                cautious_advisory = "Left corridor may be passable. Verify ground."
            elif right_status != "blocked" and left_status == "blocked":
                recommended_dir = "right"
                voice_guidance = "Obstacle ahead. Right side appears less obstructed. Please check before moving."
                cautious_advisory = "Right corridor may be passable. Verify ground."
            else:
                # Both sides blocked or center severely compromised
                recommended_dir = "none"
                voice_guidance = "Warning! Unable to identify a clear path. Please stop."
                cautious_advisory = "Stop immediately. Multiple obstacles detected in walking trajectory."

        # If a critical obstacle like stairs or hole is directly ahead
        for obj in detections:
            if obj.name in ["stairs", "cable"] and obj.direction == "center" and obj.risk_level == "high":
                recommended_dir = "none"
                if obj.name == "stairs":
                    voice_guidance = "Stairs detected ahead. Please stop."
                else:
                    voice_guidance = "Cable detected on the walking surface. Please stop."
                center_status = "blocked"
                cautious_advisory = "Hazard directly ahead on the ground. Halt movement."
                break

        return PathAnalysis(
            left_status=left_status,
            center_status=center_status,
            right_status=right_status,
            left_clearance=left_clearance,
            center_clearance=center_clearance,
            right_clearance=right_clearance,
            recommended_direction=recommended_dir,
            voice_guidance=voice_guidance,
            cautious_advisory=cautious_advisory,
            confidence=round(0.70 + (center_clearance + left_clearance + right_clearance) * 0.10, 2)
        )
