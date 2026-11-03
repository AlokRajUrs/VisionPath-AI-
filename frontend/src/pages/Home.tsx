import React from "react";
import { NavigationPage } from "../types";
import { 
  Play, 
  HelpCircle, 
  ShieldAlert, 
  Eye, 
  Compass, 
  Volume2, 
  Layers, 
  Smartphone, 
  Cpu, 
  Radio, 
  CheckCircle2,
  Sparkles
} from "lucide-react";

interface HomeProps {
  onNavigate: (page: NavigationPage) => void;
  onStartScanning: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onStartScanning }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 space-y-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-navy-900 to-navy-950 border border-navy-700/80 p-6 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI-Powered Assistive Navigation</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
              VISIONPATH <span className="text-cyan-400">AI</span>
            </h1>

            <p className="text-xl sm:text-2xl font-bold text-cyan-200">
              "Smart Vision. Safer Navigation."
            </p>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
              An intelligent AI navigation assistant that detects obstacles, analyzes surroundings, and provides real-time voice guidance to help blind and visually impaired people navigate with greater confidence and awareness.
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  onNavigate("dashboard");
                  onStartScanning();
                }}
                className="flex items-center space-x-3 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-black rounded-2xl text-lg shadow-xl shadow-cyan-500/25 transition-all duration-200 active:scale-95 border-2 border-cyan-300"
                aria-label="Start Navigation Now"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>START NAVIGATION</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById("how-it-works");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center space-x-2 px-6 py-4 bg-navy-800 hover:bg-navy-750 text-white font-bold rounded-2xl text-base border border-navy-600 transition-all active:scale-95"
              >
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <span>How It Works</span>
              </button>
            </div>

            {/* Quick Bullet Points */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-navy-800/80 text-xs font-semibold text-slate-300">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Rear Camera Default</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>EN / KN / HI Spoken Alerts</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Ground Hazard Detection</span>
              </div>
            </div>
          </div>

          {/* Hero Right Graphic / Assistive Navigation Illustration */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm aspect-[4/5] rounded-3xl bg-navy-950 border-2 border-cyan-500/40 p-4 shadow-2xl flex flex-col justify-between overflow-hidden">
              
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-24 w-full animate-pulse pointer-events-none"></div>

              {/* Simulated Mobile Camera Feed */}
              <div className="relative flex-1 rounded-2xl bg-navy-900 border border-navy-700 p-4 flex flex-col justify-between overflow-hidden">
                
                {/* Zone Dividers */}
                <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
                  <div className="border-r border-dashed border-cyan-500/30"></div>
                  <div className="border-r border-dashed border-cyan-500/30 bg-cyan-500/5"></div>
                  <div></div>
                </div>

                {/* Top Telemetry */}
                <div className="relative z-10 flex justify-between items-center text-[10px] font-mono text-cyan-400">
                  <span className="bg-navy-950/80 px-2 py-0.5 rounded border border-cyan-500/30">VISIONPATH HUD</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    ACTIVE SCAN
                  </span>
                </div>

                {/* Visual Graphic Representation */}
                <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center py-6">
                  <div className="w-24 h-24 rounded-full border-2 border-cyan-400/80 flex items-center justify-center relative shadow-lg shadow-cyan-500/20 mb-3">
                    <Eye className="w-12 h-12 text-cyan-300" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white shadow">
                      !
                    </div>
                  </div>
                  
                  {/* Bounding Box Preview */}
                  <div className="w-48 bg-navy-950/90 border border-amber-500/80 rounded-lg p-2 text-left text-xs mb-2 shadow">
                    <div className="flex justify-between font-bold text-amber-400 text-[11px]">
                      <span>STONE HAZARD</span>
                      <span>HIGH RISK</span>
                    </div>
                    <div className="text-[10px] text-slate-300">Center Path &bull; Relative: Near</div>
                  </div>

                  {/* Corridor Clear Banner */}
                  <div className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-bold">
                    Left Side: Less Obstructed
                  </div>
                </div>

                {/* Spoken Alert Simulation Box */}
                <div className="relative z-10 bg-navy-950/90 rounded-xl p-2.5 border border-cyan-500/40 text-left">
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-cyan-400 uppercase">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Spoken Audio Feedback</span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-0.5">
                    "Warning! Obstacle detected ahead. Left side appears less obstructed."
                  </p>
                </div>
              </div>

              {/* Caption */}
              <div className="text-center pt-2 text-[11px] text-slate-400 font-medium">
                AI Vision + Relative Depth + Multilingual Voice Alerts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="space-y-8 scroll-mt-20">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Intelligent Navigation Workflow</span>
          <h2 className="text-3xl font-black text-white">How VisionPath AI Works</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            A 4-step real-time computer vision pipeline engineered for accessibility, speed, and safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-lg">
              01
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              Camera Capture
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connects to your Android smartphone's rear camera or external webcam via high-speed MediaDevices streaming with adaptive frame sampling.
            </p>
          </div>

          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-lg">
              02
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              YOLO & Hazard AI
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Neural object detector identifies people, vehicles, furniture, and critical ground hazards (small stones, bricks, cables, potholes, stairs).
            </p>
          </div>

          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-lg">
              03
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              Path & Depth Analysis
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Evaluates Left, Center, and Right walking corridors with MiDaS monocular relative depth to determine clear traversal directions.
            </p>
          </div>

          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg">
              04
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-emerald-400" />
              Multilingual Voice
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Synthesizes real-time spoken guidance in English, Kannada, or Hindi through connected headphones with warning cooldowns to avoid repetitive fatigue.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Stack & Capabilities */}
      <section className="bg-navy-900/60 border border-navy-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3">
          <Layers className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-black text-white">Full-Stack AI Architecture</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Frontend & Audio</h4>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>React 19 & TypeScript</li>
              <li>Tailwind CSS High-Contrast Theme</li>
              <li>Web Speech Synthesis (EN, KN, HI)</li>
              <li>Web Speech Recognition (Voice Commands)</li>
              <li>MediaDevices & Camera API</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Backend & Streaming</h4>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Python 3 & FastAPI ASGI</li>
              <li>Asynchronous WebSockets (Low Latency)</li>
              <li>OpenCV Real-Time Image Processing</li>
              <li>Canny & Hough Line Cable Analysis</li>
              <li>REST Fallback API</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">AI & Computer Vision</h4>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>YOLO Object Detection (ONNX Runtime SIMD)</li>
              <li>MiDaS v2.1 Monocular Relative Depth</li>
              <li>Ground Hazard Anomaly Extraction</li>
              <li>Trapezoid Walkable Corridor Analysis</li>
              <li>No Fake Metric Distances</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Safety & Mobility Assistive Notice */}
      <section className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-5 flex items-start space-x-4 text-amber-200">
        <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-sm text-white">
            Important Assistive Prototype Safety Notice
          </p>
          <p className="leading-relaxed">
            VisionPath AI is an experimental assistive prototype. It is NOT a certified medical or mobility device and MUST NEVER replace a white cane, guide dog, or standard mobility training. Monocular relative depth requires sighted verification. Always begin testing in a controlled environment.
          </p>
        </div>
      </section>
    </div>
  );
};
