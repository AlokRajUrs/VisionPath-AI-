import { NavigationResponse, DetectionEvent } from "../types";

// Determine appropriate backend URLs dynamically based on current browser window location
export function getBackendUrls() {
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const port = 8000;
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

  const httpBase = `${isHttps ? "https" : "http"}://${host}:${port}`;
  const wsBase = `${isHttps ? "wss" : "ws"}://${host}:${port}`;

  return {
    httpBase,
    wsBase,
    wsNavigationUrl: `${wsBase}/ws/navigation`,
    processFrameUrl: `${httpBase}/api/process-frame`,
    healthUrl: `${httpBase}/api/health`,
    modelsStatusUrl: `${httpBase}/api/models/status`,
    historyUrl: `${httpBase}/api/history`,
    clearHistoryUrl: `${httpBase}/api/history/clear`,
  };
}

export async function checkBackendHealth() {
  const { healthUrl } = getBackendUrls();
  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch (err) {
    return { online: false, error: String(err) };
  }
}

export async function checkModelsStatus() {
  const { modelsStatusUrl } = getBackendUrls();
  try {
    const res = await fetch(modelsStatusUrl, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function sendFrameREST(
  imageBase64: string,
  calibratedMode = false,
  cameraHeightM = 1.2,
  language = "en"
): Promise<NavigationResponse | null> {
  const { processFrameUrl } = getBackendUrls();
  try {
    const res = await fetch(processFrameUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: imageBase64,
        calibrated_mode: calibratedMode,
        camera_height_m: cameraHeightM,
        language,
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[API] REST frame processing error:", err);
    return null;
  }
}

export async function fetchDetectionHistory(riskFilter?: string): Promise<DetectionEvent[]> {
  const { historyUrl } = getBackendUrls();
  try {
    const url = riskFilter && riskFilter !== "all" ? `${historyUrl}?risk_filter=${riskFilter}` : historyUrl;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function clearDetectionHistory(): Promise<boolean> {
  const { clearHistoryUrl } = getBackendUrls();
  try {
    const res = await fetch(clearHistoryUrl, { method: "POST" });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export class NavigationWebSocketClient {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((data: NavigationResponse) => void) | null = null;
  private onStatusChangeCallback: ((connected: boolean) => void) | null = null;
  private isConnected = false;
  private reconnectTimer: any = null;

  constructor(
    onMessage: (data: NavigationResponse) => void,
    onStatusChange?: (connected: boolean) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatusChange || null;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const { wsNavigationUrl } = getBackendUrls();
    console.log("[WebSocket] Connecting to:", wsNavigationUrl);

    try {
      this.ws = new WebSocket(wsNavigationUrl);

      this.ws.onopen = () => {
        console.log("[WebSocket] Navigation connection established");
        this.isConnected = true;
        this.onStatusChangeCallback?.(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && this.onMessageCallback) {
            this.onMessageCallback(parsed);
          }
        } catch (e) {
          console.warn("[WebSocket] Failed to parse message:", e);
        }
      };

      this.ws.onclose = () => {
        console.log("[WebSocket] Navigation connection closed");
        this.isConnected = false;
        this.onStatusChangeCallback?.(false);
      };

      this.ws.onerror = (err) => {
        console.warn("[WebSocket] Error:", err);
        this.isConnected = false;
        this.onStatusChangeCallback?.(false);
      };
    } catch (e) {
      console.warn("[WebSocket] Init exception:", e);
      this.isConnected = false;
      this.onStatusChangeCallback?.(false);
    }
  }

  public sendFrame(imageBase64: string, config?: { calibrated_mode?: boolean; camera_height_m?: number }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "frame",
          image: imageBase64,
          calibrated_mode: config?.calibrated_mode || false,
          camera_height_m: config?.camera_height_m || 1.2,
        })
      );
      return true;
    }
    return false;
  }

  public sendPause() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "pause" }));
    }
  }

  public sendResume() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "resume" }));
    }
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.onStatusChangeCallback?.(false);
  }

  public getConnected(): boolean {
    return this.isConnected;
  }
}
