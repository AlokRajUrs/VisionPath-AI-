import React, { useEffect, useRef } from "react";
import { DetectedObject, PathAnalysis } from "../types";
import { CameraDevice } from "../hooks/useCamera";
import { 
  Camera, 
  FlipHorizontal, 
  Play, 
  Square, 
  Pause, 
  RefreshCw, 
  AlertCircle,
  Wifi,
  Cpu
} from "lucide-react";

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  isPaused: boolean;
  facingMode: "environment" | "user";
  devices: CameraDevice[];
  selectedDeviceId: string;
  detections: DetectedObject[];
  pathAnalysis: PathAnalysis | null;
  fps: number;
  latencyMs: number;
  modelsReady: boolean;
  isWebSocketConnected: boolean;
  onStartScanning: () => void;
  onStopScanning: () => void;
  onTogglePause: () => void;
  onToggleFacing: () => void;
  onSelectDevice: (deviceId: string) => void;
  error: string | null;
  permissionDenied: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  isActive,
  isPaused,
  facingMode,
  devices,
  selectedDeviceId,
  detections,
  pathAnalysis,
  fps,
  latencyMs,
  modelsReady,
  isWebSocketConnected,
  onStartScanning,
  onStopScanning,
  onTogglePause,
  onToggleFacing,
  onSelectDevice,
  error,
  permissionDenied,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render visual bounding boxes, zone dividers, and walkable area corridor on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      if (isActive && !isPaused) {
        // 1. Draw 3-Zone Vertical Dividers (Left | Center | Right)
        ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);

        const x1 = w * 0.333;
        const x2 = w * 0.667;

        ctx.beginPath();
        ctx.moveTo(x1, 0);
        ctx.lineTo(x1, h);
        ctx.moveTo(x2, 0);
        ctx.lineTo(x2, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Zone labels at top
        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText("LEFT ZONE", 12, 22);
        ctx.fillText("CENTER WALKING PATH", x1 + 10, 22);
        ctx.fillText("RIGHT ZONE", x2 + 10, 22);

        // 2. Draw Walkable Area Traversal Corridor (Trapezoid on ground)
        if (pathAnalysis) {
          ctx.beginPath();
          ctx.moveTo(w * 0.25, h * 0.45);
          ctx.lineTo(w * 0.75, h * 0.45);
          ctx.lineTo(w * 0.95, h);
          ctx.lineTo(w * 0.05, h);
          ctx.closePath();

          let corridorColor = "rgba(6, 182, 212, 0.12)"; // clear
          let strokeColor = "rgba(6, 182, 212, 0.5)";
          if (pathAnalysis.center_status === "blocked") {
            corridorColor = "rgba(239, 68, 68, 0.22)"; // blocked
            strokeColor = "rgba(239, 68, 68, 0.8)";
          } else if (pathAnalysis.center_status === "caution") {
            corridorColor = "rgba(245, 158, 11, 0.18)"; // caution
            strokeColor = "rgba(245, 158, 11, 0.7)";
          }

          ctx.fillStyle = corridorColor;
          ctx.fill();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // 3. Draw Detected Objects and Bounding Boxes
        detections.forEach((obj) => {
          const [bx1, by1, bx2, by2] = obj.box;
          const px = bx1 * w;
          const py = by1 * h;
          const pw = (bx2 - bx1) * w;
          const ph = (by2 - by1) * h;

          let color = "#10B981"; // Low risk
          let bgColor = "rgba(16, 185, 129, 0.85)";
          if (obj.risk_level === "high") {
            color = "#EF4444";
            bgColor = "rgba(239, 68, 68, 0.9)";
          } else if (obj.risk_level === "medium") {
            color = "#F59E0B";
            bgColor = "rgba(245, 158, 11, 0.9)";
          }

          // Box border
          ctx.strokeStyle = color;
          ctx.lineWidth = obj.risk_level === "high" ? 3 : 2;
          ctx.strokeRect(px, py, pw, ph);

          // Corner accents for futuristic look
          const len = Math.min(14, pw / 3, ph / 3);
          ctx.fillStyle = color;
          ctx.fillRect(px, py, len, 3);
          ctx.fillRect(px, py, 3, len);
          ctx.fillRect(px + pw - len, py, len, 3);
          ctx.fillRect(px + pw - 3, py, 3, len);
          ctx.fillRect(px, py + ph - 3, len, 3);
          ctx.fillRect(px, py + ph - len, 3, len);
          ctx.fillRect(px + pw - len, py + ph - 3, len, 3);
          ctx.fillRect(px + pw - 3, py + ph - len, 3, len);

          // Tag Label
          const label = `${obj.name.toUpperCase()} (${Math.round(obj.confidence * 100)}%) - ${obj.direction.toUpperCase()}`;
          const subLabel = `${obj.distance_display}`;
          ctx.font = "bold 11px sans-serif";
          const textW = Math.max(ctx.measureText(label).width, ctx.measureText(subLabel).width) + 12;

          ctx.fillStyle = bgColor;
          ctx.fillRect(px, Math.max(0, py - 32), textW, 30);

          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(label, px + 6, Math.max(12, py - 18));
          ctx.font = "10px sans-serif";
          ctx.fillText(subLabel, px + 6, Math.max(24, py - 6));
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isActive, isPaused, detections, pathAnalysis, videoRef]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-navy-950 border-2 border-navy-700/80 shadow-2xl flex flex-col">
      
      {/* Video Preview and Overlay Container */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        
        {/* Raw HTML5 Video Element */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />

        {/* Real-time Augmented Visual Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Inactive State Placeholder */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-950/90 text-center p-6 z-20">
            <div className="w-16 h-16 rounded-full bg-navy-800 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Camera Offline</h3>
            <p className="text-sm text-slate-400 max-w-md mb-6">
              Connect your smartphone rear camera or webcam to start real-time AI obstacle detection and safe-path guidance.
            </p>
            <button
              onClick={onStartScanning}
              className="flex items-center space-x-2 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-extrabold rounded-xl text-base shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START SCANNING</span>
            </button>
          </div>
        )}

        {/* Permission Denied Notice */}
        {permissionDenied && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 text-center p-6 z-30">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Camera Permission Required</h3>
            <p className="text-xs text-red-200 max-w-sm mb-4">
              Please click the camera lock icon in your browser URL bar and allow camera access.
            </p>
            <button
              onClick={onStartScanning}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Live System Telemetry Badges (Top Left & Right) */}
        {isActive && (
          <>
            <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-navy-900/85 backdrop-blur border border-cyan-500/40 text-cyan-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>SCANNING</span>
              </span>

              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-navy-900/85 backdrop-blur border border-navy-700 text-slate-300 text-xs font-mono">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>{fps} FPS</span>
              </span>

              <span className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-navy-900/85 backdrop-blur border border-navy-700 text-slate-300 text-xs font-mono">
                <span>{latencyMs}ms</span>
              </span>
            </div>

            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg backdrop-blur text-xs font-bold ${
                isWebSocketConnected 
                  ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-400" 
                  : "bg-amber-950/80 border border-amber-500/40 text-amber-400"
              }`}>
                <Wifi className="w-3.5 h-3.5" />
                <span>{isWebSocketConnected ? "LIVE WS" : "REST SYNC"}</span>
              </span>
            </div>
          </>
        )}

        {/* Paused Overlay */}
        {isActive && isPaused && (
          <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="text-center">
              <Pause className="w-12 h-12 text-amber-400 mx-auto mb-2 animate-pulse" />
              <div className="text-lg font-bold text-white">Scanning Paused</div>
              <p className="text-xs text-slate-300">Tap Resume to continue navigation</p>
            </div>
          </div>
        )}
      </div>

      {/* Camera Control Bar */}
      <div className="bg-navy-900 p-3 sm:p-4 border-t border-navy-800 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Device Selection & Switch Camera */}
        <div className="flex items-center space-x-2">
          {devices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => onSelectDevice(e.target.value)}
              className="bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2 font-medium focus:border-cyan-500 focus:outline-none"
              aria-label="Select Camera Hardware"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onToggleFacing}
            disabled={!isActive}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 border border-navy-700 text-xs font-semibold disabled:opacity-50 transition-all"
            title="Switch Between Rear & Front Camera"
            aria-label="Switch Between Rear and Front Camera"
          >
            <FlipHorizontal className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">
              {facingMode === "environment" ? "Rear (Environment)" : "Front (User)"}
            </span>
          </button>
        </div>

        {/* Right: Main Navigation Action Buttons */}
        <div className="flex items-center space-x-2">
          {isActive ? (
            <>
              <button
                onClick={onTogglePause}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
                aria-label={isPaused ? "Resume Scanning" : "Pause Scanning"}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                <span>{isPaused ? "RESUME" : "PAUSE"}</span>
              </button>

              <button
                onClick={onStopScanning}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold border border-red-500/50 shadow-md shadow-red-950 transition-all active:scale-95"
                aria-label="Stop Navigation and Camera Scanning"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>STOP NAVIGATION</span>
              </button>
            </>
          ) : (
            <button
              onClick={onStartScanning}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 text-sm font-black shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
              aria-label="Start Real-time Navigation"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START NAVIGATION</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message Display */}
      {error && !permissionDenied && (
        <div className="bg-red-900/60 border-t border-red-700/80 px-4 py-2.5 text-xs text-red-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
