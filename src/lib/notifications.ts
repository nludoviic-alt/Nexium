/**
 * Nexium Notifications System & Sound Synthesizer
 * Provides Web Audio API chimes, rich toast triggers, and notification models.
 */
import { toast } from "sonner";

export type NotificationType = "trade" | "alert" | "bot" | "security" | "system";
export type NotificationSeverity = "success" | "warning" | "error" | "info";

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  symbol?: string;
  amount?: number;
  score?: number;
}

// Global sound preference state
let soundEnabled = true;

export function setNotificationSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("nexium_notif_sound", enabled ? "true" : "false");
    } catch {}
  }
}

export function getNotificationSoundEnabled(): boolean {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("nexium_notif_sound");
      if (stored !== null) return stored === "true";
    } catch {}
  }
  return soundEnabled;
}

/**
 * Web Audio API synthesizer for clean, lag-free UI chimes without external audio files.
 */
export function playNotificationSound(type: NotificationType | NotificationSeverity = "alert") {
  if (!getNotificationSoundEnabled() || typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === "trade" || type === "success") {
      // Pleasant futuristic ascending dual chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(880.0, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18); // D6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } else if (type === "alert") {
      // Crisp bell notification ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1046.5, now); // C6
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === "warning" || type === "bot") {
      // High-tech pulsed beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(523.25, now + 0.08); // C5

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "error") {
      // Soft low error warning
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.linearRampToValueAtTime(174.61, now + 0.22); // F3

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Subtle info chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(783.99, now); // G5
      osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.1); // B5

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // Handle autoplay restrictions gracefully
  }
}

/**
 * Dispatches a toast with matching sound effect
 */
export function triggerNotificationToast(
  title: string,
  options?: {
    description?: string;
    type?: NotificationSeverity;
    soundType?: NotificationType;
    duration?: number;
  }
) {
  const severity = options?.type || "info";
  const sound = options?.soundType || severity;

  playNotificationSound(sound);

  const config = {
    description: options?.description,
    duration: options?.duration ?? 4000,
  };

  switch (severity) {
    case "success":
      return toast.success(title, config);
    case "error":
      return toast.error(title, config);
    case "warning":
      return toast.warning(title, config);
    case "info":
    default:
      return toast.info(title, config);
  }
}
