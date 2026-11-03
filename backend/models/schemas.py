from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field

ObstacleDirection = Literal["left", "center", "right"]
RiskLevel = Literal["high", "medium", "low"]
PathStatus = Literal["clear", "caution", "blocked"]
AlertPriority = Literal["critical", "warning", "advisory", "none"]

class DetectedObject(BaseModel):
    id: str
    name: str
    category: str = "general" # "person", "vehicle", "furniture", "small_hazard", "structural"
    confidence: float
    box: List[float] = Field(..., description="[x1, y1, x2, y2] normalized 0.0 to 1.0")
    direction: ObstacleDirection
    relative_depth: float = Field(0.0, description="Inverse relative depth (0.0 far to 1.0 near)")
    estimated_distance_m: Optional[float] = None
    distance_display: str = "Distance unavailable"
    risk_level: RiskLevel
    is_hazard: bool = False

class PathAnalysis(BaseModel):
    left_status: PathStatus = "clear"
    center_status: PathStatus = "clear"
    right_status: PathStatus = "clear"
    left_clearance: float = 1.0
    center_clearance: float = 1.0
    right_clearance: float = 1.0
    recommended_direction: Literal["left", "center", "right", "none"] = "center"
    voice_guidance: str = "Path is clear ahead."
    cautious_advisory: str = "Proceed with caution."
    confidence: float = 0.85

class NavigationResponse(BaseModel):
    timestamp: float
    detections: List[DetectedObject]
    path_analysis: PathAnalysis
    primary_warning: Optional[str] = None
    voice_announcements: Dict[str, str] = Field(
        default_factory=lambda: {"en": "", "kn": "", "hi": ""}
    )
    alert_priority: AlertPriority = "none"
    repeat_warning: Optional[str] = None
    fps: float = 0.0
    processing_time_ms: float = 0.0
    models_ready: bool = True
