import React, { useState } from "react";
import { NavigationPage, Language } from "../types";
import { 
  Eye, 
  Compass, 
  Maximize2, 
  Clock, 
  Settings as SettingsIcon, 
  AlertTriangle, 
  Info, 
  Volume2, 
  VolumeX, 
  Menu, 
  X,
  Languages
} from "lucide-react";

interface NavbarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  isScanning: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  language,
  onLanguageChange,
  voiceEnabled,
  onToggleVoice,
  isScanning,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { page: NavigationPage; label: string; icon: React.ReactNode }[] = [
    { page: "home", label: "Home", icon: <Eye className="w-5 h-5" /> },
    { page: "dashboard", label: "Dashboard", icon: <Compass className="w-5 h-5" /> },
    { page: "live", label: "Live Assist", icon: <Maximize2 className="w-5 h-5" /> },
    { page: "history", label: "History", icon: <Clock className="w-5 h-5" /> },
    { page: "settings", label: "Settings", icon: <SettingsIcon className="w-5 h-5" /> },
    { page: "about", label: "About", icon: <Info className="w-5 h-5" /> },
  ];

  const handleNav = (page: NavigationPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur-md border-b border-navy-700/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Live Status */}
        <button
          onClick={() => handleNav("home")}
          className="flex items-center space-x-3 text-left focus:outline-none"
          aria-label="VisionPath AI Home"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Eye className="w-6 h-6 text-white" />
            {isScanning && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="text-xl font-black tracking-wider text-white flex items-center gap-2">
              VISIONPATH <span className="text-cyan-400">AI</span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              See the Path Through AI
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-navy-800 text-cyan-400 border border-cyan-500/40 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-navy-800/60"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Accessibility & Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Language Selector */}
          <div className="flex items-center bg-navy-850 border border-navy-700 rounded-xl p-1">
            <Languages className="w-4 h-4 text-cyan-400 ml-1.5 mr-1" />
            {(["en", "kn", "hi"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === lang
                    ? "bg-cyan-500 text-navy-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
                aria-label={`Switch language to ${lang === "en" ? "English" : lang === "kn" ? "Kannada" : "Hindi"}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Voice Mute/Unmute Button */}
          <button
            onClick={onToggleVoice}
            className={`p-2.5 rounded-xl border transition-all ${
              voiceEnabled
                ? "bg-navy-800 border-cyan-500/50 text-cyan-400 hover:bg-navy-750"
                : "bg-navy-850 border-slate-700 text-slate-500 hover:text-slate-300"
            }`}
            title={voiceEnabled ? "Mute Spoken Alerts" : "Enable Spoken Alerts"}
            aria-label={voiceEnabled ? "Mute Spoken Alerts" : "Enable Spoken Alerts"}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Emergency SOS Shortcut */}
          <button
            onClick={() => handleNav("emergency")}
            className="flex items-center space-x-1.5 px-3 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-xl font-bold text-xs tracking-wider border border-red-500/80 shadow-md shadow-red-900/30 transition-all active:scale-95"
            aria-label="Emergency Assistance"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">SOS</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-navy-800 text-slate-300 hover:text-white border border-navy-700"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-navy-800 bg-navy-900 rounded-2xl p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold text-left transition-all ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-200 hover:bg-navy-800"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => handleNav("emergency")}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold text-left bg-red-600/20 text-red-400 border border-red-500/40"
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>Emergency Assistance (SOS)</span>
          </button>
        </div>
      )}
    </header>
  );
};
