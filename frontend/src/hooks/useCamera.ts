import { useState, useRef, useEffect, useCallback } from "react";

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [resolution, setResolution] = useState<"480p" | "720p" | "1080p">("480p");

  // Enumerate cameras
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setError("MediaDevices API is not supported in this browser.");
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1} (${d.deviceId.slice(0, 5)}...)`,
        }));
      setDevices(videoDevs);
      if (videoDevs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch (e: any) {
      console.warn("Could not enumerate camera devices:", e);
    }
  }, [selectedDeviceId]);

  // Start Camera Stream
  const startCamera = useCallback(async (desiredDeviceId?: string, desiredFacing?: "environment" | "user") => {
    setError(null);
    setPermissionDenied(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported by your browser or connection is not secure (requires HTTPS or localhost).");
      return;
    }

    // Stop existing stream if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const currentFacing = desiredFacing || facingMode;
    const targetDevId = desiredDeviceId !== undefined ? desiredDeviceId : selectedDeviceId;

    const resConstraints = resolution === "1080p"
      ? { width: { ideal: 1920 }, height: { ideal: 1080 } }
      : resolution === "720p" 
      ? { width: { ideal: 1280 }, height: { ideal: 720 } }
      : { width: { ideal: 640 }, height: { ideal: 480 } };

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: targetDevId
        ? { deviceId: { exact: targetDevId }, ...resConstraints, frameRate: { ideal: 24, max: 30 } }
        : { facingMode: { ideal: currentFacing }, ...resConstraints, frameRate: { ideal: 24, max: 30 } },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // Crucial for iOS/Android mobile browsers
        await videoRef.current.play();
      }

      setIsActive(true);
      await refreshDevices();
    } catch (err: any) {
      console.error("[Camera] Failed to start camera:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionDenied(true);
        setError("Camera permission was denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No camera device was detected on your smartphone or system.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("Camera hardware is currently in use by another application or disconnected.");
      } else {
        setError(`Camera error: ${err.message || "Unable to open video stream."}`);
      }
      setIsActive(false);
    }
  }, [facingMode, selectedDeviceId, resolution, refreshDevices]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  // Switch between Rear and Front cameras
  const toggleFacingMode = useCallback(async () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    setSelectedDeviceId(""); // clear exact device id to allow facingMode constraint to resolve
    if (isActive) {
      await startCamera("", nextFacing);
    }
  }, [facingMode, isActive, startCamera]);

  // Select external camera or specific device
  const switchDevice = useCallback(async (devId: string) => {
    setSelectedDeviceId(devId);
    if (isActive) {
      await startCamera(devId);
    }
  }, [isActive, startCamera]);

  // Capture a single frame as base64 JPEG
  const captureFrame = useCallback((quality = 0.72): string | null => {
    if (!videoRef.current || !isActive || videoRef.current.readyState < 2) {
      return null;
    }

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const targetW = resolution === "720p" ? 640 : 480; // Optimized size for low-latency network transfer
    const targetH = Math.round((targetW * video.videoHeight) / (video.videoWidth || 1));

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, targetW, targetH);
    return canvas.toDataURL("image/jpeg", quality);
  }, [isActive, resolution]);

  // Listen for device unplug / plug events
  useEffect(() => {
    const handleDeviceChange = () => {
      refreshDevices();
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    }

    return () => {
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      }
      stopCamera();
    };
  }, [refreshDevices, stopCamera]);

  return {
    videoRef,
    isActive,
    facingMode,
    devices,
    selectedDeviceId,
    error,
    permissionDenied,
    resolution,
    setResolution,
    startCamera,
    stopCamera,
    toggleFacingMode,
    switchDevice,
    captureFrame,
    refreshDevices,
  };
}
