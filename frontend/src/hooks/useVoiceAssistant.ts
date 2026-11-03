import { useState, useEffect, useRef, useCallback } from "react";
import { Language, AlertPriority } from "../types";

export interface VoiceCommandHandlers {
  onStartNavigation?: () => void;
  onStopNavigation?: () => void;
  onPauseScanning?: () => void;
  onResumeScanning?: () => void;
  onRepeatWarning?: () => void;
  onDescribeFront?: () => void;
  onToggleVoice?: (enabled: boolean) => void;
  onChangeLanguage?: (lang: Language) => void;
  onCheckCameraStatus?: () => void;
  onCheckNavStatus?: () => void;
}

export function useVoiceAssistant(
  initialLanguage: Language = "en",
  initialVoiceEnabled = true,
  handlers: VoiceCommandHandlers = {}
) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(initialVoiceEnabled);
  const [speechRate, setSpeechRate] = useState<number>(1.05);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [lastSpokenText, setLastSpokenText] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognizedCommand, setRecognizedCommand] = useState<string>("");
  const [recognitionSupported, setRecognitionSupported] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Load available speech synthesis voices
  const updateVoices = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    }
  }, []);

  useEffect(() => {
    updateVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [updateVoices]);

  // Find optimal voice for current language
  const getVoiceForLanguage = useCallback((lang: Language): SpeechSynthesisVoice | null => {
    if (!availableVoices.length) return null;

    if (lang === "kn") {
      // Kannada voice
      const knVoice = availableVoices.find(
        (v) => v.lang.toLowerCase().includes("kn") || v.name.toLowerCase().includes("kannada")
      );
      if (knVoice) return knVoice;
    } else if (lang === "hi") {
      // Hindi voice
      const hiVoice = availableVoices.find(
        (v) => v.lang.toLowerCase().includes("hi") || v.name.toLowerCase().includes("hindi")
      );
      if (hiVoice) return hiVoice;
    }

    // Default English or primary local voice
    const enVoice = availableVoices.find(
      (v) => v.lang.toLowerCase().includes("en") && (v.lang.includes("IN") || v.lang.includes("US") || v.lang.includes("GB"))
    );
    return enVoice || availableVoices[0] || null;
  }, [availableVoices]);

  // Speak announcement
  const speak = useCallback(
    (text: string, priority: AlertPriority = "advisory", targetLang?: Language) => {
      if (!voiceEnabled || !text || text.trim() === "") return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      const activeLang = targetLang || language;
      const synth = window.speechSynthesis;

      // If high priority or critical, cancel pending speech to announce immediately
      if (priority === "critical" || priority === "warning") {
        synth.cancel();
      } else if (synth.speaking && priority === "none") {
        return; // Don't interrupt for low priority background chatter
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;

      const voice = getVoiceForLanguage(activeLang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = activeLang === "kn" ? "kn-IN" : activeLang === "hi" ? "hi-IN" : "en-US";
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setLastSpokenText(text);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (e) => {
        console.warn("[VoiceAssistant] Speech synthesis error:", e);
        setIsSpeaking(false);
      };

      synth.speak(utterance);
    },
    [voiceEnabled, language, speechRate, speechPitch, getVoiceForLanguage]
  );

  // Trigger haptic vibration on mobile devices
  const triggerHaptic = useCallback((pattern: number[] = [120, 40, 120]) => {
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Haptics might be blocked by browser policy without user gesture
      }
    }
  }, []);

  // Repeat Last Warning
  const repeatLastWarning = useCallback(() => {
    if (lastSpokenText) {
      speak(lastSpokenText, "critical");
    } else {
      speak(
        language === "kn"
          ? "ಯಾವುದೇ ಹಿಂದಿನ ಎಚ್ಚರಿಕೆ ದಾಖಲಾಗಿಲ್ಲ."
          : language === "hi"
          ? "कोई पिछली चेतावनी उपलब्ध नहीं है।"
          : "No previous warning recorded.",
        "advisory"
      );
    }
  }, [lastSpokenText, speak, language]);

  // Initialize Speech Recognition for Voice Commands
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("[VoiceAssistant] Speech Recognition API not supported in this browser.");
      setRecognitionSupported(false);
      return;
    }

    setRecognitionSupported(true);

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = language === "kn" ? "kn-IN" : language === "hi" ? "hi-IN" : "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn("[VoiceAssistant] Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        setRecognizedCommand(transcript);
        console.log("[VoiceAssistant] Voice Command Recognized:", transcript);

        // Process Voice Commands
        const h = handlersRef.current;
        if (transcript.includes("start navigation") || transcript.includes("start scan") || transcript === "start") {
          h.onStartNavigation?.();
        } else if (transcript.includes("stop navigation") || transcript.includes("stop scan") || transcript === "stop") {
          h.onStopNavigation?.();
        } else if (transcript.includes("pause")) {
          h.onPauseScanning?.();
        } else if (transcript.includes("resume")) {
          h.onResumeScanning?.();
        } else if (transcript.includes("repeat") || transcript.includes("repeat warning") || transcript.includes("what was that")) {
          h.onRepeatWarning ? h.onRepeatWarning() : repeatLastWarning();
        } else if (transcript.includes("what is in front") || transcript.includes("front") || transcript.includes("ahead")) {
          h.onDescribeFront?.();
        } else if (transcript.includes("enable voice") || transcript.includes("voice on")) {
          setVoiceEnabled(true);
          h.onToggleVoice?.(true);
        } else if (transcript.includes("disable voice") || transcript.includes("voice off") || transcript.includes("mute")) {
          setVoiceEnabled(false);
          h.onToggleVoice?.(false);
        } else if (transcript.includes("kannada")) {
          setLanguage("kn");
          h.onChangeLanguage?.("kn");
        } else if (transcript.includes("hindi")) {
          setLanguage("hi");
          h.onChangeLanguage?.("hi");
        } else if (transcript.includes("english")) {
          setLanguage("en");
          h.onChangeLanguage?.("en");
        } else if (transcript.includes("camera status")) {
          h.onCheckCameraStatus?.();
        } else if (transcript.includes("navigation status") || transcript.includes("status")) {
          h.onCheckNavStatus?.();
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("[VoiceAssistant] Failed to init SpeechRecognition:", e);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [language, repeatLastWarning]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Could not start recognition:", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Could not stop recognition:", e);
      }
    }
  }, [isListening]);

  return {
    language,
    setLanguage,
    voiceEnabled,
    setVoiceEnabled,
    speechRate,
    setSpeechRate,
    speechPitch,
    setSpeechPitch,
    isSpeaking,
    lastSpokenText,
    speak,
    repeatLastWarning,
    triggerHaptic,
    isListening,
    recognizedCommand,
    recognitionSupported,
    startListening,
    stopListening,
  };
}
