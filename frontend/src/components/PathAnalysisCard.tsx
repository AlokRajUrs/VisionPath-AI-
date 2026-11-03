import React from "react";
import { PathAnalysis } from "../types";
import { 
  Navigation, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowUp, 
  ArrowRight,
  Hand
} from "lucide-react";

interface PathAnalysisCardProps {
  pathAnalysis: PathAnalysis | null;
}

export const PathAnalysisCard: React.FC<PathAnalysisCardProps> = ({ pathAnalysis }) => {
  const getStatusBadge = (status: string, clearance: number) => {
    if (status === "clear") {
      return (
        <span className="flex items-center space-x-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CLEAR ({Math.round(clearance * 100)}%)</span>
        </span>
      );
    } else if (status === "caution") {
      return (
        <span className="flex items-center space-x-1 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-md">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>CAUTION ({Math.round(clearance * 100)}%)</span>
        </span>
      );
    } else {
      return (
        <span className="flex items-center space-x-1 text-xs font-bold text-red-400 bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded-md">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>BLOCKED ({Math.round(clearance * 100)}%)</span>
        </span>
      );
    }
  };

  const recommendedDir = pathAnalysis?.recommended_direction || "center";

  return (
    <div className="bg-navy-900 rounded-2xl border border-navy-700 p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-navy-800 mb-3">
        <div className="flex items-center space-x-2">
          <Navigation className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-wide">Walkable-Area & Safe-Path Analysis</h3>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Confidence: {pathAnalysis ? Math.round(pathAnalysis.confidence * 100) : 0}%
        </span>
      </div>

      {/* 3-Corridor Segment Indicators */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {/* Left Region */}
        <div className="bg-navy-850 p-2.5 rounded-xl border border-navy-750 flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-slate-300 uppercase mb-1">Left Corridor</span>
          {getStatusBadge(pathAnalysis?.left_status || "clear", pathAnalysis?.left_clearance ?? 1.0)}
        </div>

        {/* Center Region */}
        <div className="bg-navy-850 p-2.5 rounded-xl border border-navy-750 flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-slate-300 uppercase mb-1">Center Corridor</span>
          {getStatusBadge(pathAnalysis?.center_status || "clear", pathAnalysis?.center_clearance ?? 1.0)}
        </div>

        {/* Right Region */}
        <div className="bg-navy-850 p-2.5 rounded-xl border border-navy-750 flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-slate-300 uppercase mb-1">Right Corridor</span>
          {getStatusBadge(pathAnalysis?.right_status || "clear", pathAnalysis?.right_clearance ?? 1.0)}
        </div>
      </div>

      {/* Cautious Recommendation Banner */}
      <div className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
        recommendedDir === "none"
          ? "bg-red-950/50 border-red-500/80 text-red-200"
          : recommendedDir === "left" || recommendedDir === "right"
          ? "bg-cyan-950/40 border-cyan-500/60 text-cyan-100"
          : "bg-emerald-950/40 border-emerald-500/60 text-emerald-100"
      }`}>
        <div className="p-2 rounded-lg bg-navy-950/70 text-cyan-400 mt-0.5 flex-shrink-0">
          {recommendedDir === "left" && <ArrowLeft className="w-5 h-5 text-cyan-400" />}
          {recommendedDir === "center" && <ArrowUp className="w-5 h-5 text-emerald-400" />}
          {recommendedDir === "right" && <ArrowRight className="w-5 h-5 text-cyan-400" />}
          {recommendedDir === "none" && <Hand className="w-5 h-5 text-red-400" />}
        </div>

        <div>
          <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-0.5">
            Suggested Direction: <span className="text-white capitalize">{recommendedDir === "none" ? "HALT / STOP" : recommendedDir}</span>
          </div>
          <p className="text-sm font-bold leading-snug">
            {pathAnalysis?.voice_guidance || "Scanning ground path..."}
          </p>
          <p className="text-xs text-slate-400 mt-1 italic">
            {pathAnalysis?.cautious_advisory || "Maintain white cane or guide dog vigilance."}
          </p>
        </div>
      </div>
    </div>
  );
};
