"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  DownloadCloud, 
  MapPin, 
  Bell, 
  Volume2, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  ExternalLink,
  Lock,
  ChevronRight
} from "lucide-react";
import { 
  getAppConfig, 
  getLegalPolicies, 
  updatePermissions, 
  AppConfig, 
  LegalPolicies 
} from "@/lib/api";

// ── 1. Remote App Update Popup Modal ────────────────────────────────────────

export function AppUpdateModal() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentVersion] = useState("1.0.0"); // Current bundled partner webapp version

  useEffect(() => {
    getAppConfig()
      .then((cfg) => {
        if (!cfg) return;
        setConfig(cfg);
        // Compare semantic version or force update flag
        if (cfg.force_update || (cfg.latest_version && cfg.latest_version !== currentVersion)) {
          setShowModal(true);
        }
      })
      .catch((err) => console.log("[APP CONFIG LOAD]", err));
  }, [currentVersion]);

  if (!showModal || !config) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-md p-6 border shadow-2xl rounded-2xl bg-slate-900 border-emerald-500/30 shadow-emerald-500/10 text-slate-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 border rounded-xl bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                <DownloadCloud className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
                  {config.force_update ? "Mandatory Update" : "Update Available"}
                </span>
                <h3 className="text-lg font-black text-white">
                  ServoPartner v{config.latest_version}
                </h3>
              </div>
            </div>
            {!config.force_update && (
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            {config.update_message || "A new high-performance version of ServoPartner is available with improved real-time order alerts and live GPS tracking."}
          </p>

          <div className="flex items-center gap-3">
            <a
              href={config.playstore_url || "https://play.google.com/store/apps/details?id=in.servolocal.app"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              <span>Update Now</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {!config.force_update && (
              <button
                onClick={() => setShowModal(false)}
                className="py-3 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Remind Later
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


// ── 2. Device Permissions Banner (GPS + Audio/Push) ─────────────────────────

interface DevicePermissionsBannerProps {
  onPermissionsUpdated?: () => void;
}

export function DevicePermissionsBanner({ onPermissionsUpdated }: DevicePermissionsBannerProps) {
  const [locationGranted, setLocationGranted] = useState(true);
  const [notificationsGranted, setNotificationsGranted] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check GPS permission state
    if ("permissions" in navigator && navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((res) => {
        setLocationGranted(res.state === "granted");
        res.onchange = () => setLocationGranted(res.state === "granted");
      }).catch(() => {});
    }

    // Check Notification state
    if ("Notification" in window) {
      setNotificationsGranted(Notification.permission === "granted");
    }

    setChecking(false);
  }, []);

  const requestGps = () => {
    if (!navigator.geolocation) {
      alert("GPS location is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationGranted(true);
        updatePermissions({ location_permission_granted: true });
        onPermissionsUpdated?.();
      },
      (err) => {
        alert("Please enable Device GPS location to receive neighborhood orders.");
      },
      { enableHighAccuracy: true }
    );
  };

  const requestSoundAndPush = async () => {
    // Play test audio beep to unlock audio context in mobile browsers
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.value = 0.05;
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.log("Audio unlock:", e);
    }

    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotificationsGranted(perm === "granted");
      if (perm === "granted") {
        updatePermissions({ terms_accepted: true });
      }
    } else {
      setNotificationsGranted(true);
    }
    onPermissionsUpdated?.();
  };

  if (checking || (locationGranted && notificationsGranted)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3.5 mb-4 border rounded-2xl bg-amber-500/10 border-amber-500/30 text-amber-200"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
        <div className="flex-1">
          <h4 className="text-xs font-bold tracking-wide uppercase text-amber-400">
            Action Required: Enable Device Services
          </h4>
          <p className="text-xs text-amber-100/90 mt-0.5 mb-2.5">
            ServoPartner needs high-accuracy GPS and Loud Order Chime permissions to alert you instantly when a new order arrives.
          </p>
          <div className="flex flex-wrap gap-2">
            {!locationGranted && (
              <button
                onClick={requestGps}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Enable GPS Location</span>
              </button>
            )}
            {!notificationsGranted && (
              <button
                onClick={requestSoundAndPush}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Enable Loud Buzzer & Alerts</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}


// ── 3. Mandatory Terms & Partner Agreement Modal (-₹200 Cutoff) ─────────────

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  role?: "seller" | "partner";
}

export function TermsModal({ isOpen, onAccept, role = "seller" }: TermsModalProps) {
  const [policies, setPolicies] = useState<LegalPolicies | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      getLegalPolicies()
        .then((data) => setPolicies(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">
              ServoPartner Legal Agreement
            </h3>
            <p className="text-xs text-slate-400">
              Zero-Tax Direct UPI Settlement & -₹200 Wallet Dues Safety Rule
            </p>
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
          {/* Highlight Card: -₹200 Dues Rule */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200">
            <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
              <Lock className="w-4 h-4" />
              <span>Prepaid Wallet & -₹200 Auto-Pause Cutoff</span>
            </div>
            <p className="text-rose-100/90 text-xs">
              Customers pay you directly via UPI. The platform commission (8%-15%) is debited from your ServoLocal Prepaid Ledger. If your balance drops below -₹200.00, your shop/delivery queue is temporarily paused until dues are cleared via in-app Razorpay/UPI.
            </p>
          </div>

          {/* Highlights from Backend */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 text-emerald-400">
              1. Commission & Merchant Code of Conduct
            </h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
              <li>Merchants agree to keep prices fair and accurately updated to store MRP.</li>
              <li>Toggle store switch to CLOSED immediately when physical shop is shut.</li>
              <li>Orders must be prepared freshly within 5-10 minutes of acceptance.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 text-emerald-400">
              2. Privacy & High-Accuracy GPS Tracking
            </h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
              <li>Your GPS location is broadcast strictly to local customers within your active delivery radius.</li>
              <li>Location coordinates are never sold or rented to third-party data aggregators.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 text-emerald-400">
              3. Refund & Dispute Resolution
            </h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
              <li>Out-of-stock cancellations must be marked within 3 minutes of customer order placement.</li>
              <li>Customer doorstep delivery PIN verification ensures 100% fraud-proof fulfillment.</li>
            </ul>
          </div>
        </div>

        {/* Footer with Checkbox & Accept Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col gap-3">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
            />
            <span>
              I have read, understood, and accept the ServoLocal Partner Agreement, -₹200 Dues Auto-Pause Policy, and Privacy Terms.
            </span>
          </label>

          <button
            onClick={() => {
              if (!accepted) return;
              updatePermissions({ terms_accepted: true });
              onAccept();
            }}
            disabled={!accepted}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              accepted
                ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>Accept & Enter Partner Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
