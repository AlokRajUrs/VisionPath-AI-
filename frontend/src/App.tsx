import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  NavigationPage, 
  Language, 
  DetectedObject, 
  PathAnalysis, 
  NavigationResponse, 
  AppSettings 
} from "./types";
import { useCamera } from "./hooks/useCamera";
import { useVoiceAssistant } from "./hooks/useVoiceAssistant";
import { 
  NavigationWebSocketClient, 
  sendFrameREST, 
  checkBackendHealth, 
  checkModelsStatus 
} from "./services/api";

import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { LiveAssist } from "./pages/LiveAssist";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import { Emergency } from "./pages/Emergency";
import { About } from "./pages/About";

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  voiceEnabled: true,
  speechRate: 1.05,
  speechPitch: 1.0,
  cameraResolution: "480p",
  selectedCameraId: "",
  facingMode: "environment",
  calibratedMode: false,
  cameraHeightM: 1.2,
  hapticEnabled: true,
  emergencyContactName: "Family / Caregiver",
  emergencyContactPhone: "+91 9876543210",
  emergencyCustomMessage: "Urgent: I need assistance with navigation. Please contact me immediately.",
  detectionSensitivity: 0.35,
};

export const App: React.FC = () => {
  // Load settings from localStorage or defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem("visionpath_settings");
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem("visionpath_settings", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const [currentPage, setCurrentPage] = useState<NavigationPage>("home");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Live Vision & Navigation State
  const [detections, setDetections] = useState<DetectedObject[]>([]);
  const [pathAnalysis, setPathAnalysis] = useState<PathAnalysis | null>(null);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<string>("Welcome to VisionPath AI.");
  const [lastWarning, setLastWarning] = useState<string>("");
  const [fps, setFps] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [modelsReady, setModelsReady] = useState<boolean>(true);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  const wsClientRef = useRef<NavigationWebSocketClient | null>(null);
  const isProcessingFrameRef = useRef<boolean>(false);

  // Initialize Camera Hook
  const {
    videoRef,
    isActive: isCameraActive,
    facingMode,
    devices,
    selectedDeviceId,
    error: cameraError,
    permissionDenied,
    resolution,
    setResolution,
    startCamera,
    stopCamera,
    toggleFacingMode,
    switchDevice,
    captureFrame,
    refreshDevices,
  } = useCamera();

  // Voice Assistant Hook
  const voiceAssistant = useVoiceAssistant(settings.language, settings.voiceEnabled, {
    onStartNavigation: () => startNavigation(),
    onStopNavigation: () => stopNavigation(),
    onPauseScanning: () => togglePause(),
    onResumeScanning: () => togglePause(),
    onRepeatWarning: () => repeatWarningAction(),
    onDescribeFront: () => describeFrontScene(),
    onToggleVoice: (v) => updateSettings({ voiceEnabled: v }),
    onChangeLanguage: (l) => updateSettings({ language: l }),
    onCheckCameraStatus: () => {
      voiceAssistant.speak(
        isCameraActive ? "Camera is active and streaming." : "Camera is currently offline."
      );
    },
    onCheckNavStatus: () => {
      voiceAssistant.speak(
        isScanning
          ? `Navigation running. ${detections.length} objects detected.`
          : "Navigation is stopped."
      );
    },
  });

  // Sync settings with hooks
  useEffect(() => {
    voiceAssistant.setLanguage(settings.language);
  }, [settings.language]);

  useEffect(() => {
    voiceAssistant.setVoiceEnabled(settings.voiceEnabled);
  }, [settings.voiceEnabled]);

  useEffect(() => {
    voiceAssistant.setSpeechRate(settings.speechRate);
  }, [settings.speechRate]);

  useEffect(() => {
    if (settings.cameraResolution !== resolution) {
      setResolution(settings.cameraResolution);
    }
  }, [settings.cameraResolution, resolution, setResolution]);

  // Handle incoming AI navigation response
  const handleNavigationResponse = useCallback((data: NavigationResponse) => {
    isProcessingFrameRef.current = false;
    setDetections(data.detections || []);
    setPathAnalysis(data.path_analysis || null);
    setFps(data.fps || 0);
    setLatencyMs(data.processing_time_ms || 0);
    setModelsReady(data.models_ready);

    if (data.repeat_warning) {
      setLastWarning(data.repeat_warning);
    }

    // Determine localized voice alert to announce
    const lang = settings.language;
    const spokenText = data.voice_announcements?.[lang] || data.voice_announcements?.en || "";

    if (spokenText && spokenText.trim() !== "") {
      setCurrentAnnouncement(spokenText);
      voiceAssistant.speak(spokenText, data.alert_priority, lang);

      // Trigger mobile haptic vibration on critical/warning hazards
      if (settings.hapticEnabled && (data.alert_priority === "critical" || data.alert_priority === "warning")) {
        voiceAssistant.triggerHaptic(
          data.alert_priority === "critical" ? [200, 80, 200] : [120, 50, 120]
        );
      }
    }
  }, [settings.language, settings.hapticEnabled, voiceAssistant]);

  // Initialize WebSocket Client
  useEffect(() => {
    const client = new NavigationWebSocketClient(
      (data) => handleNavigationResponse(data),
      (connected) => setIsWsConnected(connected)
    );
    client.connect();
    wsClientRef.current = client;

    return () => {
      client.disconnect();
      wsClientRef.current = null;
    };
  }, [handleNavigationResponse]);

  // Continuous Camera Frame Streaming Loop
  useEffect(() => {
    let animId: any;
    let lastSendTime = 0;
    const TARGET_INTERVAL_MS = 140; // ~7 frames per second (optimal balance for mobile network & CPU)

    const streamLoop = async () => {
      if (isScanning && !isPaused && isCameraActive) {
        const now = Date.now();
        if (now - lastSendTime >= TARGET_INTERVAL_MS && !isProcessingFrameRef.current) {
          const frameBase64 = captureFrame(0.72);
          if (frameBase64) {
            lastSendTime = now;
            isProcessingFrameRef.current = true;

            const client = wsClientRef.current;
            const sentViaWs = client?.sendFrame(frameBase64, {
              calibrated_mode: settings.calibratedMode,
              camera_height_m: settings.cameraHeightM,
            });

            // If WebSocket is not connected, use fallback REST endpoint
            if (!sentViaWs) {
              sendFrameREST(
                frameBase64,
                settings.calibratedMode,
                settings.cameraHeightM,
                settings.language
              ).then((res) => {
                if (res) {
                  handleNavigationResponse(res);
                } else {
                  isProcessingFrameRef.current = false;
                }
              }).catch(() => {
                isProcessingFrameRef.current = false;
              });
            }
          }
        }
      }
      animId = requestAnimationFrame(streamLoop);
    };

    animId = requestAnimationFrame(streamLoop);
    return () => cancelAnimationFrame(animId);
  }, [isScanning, isPaused, isCameraActive, captureFrame, settings.calibratedMode, settings.cameraHeightM, settings.language, handleNavigationResponse]);

  // Start Navigation Action
  const startNavigation = async () => {
    setIsScanning(true);
    setIsPaused(false);
    await startCamera(settings.selectedCameraId, settings.facingMode);

    const welcomeMsg = settings.language === "kn"
      ? "ವಿಷನ್ ಪಾತ್ ಎಐ ಗೆ ಸುಸ್ವಾಗತ. ನ್ಯಾವಿಗೇಷನ್ ಪ್ರಾರಂಭವಾಗಿದೆ."
      : settings.language === "hi"
      ? "विजनपाथ एआई में आपका स्वागत है। नेविगेशन शुरू हो गया है।"
      : "Welcome to VisionPath AI. Navigation started.";

    setCurrentAnnouncement(welcomeMsg);
    voiceAssistant.speak(welcomeMsg, "critical");
    voiceAssistant.triggerHaptic([100, 50, 100]);
  };

  // Stop Navigation Action
  const stopNavigation = () => {
    setIsScanning(false);
    setIsPaused(false);
    stopCamera();
    setDetections([]);
    setPathAnalysis(null);

    const stopMsg = settings.language === "kn"
      ? "ನ್ಯಾವಿಗೇಷನ್ ನಿಲ್ಲಿಸಲಾಗಿದೆ."
      : settings.language === "hi"
      ? "नेविगेशन रोक दिया गया है।"
      : "Navigation stopped.";

    setCurrentAnnouncement(stopMsg);
    voiceAssistant.speak(stopMsg, "warning");
  };

  // Pause / Resume Action
  const togglePause = () => {
    if (!isScanning) return;
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);

    if (nextPaused) {
      wsClientRef.current?.sendPause();
      voiceAssistant.speak(
        settings.language === "kn" ? "ಸ್ಕ್ಯಾನಿಂಗ್ ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ." : settings.language === "hi" ? "स्कैनिंग रोक दी गई है।" : "Scanning paused.",
        "warning"
      );
    } else {
      wsClientRef.current?.sendResume();
      voiceAssistant.speak(
        settings.language === "kn" ? "ಸ್ಕ್ಯಾನಿಂಗ್ ಪುನರಾರಂಭಿಸಲಾಗಿದೆ." : settings.language === "hi" ? "स्कैनिंग फिर से शुरू हुई।" : "Scanning resumed.",
        "warning"
      );
    }
  };

  // Repeat Last Warning Action
  const repeatWarningAction = () => {
    if (lastWarning) {
      voiceAssistant.speak(lastWarning, "critical");
    } else {
      voiceAssistant.repeatLastWarning();
    }
  };

  // Voice Command: "Tell me what is in front of me"
  const describeFrontScene = () => {
    if (!isScanning) {
      voiceAssistant.speak("Navigation is not active. Please start navigation first.");
      return;
    }
    const centerObstacles = detections.filter((d) => d.direction === "center");
    if (centerObstacles.length === 0) {
      voiceAssistant.speak("Center walking path appears clear ahead.");
    } else {
      const topObj = centerObstacles[0];
      voiceAssistant.speak(`Directly ahead: ${topObj.name}, risk level ${topObj.risk_level}. ${pathAnalysis?.cautious_advisory || ""}`, "critical");
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Top Header / Navigation Bar */}
      {currentPage !== "live" && (
        <Navbar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          language={settings.language}
          onLanguageChange={(lang) => updateSettings({ language: lang })}
          voiceEnabled={settings.voiceEnabled}
          onToggleVoice={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
          isScanning={isScanning}
        />
      )}

      {/* Main Page Content Router */}
      <main className="flex-1">
        {currentPage === "home" && (
          <Home
            onNavigate={(page) => setCurrentPage(page)}
            onStartScanning={startNavigation}
          />
        )}

        {currentPage === "dashboard" && (
          <Dashboard
            videoRef={videoRef}
            isScanning={isScanning}
            isPaused={isPaused}
            facingMode={facingMode}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            detections={detections}
            pathAnalysis={pathAnalysis}
            currentAnnouncement={currentAnnouncement}
            lastWarning={lastWarning}
            language={settings.language}
            onLanguageChange={(lang) => updateSettings({ language: lang })}
            voiceEnabled={settings.voiceEnabled}
            onToggleVoice={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
            speechRate={settings.speechRate}
            onSpeechRateChange={(rate) => updateSettings({ speechRate: rate })}
            onRepeatWarning={repeatWarningAction}
            fps={fps}
            latencyMs={latencyMs}
            modelsReady={modelsReady}
            isWebSocketConnected={isWsConnected}
            onStartScanning={startNavigation}
            onStopScanning={stopNavigation}
            onTogglePause={togglePause}
            onToggleFacing={toggleFacingMode}
            onSelectDevice={switchDevice}
            isListening={voiceAssistant.isListening}
            recognizedCommand={voiceAssistant.recognizedCommand}
            recognitionSupported={voiceAssistant.recognitionSupported}
            onToggleListening={
              voiceAssistant.isListening
                ? voiceAssistant.stopListening
                : voiceAssistant.startListening
            }
            isSpeaking={voiceAssistant.isSpeaking}
            onNavigate={(page) => setCurrentPage(page)}
            error={cameraError}
            permissionDenied={permissionDenied}
          />
        )}

        {currentPage === "live" && (
          <LiveAssist
            videoRef={videoRef}
            isScanning={isScanning}
            onStartScanning={startNavigation}
            onStopScanning={stopNavigation}
            currentAnnouncement={currentAnnouncement}
            onRepeatWarning={repeatWarningAction}
            onToggleFacing={toggleFacingMode}
            facingMode={facingMode}
            language={settings.language}
            voiceEnabled={settings.voiceEnabled}
            onToggleVoice={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
            onNavigateBack={() => setCurrentPage("dashboard")}
            onTriggerEmergency={() => setCurrentPage("emergency")}
            detections={detections}
            pathAnalysis={pathAnalysis}
            isSpeaking={voiceAssistant.isSpeaking}
          />
        )}

        {currentPage === "history" && <History />}

        {currentPage === "settings" && (
          <Settings
            settings={settings}
            onUpdateSettings={updateSettings}
            devices={devices}
            onRefreshDevices={refreshDevices}
          />
        )}

        {currentPage === "emergency" && (
          <Emergency
            settings={settings}
            speak={(text, p) => voiceAssistant.speak(text, p)}
          />
        )}

        {currentPage === "about" && <About />}
      </main>

      {/* Accessible Footer */}
      {currentPage !== "live" && (
        <footer className="bg-navy-950 border-t border-navy-800/80 px-4 py-6 mt-12 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white tracking-wider">VISIONPATH AI</span>
              <span>&bull;</span>
              <span className="text-cyan-400 font-medium">"See the Path Through AI"</span>
            </div>
            <div>
              Accessible AI Smart Navigation Prototype &bull; Designed for Visually Impaired Mobility
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
