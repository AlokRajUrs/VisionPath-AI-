import React from "react";
import { 
  Eye, 
  ShieldAlert, 
  Cpu, 
  Lock, 
  HeartHandshake, 
  Compass, 
  CheckCircle2, 
  AlertTriangle,
  FileText
} from "lucide-react";

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      
      {/* Title */}
      <div className="space-y-2 pb-4 border-b border-navy-800">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest">
          <Eye className="w-4 h-4" />
          <span>Project Mission</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          About VISIONPATH <span className="text-cyan-400">AI</span>
        </h1>
        <p className="text-base text-cyan-200 font-bold">
          "See the Path Through AI" &bull; Smart Vision. Safer Navigation.
        </p>
      </div>

      {/* Project Overview */}
      <section className="bg-navy-900 rounded-3xl border border-navy-700 p-6 sm:p-8 space-y-4 shadow-xl">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <HeartHandshake className="w-6 h-6 text-cyan-400" />
          Empowering Independent Mobility
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          <strong>VisionPath AI</strong> was conceptualized and developed to bridge the spatial awareness gap for visually impaired individuals. Navigating busy streets, uneven footpaths, low-hanging obstacles, and unexpected ground hazards (such as cables, stones, steps, or potholes) presents daily physical safety risks.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          By combining high-performance neural object detection (YOLO), computer-vision ground hazard analysis, monocular relative depth estimation (MiDaS), and browser Web Speech APIs, VisionPath AI transforms an ordinary smartphone into a context-aware smart assistant that whispers timely warnings through Bluetooth headphones.
        </p>
      </section>

      {/* Mandatory Safety Guidelines & Disclaimers */}
      <section className="bg-red-950/40 border-2 border-red-500/70 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl text-red-100">
        <div className="flex items-center space-x-2.5 text-red-400 font-black text-lg">
          <ShieldAlert className="w-7 h-7 text-red-500" />
          <h2>Mandatory Safety & Assistive Principles</h2>
        </div>

        <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
          <li className="flex items-start space-x-2">
            <span className="text-red-400 font-bold text-base">&bull;</span>
            <span>
              <strong>Not a Certified Medical Device:</strong> VisionPath AI is an experimental AI prototype. It is NOT certified as a medical mobility aid or a primary navigation system.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-400 font-bold text-base">&bull;</span>
            <span>
              <strong>Never Replace a White Cane or Guide Dog:</strong> This application must ONLY be used as a supplementary auditory aid alongside primary orientation and mobility tools (e.g. white canes, guide dogs, sighted guides).
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-400 font-bold text-base">&bull;</span>
            <span>
              <strong>No Guarantee of Obstacle Detection:</strong> Environmental conditions such as direct glare, extreme darkness, high camera shake, lens smudges, and high speeds can degrade AI detection. Always verify the physical path before stepping forward.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-400 font-bold text-base">&bull;</span>
            <span>
              <strong>Distance Estimation Limitations:</strong> Monocular depth models calculate relative depth (near vs far), not exact certified physical metric measurements. Unless physically calibrated, distances are displayed as unavailable.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-400 font-bold text-base">&bull;</span>
            <span>
              <strong>Controlled Environment Testing:</strong> Initial trials should always take place in controlled, familiar indoor or quiet outdoor environments with a sighted supervisor present.
            </span>
          </li>
        </ul>
      </section>

      {/* Privacy and Data Protection */}
      <section className="bg-navy-900 rounded-3xl border border-navy-700 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 text-cyan-400 font-black text-lg">
          <Lock className="w-6 h-6" />
          <h2>Privacy & Data Sovereignty</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          We believe assistive technology must protect personal privacy:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-navy-850 rounded-xl border border-navy-750">
            <strong className="text-white block mb-1">Zero Video Storage</strong>
            Camera video frames are processed in-memory and immediately discarded. No video is recorded or stored on disk.
          </div>
          <div className="p-3 bg-navy-850 rounded-xl border border-navy-750">
            <strong className="text-white block mb-1">Explicit Permissions</strong>
            Camera and GPS location access are never initiated without explicit user browser authorization.
          </div>
          <div className="p-3 bg-navy-850 rounded-xl border border-navy-750">
            <strong className="text-white block mb-1">Local Network Streaming</strong>
            When tested on home or mobile hotspot Wi-Fi, frame data travels strictly between your phone and laptop backend.
          </div>
          <div className="p-3 bg-navy-850 rounded-xl border border-navy-750">
            <strong className="text-white block mb-1">Client-Side Audio</strong>
            Voice synthesis is performed natively inside your device browser using the local OS speech engine.
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="bg-navy-900 rounded-3xl border border-navy-700 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 text-cyan-400 font-black text-lg">
          <Cpu className="w-6 h-6" />
          <h2>AI & Computer Vision Specifications</h2>
        </div>
        <div className="divide-y divide-navy-800 text-xs sm:text-sm text-slate-300">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400 font-semibold">Primary Object Detector</span>
            <span className="font-mono text-white">YOLO ONNX (FP16 Optimized)</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400 font-semibold">Small Hazard CV Engine</span>
            <span className="font-mono text-white">Canny / Hough Curvilinear & Contrast Blob Analysis</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400 font-semibold">Monocular Depth Engine</span>
            <span className="font-mono text-white">MiDaS v2.1 Small ONNX</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400 font-semibold">Walkable Path Analysis</span>
            <span className="font-mono text-white">Adaptive 3-Corridor Trapezoid Clearance</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400 font-semibold">Supported Speech Languages</span>
            <span className="font-mono text-white">English (en-US), Kannada (kn-IN), Hindi (hi-IN)</span>
          </div>
        </div>
      </section>
    </div>
  );
};
