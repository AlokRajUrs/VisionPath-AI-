import time
from typing import Dict, Optional, Tuple
from models.schemas import DetectedObject, PathAnalysis, AlertPriority

# Multilingual Vocabulary & Phrases
TRANSLATIONS = {
    # System Lifecycle
    "nav_started": {
        "en": "Welcome to VisionPath AI. Navigation started.",
        "kn": "ವಿಷನ್ ಪಾತ್ ಎಐ ಗೆ ಸುಸ್ವಾಗತ. ನ್ಯಾವಿಗೇಷನ್ ಪ್ರಾರಂಭವಾಗಿದೆ.",
        "hi": "विजनपाथ एआई में आपका स्वागत है। नेविगेशन शुरू हो गया है।"
    },
    "nav_stopped": {
        "en": "Navigation stopped.",
        "kn": "ನ್ಯಾವಿಗೇಷನ್ ನಿಲ್ಲಿಸಲಾಗಿದೆ.",
        "hi": "नेविगेशन रोक दिया गया है।"
    },
    "camera_disconnected": {
        "en": "Camera disconnected. Navigation stopped.",
        "kn": "ಕ್ಯಾಮೆರಾ ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ. ನ್ಯಾವಿಗೇಷನ್ ನಿಲ್ಲಿಸಲಾಗಿದೆ.",
        "hi": "कैमरा डिस्कनेक्ट हो गया है। नेविगेशन बंद।"
    },
    "scanning_paused": {
        "en": "Scanning paused.",
        "kn": "ಸ್ಕ್ಯಾನಿಂಗ್ ಅನ್ನು ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ.",
        "hi": "स्कैनिंग रोक दी गई है।"
    },
    "scanning_resumed": {
        "en": "Scanning resumed.",
        "kn": "ಸ್ಕ್ಯಾನಿಂಗ್ ಪುನರಾರಂಭಿಸಲಾಗಿದೆ.",
        "hi": "स्कैनिंग फिर से शुरू हुई।"
    },

    # Critical & Priority Alerts
    "stop_very_close": {
        "en": "Stop! Object very close.",
        "kn": "ನಿಲ್ಲಿಸಿ! ವಸ್ತು ತುಂಬಾ ಹತ್ತಿರದಲ್ಲಿದೆ.",
        "hi": "रुकिए! वस्तु बहुत पास है।"
    },
    "warning_obstacle_ahead": {
        "en": "Warning! Obstacle detected ahead.",
        "kn": "ಎಚ್ಚರಿಕೆ! ಮುಂದೆ ಅಡ್ಡಿ ಇದೆ.",
        "hi": "सावधान! आगे बाधा है।"
    },
    "stairs_ahead": {
        "en": "Stairs detected ahead. Please stop.",
        "kn": "ಮುಂದೆ ಮೆಟ್ಟಿಲುಗಳು ಕಂಡುಬಂದಿವೆ. ದಯವಿಟ್ಟು ನಿಲ್ಲಿ.",
        "hi": "आगे सीढ़ियां हैं। कृपया रुकें।"
    },
    "cable_detected": {
        "en": "Cable detected on the walking surface.",
        "kn": "ನಡೆಯುವ ಜಾಗದಲ್ಲಿ ಕೇಬಲ್ ಕಂಡುಬಂದಿದೆ.",
        "hi": "चलने की जगह पर तार या केबल है।"
    },
    "vehicle_nearby": {
        "en": "Vehicle detected nearby. Stay alert.",
        "kn": "ಹತ್ತಿರದಲ್ಲಿ ವಾಹನ ಕಂಡುಬಂದಿದೆ. ಎಚ್ಚರದಿಂದಿರಿ.",
        "hi": "पास में वाहन है। सतर्क रहें।"
    },
    "person_ahead": {
        "en": "Person approaching from the front.",
        "kn": "ಮುಂದಿನಿಂದ ವ್ಯಕ್ತಿಯೊಬ್ಬರು ಬರುತ್ತಿದ್ದಾರೆ.",
        "hi": "सामने से कोई व्यक्ति आ रहा है।"
    },

    # Path & Walkable Area Analysis
    "center_obstructed": {
        "en": "Center walking area appears obstructed.",
        "kn": "ಮಧ್ಯದ ಮಾರ್ಗದಲ್ಲಿ ಅಡಚಣೆ ಕಂಡುಬಂದಿದೆ.",
        "hi": "सामने का मुख्य रास्ता बाधित है।"
    },
    "left_less_obstructed": {
        "en": "Obstacle ahead. Left side appears less obstructed. Please check before moving.",
        "kn": "ಮುಂದೆ ಅಡ್ಡಿ ಇದೆ. ಎಡಭಾಗದಲ್ಲಿ ಕಡಿಮೆ ಅಡಚಣೆ ಇದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಮುಂದುವರಿಯಿರಿ.",
        "hi": "आगे बाधा है। बायां रास्ता खुला लग रहा है। कृपया जांच कर आगे बढ़ें।"
    },
    "right_less_obstructed": {
        "en": "Obstacle ahead. Right side appears less obstructed. Please check before moving.",
        "kn": "ಮುಂದೆ ಅಡ್ಡಿ ಇದೆ. ಬಲಭಾಗದಲ್ಲಿ ಕಡಿಮೆ ಅಡಚಣೆ ಇದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಮುಂದುವರಿಯಿರಿ.",
        "hi": "आगे बाधा है। दायां रास्ता खुला लग रहा है। कृपया जांच कर आगे बढ़ें।"
    },
    "path_unclear_stop": {
        "en": "Warning! Unable to identify a clear path. Please stop.",
        "kn": "ಎಚ್ಚರಿಕೆ! ಸ್ಪಷ್ಟವಾದ ಮಾರ್ಗ ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಲ್ಲಿ.",
        "hi": "सावधान! कोई साफ रास्ता नहीं दिख रहा है। कृपया रुकें।"
    },
    "path_clear_center": {
        "en": "Center path is clear ahead.",
        "kn": "ಮುಂದಿನ ಮಾರ್ಗ ಸ್ಪಷ್ಟವಾಗಿದೆ.",
        "hi": "आगे का रास्ता साफ है।"
    },

    # Directions
    "direction_left": {
        "en": "left",
        "kn": "ಎಡಭಾಗ",
        "hi": "बाएं"
    },
    "direction_center": {
        "en": "center",
        "kn": "ಮಧ್ಯ",
        "hi": "सामने"
    },
    "direction_right": {
        "en": "right",
        "kn": "ಬಲಭಾಗ",
        "hi": "दाएं"
    },

    # Object names translation
    "objects": {
        "person": {"en": "Person", "kn": "ವ್ಯಕ್ತಿ", "hi": "व्यक्ति"},
        "car": {"en": "Car", "kn": "ಕಾರು", "hi": "कार"},
        "motorcycle": {"en": "Motorcycle", "kn": "ಬೈಕ್", "hi": "मोटरसाइकिल"},
        "bicycle": {"en": "Bicycle", "kn": "ಸೈಕಲ್", "hi": "साइकिल"},
        "bus": {"en": "Bus", "kn": "ಬಸ್", "hi": "बस"},
        "truck": {"en": "Truck", "kn": "ಟ್ರಕ್", "hi": "ट्रक"},
        "chair": {"en": "Chair", "kn": "ಕುರ್ಚಿ", "hi": "कुर्सी"},
        "dining table": {"en": "Table", "kn": "ಮೇಜು", "hi": "मेज"},
        "bench": {"en": "Bench", "kn": "ಬೆಂಚ್", "hi": "बेंच"},
        "dog": {"en": "Dog", "kn": "ನಾಯಿ", "hi": "कुत्ता"},
        "stairs": {"en": "Stairs", "kn": "ಮೆಟ್ಟಿಲು", "hi": "सीढ़ियां"},
        "cable": {"en": "Cable", "kn": "ಕೇಬಲ್", "hi": "तार"},
        "small stone": {"en": "Small stone", "kn": "ಸಣ್ಣ ಕಲ್ಲು", "hi": "छोटा पत्थर"},
        "brick": {"en": "Brick", "kn": "ಇಟ್ಟಿಗೆ", "hi": "ईंट"},
        "pothole": {"en": "Pothole", "kn": "ಗುಂಡಿ", "hi": "गड्ढा"},
        "low obstacle": {"en": "Low obstacle", "kn": "ಕೆಳಗಿನ ಅಡ್ಡಿ", "hi": "निचली बाधा"}
    }
}

