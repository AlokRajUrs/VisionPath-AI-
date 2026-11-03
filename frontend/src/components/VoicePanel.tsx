import React from "react";
import { Language } from "../types";
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Mic, 
  MicOff, 
  Headphones, 
  Languages,
  Radio
} from "lucide-react";

interface VoicePanelProps {
  currentAnnouncement: string;
  lastWarning: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  onRepeatWarning: () => void;
  isListening: boolean;
  recognizedCommand: string;
  recognitionSupported: boolean;
  onToggleListening: () => void;
  isSpeaking: boolean;
}

export const VoicePanel: React.FC<VoicePanelProps> = ({
  currentAnnouncement,
  lastWarning,
  language,
  onLanguageChange,
  voiceEnabled,
  onToggleVoice,
  speechRate,
  onSpeechRateChange,
  onRepeatWarning,
  isListening,
  recognizedCommand,
  recognitionSupported,
  onToggleListening,
  isSpeaking,
}) => {
  return (
    <div className="bg-navy-900 rounded-2xl border border-navy-700 p-4 shadow-xl flex flex-col space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-navy-800">
        <div className="flex items-center space-x-2">
          <Headphones className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-wide">Voice Guidance System</h3>
        </div>

        <div className="flex items-center space-x-2">
          {isSpeaking && (
            <span className="flex items-center space-x-1 text-xs font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-full animate-pulse">
              <Radio className="w-3.5 h-3.5 animate-spin" />
              <span>SPEAKING</span>
            </span>
          )}

          <button
            onClick={onToggleVoice}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
              voiceEnabled
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/40"
                : "bg-navy-800 text-slate-500 border-navy-700"
            }`}
            aria-label={voiceEnabled ? "Mute Voice" : "Unmute Voice"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary Voice Announcement Screen-Reader Live Box */}
      <div 
        className="p-4 rounded-xl bg-navy-950 border-2 border-cyan-500/50 min-h-[76px] flex flex-col justify-center"
        aria-live="assertive"
        aria-atomic="true"
      >
        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          Current Spoken Instruction
        </span>
        <p className="text-base font-extrabold text-white leading-snug">
          {currentAnnouncement || "VisionPath AI is monitoring your environment."}
        </p>
      </div>

      {/* Repeat Last Warning Tactile Button */}
      <button
        onClick={onRepeatWarning}
        className="w-full flex items-center justify-center space-x-2.5 py-3.5 px-4 bg-navy-800 hover:bg-navy-750 text-cyan-300 font-extrabold rounded-xl border-2 border-cyan-500/60 shadow-lg shadow-cyan-950/40 transition-all active:scale-[0.98]"
        aria-label="Repeat Last Warning Announcement"
      >
        <RotateCcw className="w-5 h-5 text-cyan-400" />
        <span className="text-sm tracking-wide">REPEAT LAST WARNING</span>
      </button>

      {/* Language Selection & Speech Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        
        {/* Language Selection */}
        <div className="bg-navy-850 p-2.5 rounded-xl border border-navy-750">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-2">
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            Language
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { code: "en" as Language, name: "English" },
              { code: "kn" as Language, name: "ಕನ್ನಡ" },
              { code: "hi" as Language, name: "हिन्दी" },
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => onLanguageChange(l.code)}
                className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                  language === l.code
                    ? "bg-cyan-500 text-navy-950 shadow"
                    : "bg-navy-800 text-slate-300 hover:text-white"
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* Speech Speed */}
        <div className="bg-navy-850 p-2.5 rounded-xl border border-navy-750">
          <span className="text-xs font-bold text-slate-400 mb-2 block">
            Speech Rate: <span className="text-cyan-400">{speechRate}x</span>
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { rate: 0.85, label: "0.85x" },
              { rate: 1.05, label: "Normal" },
              { rate: 1.25, label: "1.25x" },
            ].map((r) => (
              <button
                key={r.rate}
                onClick={() => onSpeechRateChange(r.rate)}
                className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                  speechRate === r.rate
                    ? "bg-cyan-500 text-navy-950 shadow"
                    : "bg-navy-800 text-slate-300 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Command Recognition Control */}
      {recognitionSupported && (
        <div className="bg-navy-850 p-3 rounded-xl border border-navy-750 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onToggleListening}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? "bg-cyan-500 text-navy-950 border-cyan-400 shadow-md shadow-cyan-500/30 animate-pulse"
                  : "bg-navy-800 text-slate-400 border-navy-700 hover:text-white"
              }`}
              aria-label={isListening ? "Stop Voice Command Listening" : "Start Voice Command Listening"}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <div>
              <div className="text-xs font-bold text-white">
                Voice Commands: {isListening ? "Listening..." : "Off"}
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[210px]">
                {recognizedCommand ? `"${recognizedCommand}"` : 'Say "start", "stop", or "repeat"'}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-cyan-400 bg-navy-900 px-2 py-1 rounded border border-navy-750">
            MIC ACTIVE
          </span>
        </div>
      )}
    </div>
  );
};
