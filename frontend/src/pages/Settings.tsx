import React from "react";
import { AppSettings, Language } from "../types";
import { CameraDevice } from "../hooks/useCamera";
import { 
  Settings as SettingsIcon, 
  Volume2, 
  Camera, 
  Sliders, 
  Phone, 
  Shield, 
  Vibrate, 
  Ruler, 
  Save, 
  RefreshCw,
  Check
} from "lucide-react";

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  devices: CameraDevice[];
  onRefreshDevices: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  devices,
  onRefreshDevices,
}) => {
  const [savedMessage, setSavedMessage] = React.useState(false);

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-cyan-400" />
            System & Voice Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Customize voice guidance, camera parameters, distance calibration and emergency contacts
          </p>
        </div>

        {savedMessage && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold animate-pulse">
            <Check className="w-4 h-4" />
            <span>Settings Saved Locally</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        
        {/* 1. Voice & Language Preferences */}
        <section className="bg-navy-900 rounded-2xl border border-navy-700 p-5 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-base pb-2 border-b border-navy-800">
            <Volume2 className="w-5 h-5" />
            <h2>Voice Guidance & Multilingual Audio</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Primary Language */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Voice Assistant Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => onUpdateSettings({ language: e.target.value as Language })}
                className="w-full bg-navy-850 border border-navy-700 text-white rounded-xl p-3 text-sm font-semibold focus:border-cyan-500 focus:outline-none"
              >
                <option value="en">English (Default)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            {/* Voice Enable Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Voice Synthesis Feedback
              </label>
              <button
                type="button"
                onClick={() => onUpdateSettings({ voiceEnabled: !settings.voiceEnabled })}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm border flex items-center justify-between transition-all ${
                  settings.voiceEnabled
                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                    : "bg-navy-850 border-navy-700 text-slate-400"
                }`}
              >
                <span>Voice Alerts</span>
                <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-navy-900">
                  {settings.voiceEnabled ? "ACTIVE (ON)" : "MUTED (OFF)"}
                </span>
              </button>
            </div>

            {/* Speech Rate Slider */}
            <div>
              <label className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Speech Speed</span>
                <span className="text-cyan-400 font-mono">{settings.speechRate}x</span>
              </label>
              <input
                type="range"
                min="0.75"
                max="1.4"
                step="0.05"
                value={settings.speechRate}
                onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.75x (Clear)</span>
                <span>1.0x (Normal)</span>
                <span>1.4x (Fast)</span>
              </div>
            </div>

            {/* Mobile Haptic Feedback */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Smartphone Vibration Haptics
              </label>
              <button
                type="button"
                onClick={() => onUpdateSettings({ hapticEnabled: !settings.hapticEnabled })}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm border flex items-center justify-between transition-all ${
                  settings.hapticEnabled
                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                    : "bg-navy-850 border-navy-700 text-slate-400"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-cyan-400" />
                  <span>Haptic Buzz on Hazard</span>
                </span>
                <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-navy-900">
                  {settings.hapticEnabled ? "ENABLED" : "DISABLED"}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. Camera Hardware & Resolution */}
        <section className="bg-navy-900 rounded-2xl border border-navy-700 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-navy-800">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-base">
              <Camera className="w-5 h-5" />
              <h2>Camera Hardware & Stream Resolution</h2>
            </div>
            <button
              onClick={onRefreshDevices}
              className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 border border-navy-700 text-xs font-bold flex items-center gap-1"
              title="Rescan Available Cameras"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh Devices</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Preferred Camera Lens */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Available Camera Device
              </label>
              <select
                value={settings.selectedCameraId}
                onChange={(e) => onUpdateSettings({ selectedCameraId: e.target.value })}
                className="w-full bg-navy-850 border border-navy-700 text-white rounded-xl p-3 text-sm font-semibold focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Rear Camera (Default Environment)</option>
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Processing Resolution */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Streaming Resolution
              </label>
              <select
                value={settings.cameraResolution}
                onChange={(e) => onUpdateSettings({ cameraResolution: e.target.value as any })}
                className="w-full bg-navy-850 border border-navy-700 text-white rounded-xl p-3 text-sm font-semibold focus:border-cyan-500 focus:outline-none"
              >
                <option value="480p">480p (Fastest / Low Latency for Mobile 4G/Wi-Fi)</option>
                <option value="720p">720p (High Detail / Recommended for Small Hazards)</option>
              </select>
            </div>
          </div>
        </section>

        {/* 3. Distance Estimation & Calibration */}
        <section className="bg-navy-900 rounded-2xl border border-navy-700 p-5 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-base pb-2 border-b border-navy-800">
            <Ruler className="w-5 h-5" />
            <h2>Distance Estimation & Depth Calibration</h2>
          </div>

          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-300 leading-relaxed">
              <strong>Measurement Disclaimer:</strong> Monocular depth models (MiDaS) estimate relative inverse depth [0.0 - 1.0]. Without stereoscopic or LiDAR hardware, metric distance (meters) is an approximation based on phone height and tilt. When calibrated mode is off, the app safely displays <em>"Distance unavailable"</em>.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Metric Calibration Mode
                </label>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ calibratedMode: !settings.calibratedMode })}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm border flex items-center justify-between transition-all ${
                    settings.calibratedMode
                      ? "bg-amber-500/10 border-amber-500 text-amber-300"
                      : "bg-navy-850 border-navy-700 text-slate-400"
                  }`}
                >
                  <span>Calibrated Approximation</span>
                  <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-navy-900">
                    {settings.calibratedMode ? "CALIBRATED (ON)" : "UNAVAILABLE (SAFE)"}
                  </span>
                </button>
              </div>

              {settings.calibratedMode && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Smartphone Chest/Mount Height: <span className="text-cyan-400">{settings.cameraHeightM} meters</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.6"
                    max="2.0"
                    value={settings.cameraHeightM}
                    onChange={(e) => onUpdateSettings({ cameraHeightM: parseFloat(e.target.value) || 1.2 })}
                    className="w-full bg-navy-850 border border-navy-700 text-white rounded-xl p-3 text-sm font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. Emergency Contact Setup */}
        <section className="bg-navy-900 rounded-2xl border border-navy-700 p-5 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-red-400 font-bold text-base pb-2 border-b border-navy-800">
            <Phone className="w-5 h-5" />
            <h2>Emergency Assistance Contact (SOS)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Emergency Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Family Member / Caregiver"
                value={settings.emergencyContactName}
                onChange={(e) => onUpdateSettings({ emergencyContactName: e.target.value })}
                className="w-full bg-navy-850 border border-navy-700 text-white rounded-xl p-3 text-sm font-semibold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Emergency Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={settings.emergencyContactPhone}
                onChange={(e) => onUpdateSettings({ emergencyContactPhone: e.target.value })}
                className="w-full bg-navy-850 border border-navy-700 text-white rounded-xl p-3 text-sm font-semibold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Emergency SMS Alert Message Template
              </label>
              <textarea
                rows={2}
                value={settings.emergencyCustomMessage}
                onChange={(e) => onUpdateSettings({ emergencyCustomMessage: e.target.value })}
                className="w-full bg-navy-850 border border-navy-700 text-white rounded-xl p-3 text-sm font-semibold focus:border-cyan-500 focus:outline-none"
                placeholder="I need urgent assistance with navigation. My current location is attached."
              />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-black rounded-xl text-base shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Save className="w-5 h-5" />
            <span>SAVE PREFERENCES</span>
          </button>
        </div>
      </div>
    </div>
  );
};