class AlertManager:
    """
    Coordinates speech announcements with prioritization, cooldowns,
    deduplication, and 3-language generation (English, Kannada, Hindi).
    """

    def __init__(self, cooldown_sec: float = 2.4):
        self.cooldown_sec = cooldown_sec
        self.last_alert_time = 0.0
        self.last_alert_key = ""
        self.last_announcement: Dict[str, str] = {
            "en": "Navigation ready.",
            "kn": "ನ್ಯಾವಿಗೇಷನ್ ಸಿದ್ಧವಾಗಿದೆ.",
            "hi": "नेविगेशन तैयार है।"
        }

    def generate_alerts(self, detections: list[DetectedObject], path_analysis: PathAnalysis) -> Tuple[Optional[str], Dict[str, str], AlertPriority]:
        now = time.time()
        elapsed = now - self.last_alert_time

        # Check for Critical High-Risk Hazards first
        critical_obj = None
        for obj in detections:
            if obj.risk_level == "high":
                critical_obj = obj
                break

        # Priority 1: Critical Emergency Stops
        if critical_obj is not None:
            obj_name = critical_obj.name.lower()
            if obj_name == "stairs":
                alert_key = "stairs_ahead"
                priority: AlertPriority = "critical"
            elif obj_name == "cable":
                alert_key = "cable_detected"
                priority = "critical"
            elif obj_name in ["car", "truck", "bus"]:
                alert_key = "vehicle_nearby"
                priority = "critical"
            elif critical_obj.relative_depth >= 0.80 and critical_obj.direction == "center":
                alert_key = "stop_very_close"
                priority = "critical"
            else:
                alert_key = f"high_risk_{obj_name}_{critical_obj.direction}"
                priority = "warning"

            # Allow critical alerts to bypass cooldown if different or if 1.2s passed
            if alert_key != self.last_alert_key or elapsed > 1.2:
                self.last_alert_key = alert_key
                self.last_alert_time = now
                announcements = self._build_announcements(alert_key, critical_obj)
                self.last_announcement = announcements
                return alert_key, announcements, priority

        # Priority 2: Safe-Path Analysis / Blocked Direction
        if path_analysis.center_status == "blocked":
            if path_analysis.recommended_direction == "left":
                alert_key = "left_less_obstructed"
            elif path_analysis.recommended_direction == "right":
                alert_key = "right_less_obstructed"
            else:
                alert_key = "path_unclear_stop"

            if (alert_key != self.last_alert_key or elapsed > self.cooldown_sec) and elapsed > 1.5:
                self.last_alert_key = alert_key
                self.last_alert_time = now
                announcements = TRANSLATIONS.get(alert_key, TRANSLATIONS["path_unclear_stop"])
                self.last_announcement = announcements
                return alert_key, announcements, "warning"

        # Priority 3: Medium-Risk Obstacles (side or ahead)
        medium_obj = next((o for o in detections if o.risk_level == "medium"), None)
        if medium_obj is not None and elapsed > self.cooldown_sec:
            alert_key = f"med_{medium_obj.name}_{medium_obj.direction}"
            self.last_alert_key = alert_key
            self.last_alert_time = now
            announcements = self._build_announcements(alert_key, medium_obj)
            self.last_announcement = announcements
            return alert_key, announcements, "advisory"

        # Priority 4: Clear path periodic confirmation (every 6 seconds if completely clear)
        if not detections and path_analysis.center_status == "clear" and elapsed > 7.0:
            alert_key = "path_clear_center"
            self.last_alert_key = alert_key
            self.last_alert_time = now
            announcements = TRANSLATIONS["path_clear_center"]
            self.last_announcement = announcements
            return alert_key, announcements, "advisory"

        return None, {"en": "", "kn": "", "hi": ""}, "none"

    def _build_announcements(self, alert_key: str, obj: DetectedObject) -> Dict[str, str]:
        # Predefined phrases
        if alert_key in TRANSLATIONS:
            return TRANSLATIONS[alert_key]

        name = obj.name.lower()
        obj_trans = TRANSLATIONS["objects"].get(name, {"en": obj.name, "kn": obj.name, "hi": obj.name})
        dir_trans = TRANSLATIONS.get(f"direction_{obj.direction}", {"en": obj.direction, "kn": obj.direction, "hi": obj.direction})

        if obj.risk_level == "high":
            return {
                "en": f"Warning! {obj_trans['en']} detected very close in {dir_trans['en']}.",
                "kn": f"ಎಚ್ಚರಿಕೆ! {dir_trans['kn']}ದಲ್ಲಿ {obj_trans['kn']} ಅತ್ಯಂತ ಹತ್ತಿರದಲ್ಲಿದೆ.",
                "hi": f"सावधान! {dir_trans['hi']} में बहुत पास {obj_trans['hi']} है।"
            }
        else:
            return {
                "en": f"{obj_trans['en']} detected on your {dir_trans['en']}.",
                "kn": f"ನಿಮ್ಮ {dir_trans['kn']}ದಲ್ಲಿ {obj_trans['kn']} ಕಂಡುಬಂದಿದೆ.",
                "hi": f"आपके {dir_trans['hi']} में {obj_trans['hi']} है।"
            }

    def get_last_warning(self) -> Dict[str, str]:
        return self.last_announcement
