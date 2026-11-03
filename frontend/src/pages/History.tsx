import React, { useState, useEffect } from "react";
import { DetectionEvent, RiskLevel } from "../types";
import { fetchDetectionHistory, clearDetectionHistory } from "../services/api";
import { 
  Clock, 
  Trash2, 
  Filter, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  ArrowUp,
  ArrowRight
} from "lucide-react";

export const History: React.FC = () => {
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);

  const loadHistory = async () => {
    setLoading(true);
    const data = await fetchDetectionHistory(filter);
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear your local detection history?")) {
      await clearDetectionHistory();
      setEvents([]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-cyan-400" />
            Detection Event History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Local session audit log of detected obstacles, directions, and risk assessments
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadHistory}
            className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 border border-navy-700 text-xs font-bold transition-all"
            title="Refresh History"
            aria-label="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          <button
            onClick={handleClear}
            disabled={events.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800 text-xs font-bold disabled:opacity-40 transition-all"
            aria-label="Clear All History"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          Filter:
        </span>
        {[
          { key: "all", label: "All Events" },
          { key: "high", label: "High Risk Only" },
          { key: "medium", label: "Medium Risk" },
          { key: "low", label: "Low Risk" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === f.key
                ? "bg-cyan-500 text-navy-950 shadow"
                : "bg-navy-850 text-slate-400 hover:text-white border border-navy-750"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="bg-navy-900 rounded-2xl border border-navy-800 p-12 text-center text-slate-400">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Detection Events Recorded</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Start a navigation session on the Dashboard or Live Assist page to record obstacle encounters in this session.
            </p>
          </div>
        ) : (
          events.map((e) => {
            const isHigh = e.risk_level === "high";
            const isMed = e.risk_level === "medium";

            return (
              <div
                key={e.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isHigh
                    ? "bg-red-950/30 border-red-500/50"
                    : isMed
                    ? "bg-amber-950/20 border-amber-500/40"
                    : "bg-navy-900 border-navy-800"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${
                    isHigh
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : isMed
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {isHigh ? (
                      <AlertOctagon className="w-5 h-5" />
                    ) : isMed ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white text-base capitalize">
                        {e.name}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {Math.round(e.confidence * 100)}% conf
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1">
                      <span className="flex items-center space-x-1">
                        {e.direction === "left" && <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />}
                        {e.direction === "center" && <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />}
                        {e.direction === "right" && <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />}
                        <span className="capitalize">{e.direction} zone</span>
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono text-[11px] text-slate-400">{e.distance_display}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 sm:text-right w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-navy-800">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                    isHigh
                      ? "bg-red-500 text-white"
                      : isMed
                      ? "bg-amber-500 text-navy-950"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    {e.risk_level} RISK
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {e.time_str}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Privacy Guarantee Note */}
      <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800 text-xs text-slate-400 flex items-center space-x-2.5">
        <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        <span>
          <strong>Privacy First:</strong> VisionPath AI does not store, record, or upload camera video or images. Only anonymous text detection timestamps are retained in your browser session.
        </span>
      </div>
    </div>
  );
};
