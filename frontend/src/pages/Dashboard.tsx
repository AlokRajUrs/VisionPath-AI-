import React from "react";
import { 
  DetectedObject, 
  PathAnalysis, 
  Language, 
  NavigationPage 
} from "../types";
import { CameraDevice } from "../hooks/useCamera";
import { CameraView } from "../components/CameraView";
import { DetectionFeed } from "../components/DetectionFeed";
import { PathAnalysisCard } from "../components/PathAnalysisCard";
import { VoicePanel } from "../components/VoicePanel";
import { 
  Compass, 
  AlertTriangle, 
  Maximize2, 
  ShieldAlert,
  Activity
} from "lucide-react";

interface DashboardProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isScanning: boolean;
  isPaused: boolean;
  facingMode: "environment" | "user";
  devices: CameraDevice[];
  selectedDeviceId: string;
  detections: DetectedObject[];
  pathAnalysis: PathAnalysis | null;
  currentAnnouncement: string;
  lastWarning: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  onRepeatWarning: () => void;
  fps: number;
  latencyMs: number;
  modelsReady: boolean;
  isWebSocketConnected: boolean;
  onStartScanning: () => void;
  onStopScanning: () => void;
  onTogglePause: () => void;
  onToggleFacing: () => void;
  onSelectDevice: (deviceId: string) => void;
  isListening: boolean;
  recognizedCommand: string;
  recognitionSupported: boolean;
  onToggleListening: () => void;
  isSpeaking: boolean;
  onNavigate: (page: NavigationPage) => void;
  error: string | null;
  permissionDenied: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  videoRef,
  isScanning,
  isPaused,
  facingMode,
  devices,
  selectedDeviceId,
  detections,
  pathAnalysis,
  currentAnnouncement,
  lastWarning,
  language,
  onLanguageChange,
  voiceEnabled,
  onToggleVoice,
  speechRate,
  onSpeechRateChange,
  onRepeatWarning,
  fps,
  latencyMs,
  modelsReady,
  isWebSocketConnected,
  onStartScanning,
  onStopScanning,
  onTogglePause,
  onToggleFacing,
  onSelectDevice,
  isListening,
  recognizedCommand,
  recognitionSupported,
  onToggleListening,
  isSpeaking,
  onNavigate,
  error,
  permissionDenied,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-navy-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-cyan-400" />
            Navigation Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Real-time environment scanning, hazard detection & directional voice assistance
          </p>
        </div>

        {/* Action Shortcut Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate("live")}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-cyan-400 border border-cyan-500/40 text-xs font-bold shadow transition-all"
            aria-label="Open Fullscreen Live Assist View"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Fullscreen Live Assist</span>
          </button>

          <button
            onClick={() => onNavigate("emergency")}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white border border-red-500/60 text-xs font-black shadow-md shadow-red-950 transition-all active:scale-95"
            aria-label="Emergency SOS"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>EMERGENCY SOS</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column (Camera + Path) & Right Column (Detections + Voice) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Camera View & Path Analysis */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Real-time Camera View Component */}
          <CameraView
            videoRef={videoRef}
            isActive={isScanning}
            isPaused={isPaused}
            facingMode={facingMode}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            detections={detections}
            pathAnalysis={pathAnalysis}
            fps={fps}
            latencyMs={latencyMs}
            modelsReady={modelsReady}
            isWebSocketConnected={isWebSocketConnected}
            onStartScanning={onStartScanning}
            onStopScanning={onStopScanning}
            onTogglePause={onTogglePause}
            onToggleFacing={onToggleFacing}
            onSelectDevice={onSelectDevice}
            error={error}
            permissionDenied={permissionDenied}
          />

          {/* Walkable Area & Safe-Path Analysis Component */}
          <PathAnalysisCard pathAnalysis={pathAnalysis} />
        </div>

        {/* Right Column (5 cols): Live Detections & Voice Assistant */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Voice Guidance Control Panel */}
          <VoicePanel
            currentAnnouncement={currentAnnouncement}
            lastWarning={lastWarning}
            language={language}
            onLanguageChange={onLanguageChange}
            voiceEnabled={voiceEnabled}
            onToggleVoice={onToggleVoice}
            speechRate={speechRate}
            onSpeechRateChange={onSpeechRateChange}
            onRepeatWarning={onRepeatWarning}
            isListening={isListening}
            recognizedCommand={recognizedCommand}
            recognitionSupported={recognitionSupported}
            onToggleListening={onToggleListening}
            isSpeaking={isSpeaking}
          />

          {/* Live Detected Obstacles Feed */}
          <DetectionFeed
            detections={detections}
            isScanning={isScanning}
          />
        </div>
      </div>

      {/* Assistive Safety Footer Disclaimer */}
      <div className="p-4 rounded-xl bg-navy-900 border border-navy-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            Assistive prototype. Bounding boxes and relative depth do not replace a white cane or tactile feedback.
          </span>
        </div>
        <button
          onClick={() => onNavigate("about")}
          className="text-cyan-400 hover:underline font-bold text-xs ml-2"
        >
          View Limitations
        </button>
      </div>
    </div>
  );
};
