"use client";

import { Download, Share, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = "korfball_pwa_install_dismissed_v1";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);

    setIsStandalone(standalone);
    if (standalone) return;

    const dismissed = window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1";
    setIsDismissed(dismissed);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    setIsIosSafari(isIos);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isStandalone || isDismissed || (!deferredPrompt && !isIosSafari)) {
    return null;
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Smartphone size={18} />
        </div>
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-foreground">Pasang Aplikasi Korfball Bantul (PWA)</div>
          {deferredPrompt ? (
            <p className="text-xs text-muted-foreground">
              Tambahkan ke layar utama HP untuk akses 1-tap check-in presensi GPS di WIFA Sport Center & mode layar
              penuh.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
              <span>Di Safari iOS: ketuk ikon</span>
              <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                <Share size={12} /> Bagikan (Share)
              </span>
              <span>lalu pilih</span>
              <strong className="text-foreground">&ldquo;Tambah ke Layar Utama&rdquo; (Add to Home Screen)</strong>.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 shrink-0">
        {deferredPrompt && (
          <Button type="button" size="sm" onClick={handleInstallClick} className="gap-1.5">
            <Download size={14} />
            Install Aplikasi
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          aria-label="Tutup banner instalasi aplikasi"
          className="h-8 w-8 p-0 text-muted-foreground"
        >
          <X size={15} />
        </Button>
      </div>
    </div>
  );
}
