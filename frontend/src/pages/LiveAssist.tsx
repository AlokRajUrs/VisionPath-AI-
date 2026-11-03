import React from "react";
import { DetectedObject, PathAnalysis, Language } from "../types";
import { 
  ArrowLeft, 
  Play, 
  Square, 
  RotateCcw, 
  FlipHorizontal, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  ShieldAlert,
  Radio
} from "lucide-react";

interface LiveAssistProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isScanning: boolean;
  onStartScanning: () => void;
  onStopScanning: () => void;
  currentAnnouncement: string;
  onRepeatWarning: () => void;
  onToggleFacing: () => void;
  facingMode: "environment" | "user";
  language: Language;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onNavigateBack: () => void;
  onTriggerEmergency: () => void;
  detections: DetectedObject[];
  pathAnalysis: PathAnalysis | null;
  isSpeaking: boolean;
}

export const LiveAssist: React.FC<LiveAssistProps> = ({
  videoRef,
  isScanning,
  onStartScanning,
  onStopScanning,
  currentAnnouncement,
  onRepeatWarning,
  onToggleFacing,
  facingMode,
  language,
  voiceEnabled,
  onToggleVoice,
  onNavigateBack,
  onTriggerEmergency,
  detections,
  pathAnalysis,
  isSpeaking,
}) => {
  const highRiskCount = detections.filter((d) => d.risk_level === "high").length;
  const recommendedDir = pathAnalysis?.recommended_direction || "center";

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none">
      
      {/* Top Floating Control Bar */}
      <div className="p-3 bg-gradient-to-b from-navy-950/95 via-navy-950/70 to-transparent flex items-center justify-between z-30">
        
        {/* Back to Dashboard Button */}
        <button
          onClick={onNavigateBack}
          className="flex items-center space-x-2 px-3.5 py-2.5 bg-navy-900/90 text-white rounded-xl border border-navy-700 font-bold text-xs shadow-lg active:scale-95"
          aria-label="Return to Navigation Dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-cyan-400" />
          <span>Dashboard</span>
        </button>

        {/* Status Indicators */}
        <div className="flex items-center space-x-2">
          {highRiskCount > 0 && (
            <span className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-red-600 text-white font-black text-xs animate-bounce shadow-lg">
              <ShieldAlert className="w-4 h-4" />
              <span>{highRiskCount} HAZARD</span>
            </span>
          )}

          {isSpeaking && (
            <span className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 text-xs font-bold">
              <Radio className="w-4 h-4 animate-spin" />
              <span>SPEAKING</span>
            </span>
          )}
        </div>

        {/* Quick Voice & Camera Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleFacing}
            className="p-3 rounded-xl bg-navy-900/90 text-cyan-400 border border-navy-700 active:scale-95"
            title="Switch Rear/Front Camera"
            aria-label="Switch Camera"
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleVoice}
            className={`p-3 rounded-xl border active:scale-95 ${
              voiceEnabled
                ? "bg-navy-900/90 text-cyan-400 border-cyan-500/50"
                : "bg-navy-900/90 text-slate-500 border-navy-700"
            }`}
            aria-label={voiceEnabled ? "Mute Voice" : "Enable Voice"}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Center Camera View with 3-Zone Dividing Markers */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />

        {/* Overlay Zone Guides */}
        <div className="absolute inset-0 grid grid-cols-3 pointer-events-none z-10">
          <div className="border-r-2 border-dashed border-cyan-500/40 flex flex-col justify-end p-3">
            <span className="text-xs font-black text-white/60 bg-black/50 px-2 py-0.5 rounded w-max">
              LEFT
            </span>
          </div>
          <div className="border-r-2 border-dashed border-cyan-500/40 bg-cyan-500/5 flex flex-col justify-end p-3">
            <span className="text-xs font-black text-cyan-400 bg-black/70 px-2 py-0.5 rounded w-max mx-auto">
              CENTER PATH
            </span>
          </div>
          <div className="flex flex-col justify-end p-3 text-right">
            <span className="text-xs font-black text-white/60 bg-black/50 px-2 py-0.5 rounded w-max ml-auto">
              RIGHT
            </span>
          </div>
        </div>

        {/* Ground Path Guidance Indicator Pill */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
          <div className={`px-4 py-2 rounded-2xl font-black text-sm tracking-wider uppercase border-2 shadow-2xl flex items-center space-x-2 backdrop-blur-md ${
            recommendedDir === "none"
              ? "bg-red-600/90 border-white text-white animate-pulse"
              : recommendedDir === "left" || recommendedDir === "right"
              ? "bg-amber-500/90 border-white text-navy-950"
              : "bg-emerald-600/90 border-white text-white"
          }`}>
            <span>PATH: {recommendedDir === "none" ? "STOP / OBSTRUCTED" : `${recommendedDir.toUpperCase()} CLEAR`}</span>
          </div>
        </div>

        {/* If Camera is Offline */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-950/90 text-center p-6 z-20">
            <p className="text-lg font-black text-white mb-4">Scanner is currently idle</p>
            <button
              onClick={onStartScanning}
              className="px-8 py-5 bg-cyan-500 text-navy-950 font-black rounded-2xl text-xl shadow-2xl active:scale-95"
            >
              START SCANNING
            </button>
          </div>
        )}
      </div>

      {/* Bottom Floating Assistive Interface (Screen Reader & Tactile Controls) */}
      <div className="p-4 bg-gradient-to-t from-navy-950 via-navy-950/95 to-transparent z-30 space-y-3">
        
        {/* Massive High-Contrast Current Announcement Banner */}
        <div 
          className="p-4 rounded-2xl bg-navy-900/95 border-2 border-cyan-400 text-center shadow-2xl"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="text-[11px] font-black uppercase tracking-widest text-cyan-400 mb-1">
            Voice Instruction
          </div>
          <div className="text-xl sm:text-2xl font-black text-white leading-tight">
            {currentAnnouncement || "Path is clear ahead."}
          </div>
        </div>

        {/* Big Tactile Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          
          {/* Repeat Warning Button */}
          <button
            onClick={onRepeatWarning}
            className="flex flex-col items-center justify-center py-4 px-2 bg-navy-850 hover:bg-navy-800 text-cyan-300 font-black rounded-2xl border-2 border-cyan-500 shadow-xl active:scale-95"
            aria-label="Repeat Last Spoken Warning"
          >
            <RotateCcw className="w-7 h-7 text-cyan-400 mb-1" />
            <span className="text-xs">REPEAT</span>
          </button>

          {/* Start / Stop Toggle */}
          {isScanning ? (
            <button
              onClick={onStopScanning}
              className="flex flex-col items-center justify-center py-4 px-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl border-2 border-red-400 shadow-xl active:scale-95"
              aria-label="Stop Navigation"
            >
              <Square className="w-7 h-7 fill-current mb-1" />
              <span className="text-xs">STOP</span>
            </button>
          ) : (
            <button
              onClick={onStartScanning}
              className="flex flex-col items-center justify-center py-4 px-2 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-black rounded-2xl border-2 border-white shadow-xl active:scale-95"
              aria-label="Start Navigation"
            >
              <Play className="w-7 h-7 fill-current mb-1" />
              <span className="text-xs">START</span>
            </button>
          )}

          {/* Emergency SOS Button */}
          <button
            onClick={onTriggerEmergency}
            className="flex flex-col items-center justify-center py-4 px-2 bg-red-700 hover:bg-red-600 text-white font-black rounded-2xl border-2 border-white shadow-xl active:scale-95"
            aria-label="Emergency Assistance"
          >
            <AlertTriangle className="w-7 h-7 mb-1" />
            <span className="text-xs">SOS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
