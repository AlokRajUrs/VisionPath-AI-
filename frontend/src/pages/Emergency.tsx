import React, { useState } from "react";
import { AppSettings } from "../types";
import { 
  AlertTriangle, 
  Phone, 
  MessageSquare, 
  MapPin, 
  ShieldAlert, 
  Navigation, 
  Check, 
  ExternalLink,
  Volume2
} from "lucide-react";

interface EmergencyProps {
  settings: AppSettings;
  speak: (text: string, priority?: any) => void;
}

export const Emergency: React.FC<EmergencyProps> = ({ settings, speak }) => {
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [sosTriggered, setSosTriggered] = useState<boolean>(false);

  const requestLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      setGpsLoading(false);
      speak("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setGpsLocation(coords);
        setGpsLoading(false);
        speak(`Location captured with accuracy within ${coords.accuracy} meters.`);
      },
      (err) => {
        setGpsError(`Location error: ${err.message}. Please allow location access in browser settings.`);
        setGpsLoading(false);
        speak("Unable to retrieve location. Please check GPS permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleTriggerSOS = () => {
    setSosTriggered(true);
    speak("Emergency SOS activated. Tap Call Emergency Contact to place a phone call or Send Location SMS.", "critical");
  };

  const phone = settings.emergencyContactPhone || "+91";
  const name = settings.emergencyContactName || "Emergency Contact";

  const mapUrl = gpsLocation 
    ? `https://maps.google.com/?q=${gpsLocation.lat},${gpsLocation.lng}` 
    : "";

  const smsBody = encodeURIComponent(
    `${settings.emergencyCustomMessage}${gpsLocation ? ` My current GPS location: ${mapUrl} (accuracy ${gpsLocation.accuracy}m)` : ""}`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="pb-4 border-b border-navy-800">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
          Emergency Assistance
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          Quick-access phone, SMS and optional GPS location sharing with your designated caregiver
        </p>
      </div>

      {/* Big Tactile SOS Confirmation Trigger */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-red-950/80 to-navy-950 border-2 border-red-500/80 shadow-2xl text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            {sosTriggered ? "EMERGENCY PROTOCOL ENGAGED" : "ACTIVATE EMERGENCY ASSISTANCE"}
          </h2>
          <p className="text-xs text-red-200 max-w-md mx-auto mt-1">
            Tap the button below to confirm emergency mode and unlock one-tap call and message shortcuts.
          </p>
        </div>

        {!sosTriggered ? (
          <button
            onClick={handleTriggerSOS}
            className="w-full max-w-md mx-auto py-5 px-6 bg-red-600 hover:bg-red-500 text-white font-black text-xl rounded-2xl border-2 border-white shadow-xl shadow-red-950 active:scale-95 transition-all"
            aria-label="Confirm Emergency SOS Activation"
          >
            CONFIRM EMERGENCY SOS
          </button>
        ) : (
          <div className="p-3 bg-red-900/60 rounded-xl text-xs font-bold text-red-100 max-w-md mx-auto">
            Emergency mode active. Use the direct phone or SMS buttons below.
          </div>
        )}
      </div>

      {/* Emergency Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* 1. Direct Phone Call Shortcut */}
        <div className="bg-navy-900 rounded-2xl border border-navy-700 p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-red-400 font-bold text-base mb-1">
              <Phone className="w-5 h-5" />
              <h3>Direct Voice Call</h3>
            </div>
            <p className="text-xs text-slate-300">
              Immediately launches your smartphone's native phone dialer with your contact's number.
            </p>
            <div className="mt-3 p-2.5 rounded-xl bg-navy-850 border border-navy-750 text-xs">
              <span className="text-slate-400">Contact:</span>{" "}
              <strong className="text-white">{name}</strong> ({phone})
            </div>
          </div>

          <a
            href={`tel:${phone}`}
            onClick={() => speak(`Calling ${name}`)}
            className="w-full flex items-center justify-center space-x-2 py-4 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-base shadow-lg transition-all active:scale-95"
            aria-label={`Call ${name} at ${phone}`}
          >
            <Phone className="w-5 h-5" />
            <span>CALL {name.toUpperCase()}</span>
          </a>
        </div>

        {/* 2. Direct SMS Assistance Shortcut */}
        <div className="bg-navy-900 rounded-2xl border border-navy-700 p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-base mb-1">
              <MessageSquare className="w-5 h-5" />
              <h3>Assistance SMS</h3>
            </div>
            <p className="text-xs text-slate-300">
              Opens your smartphone's messaging app with a pre-written emergency text and optional GPS coordinates.
            </p>
            <div className="mt-3 p-2.5 rounded-xl bg-navy-850 border border-navy-750 text-xs text-slate-400 truncate">
              {settings.emergencyCustomMessage}
            </div>
          </div>

          <a
            href={`sms:${phone}?body=${smsBody}`}
            onClick={() => speak("Opening emergency message compose")}
            className="w-full flex items-center justify-center space-x-2 py-4 px-4 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-black rounded-xl text-base shadow-lg transition-all active:scale-95"
            aria-label="Send Emergency SMS"
          >
            <MessageSquare className="w-5 h-5" />
            <span>SEND EMERGENCY SMS</span>
          </a>
        </div>
      </div>

      {/* 3. Optional GPS Location Sharing with Explicit Permission */}
      <section className="bg-navy-900 rounded-2xl border border-navy-700 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-navy-800">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-base">
            <MapPin className="w-5 h-5" />
            <h2>GPS Location Sharing (Optional)</h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-navy-850 px-2 py-1 rounded">
            Explicit Permission Required
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          In compliance with user safety rules, VisionPath AI <strong>never automatically tracks or shares your location</strong>. Tap below to query your current GPS coordinates to append to emergency messages.
        </p>

        {!gpsLocation ? (
          <button
            onClick={requestLocation}
            disabled={gpsLoading}
            className="flex items-center justify-center space-x-2 py-3 px-5 bg-navy-800 hover:bg-navy-750 text-cyan-300 font-bold rounded-xl border border-cyan-500/50 text-sm active:scale-95 transition-all"
            aria-label="Request GPS Coordinates"
          >
            <Navigation className={`w-4 h-4 ${gpsLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>{gpsLoading ? "Acquiring GPS Signal..." : "Query Current GPS Coordinates"}</span>
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-navy-950 border border-cyan-500/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>GPS Fix Acquired (Accuracy: &plusmn;{gpsLocation.accuracy}m)</span>
              </span>
              <button
                onClick={requestLocation}
                className="text-[11px] text-cyan-400 font-semibold hover:underline"
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
              <div className="bg-navy-900 p-2 rounded">
                <span className="text-slate-500">Lat:</span> {gpsLocation.lat.toFixed(6)}
              </div>
              <div className="bg-navy-900 p-2 rounded">
                <span className="text-slate-500">Lng:</span> {gpsLocation.lng.toFixed(6)}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 hover:underline font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>
        )}

        {gpsError && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200">
            {gpsError}
          </div>
        )}
      </section>

      {/* Safety Note */}
      <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800 text-xs text-slate-400 flex items-start space-x-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <span>
          In a life-threatening crisis, always call your local national emergency services (e.g. 112 in India / 911 in US / 999 in UK) or seek immediate bystander assistance.
        </span>
      </div>
    </div>
  );
};
