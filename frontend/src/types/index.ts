export type ObstacleDirection = "left" | "center" | "right";
export type RiskLevel = "high" | "medium" | "low";
export type PathStatus = "clear" | "caution" | "blocked";
export type AlertPriority = "critical" | "warning" | "advisory" | "none";
export type Language = "en" | "kn" | "hi";

export interface DetectedObject {
  id: string;
  name: string;
  category: string;
  confidence: number;
  box: [number, number, number, number]; // [x1, y1, x2, y2] normalized 0-1
  direction: ObstacleDirection;
  relative_depth: number;
  estimated_distance_m: number | null;
  distance_display: string;
  risk_level: RiskLevel;
  is_hazard: boolean;
}

export interface PathAnalysis {
  left_status: PathStatus;
  center_status: PathStatus;
  right_status: PathStatus;
  left_clearance: number;
  center_clearance: number;
  right_clearance: number;
  recommended_direction: "left" | "center" | "right" | "none";
  voice_guidance: string;
  cautious_advisory: string;
  confidence: number;
}

export interface NavigationResponse {
  timestamp: number;
  detections: DetectedObject[];
  path_analysis: PathAnalysis;
  primary_warning: string | null;
  voice_announcements: {
    en: string;
    kn: string;
    hi: string;
  };
  alert_priority: AlertPriority;
  repeat_warning: string | null;
  fps: number;
  processing_time_ms: number;
  models_ready: boolean;
}

export interface DetectionEvent {
  id: string;
  timestamp: number;
  time_str: string;
  name: string;
  direction: ObstacleDirection;
  risk_level: RiskLevel;
  distance_display: string;
  confidence: number;
}

export interface AppSettings {
  language: Language;
  voiceEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  cameraResolution: "480p" | "720p" | "1080p";
  selectedCameraId: string;
  facingMode: "environment" | "user";
  calibratedMode: boolean;
  cameraHeightM: number;
  hapticEnabled: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyCustomMessage: string;
  detectionSensitivity: number;
}

export type NavigationPage =
  | "home"
  | "dashboard"
  | "live"
  | "history"
  | "settings"
  | "emergency"
  | "about";
