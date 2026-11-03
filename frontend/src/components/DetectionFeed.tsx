import React from "react";
import { DetectedObject } from "../types";
import { 
  ArrowLeft, 
  ArrowUp, 
  ArrowRight, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  Activity
} from "lucide-react";

interface DetectionFeedProps {
  detections: DetectedObject[];
  isScanning: boolean;
}

export const DetectionFeed: React.FC<DetectionFeedProps> = ({ detections, isScanning }) => {
  return (
    <div className="bg-navy-900 rounded-2xl border border-navy-700 p-4 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-navy-800 mb-3">
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-wide">Live Detected Obstacles</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-800 text-slate-300 border border-navy-700">
          {detections.length} Detected
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px]">
        {detections.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <Activity className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
            <p className="text-sm font-medium">
              {isScanning ? "Scanning surrounding area... No immediate hazards." : "Start scanning to see live detected obstacles."}
            </p>
          </div>
        ) : (
          detections.map((obj) => {
            const isHigh = obj.risk_level === "high";
            const isMed = obj.risk_level === "medium";

            return (
              <div
                key={obj.id}
                className={`p-3 rounded-xl border transition-all ${
                  isHigh
                    ? "bg-red-950/40 border-red-500/80 shadow-md shadow-red-950/30"
                    : isMed
                    ? "bg-amber-950/30 border-amber-500/60"
                    : "bg-navy-850 border-navy-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-white text-sm capitalize">
                      {obj.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {Math.round(obj.confidence * 100)}%
                    </span>
                  </div>

                  {/* Risk Badge */}
                  <span
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      isHigh
                        ? "bg-red-500 text-white"
                        : isMed
                        ? "bg-amber-500 text-navy-950"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    {isHigh ? (
                      <AlertOctagon className="w-3 h-3" />
                    ) : isMed ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    <span>{obj.risk_level} RISK</span>
                  </span>
                </div>

                {/* Direction and Depth / Distance */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-navy-750">
                  <div className="flex items-center space-x-1 text-slate-300">
                    {obj.direction === "left" && <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />}
                    {obj.direction === "center" && <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />}
                    {obj.direction === "right" && <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />}
                    <span className="capitalize font-medium">Zone: {obj.direction}</span>
                  </div>

                  <div className="text-right text-slate-400 font-mono text-[11px]">
                    {obj.distance_display}
                  </div>
                </div>

                {/* Relative Proximity Bar */}
                <div className="mt-2 w-full bg-navy-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isHigh ? "bg-red-500" : isMed ? "bg-amber-500" : "bg-emerald-400"
                    }`}
                    style={{ width: `${Math.round(obj.relative_depth * 100)}%` }}
                    title={`Relative Depth: ${Math.round(obj.relative_depth * 100)}%`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
