"use client";
/**
 * Install-as-app support: registers the service worker, captures the browser's install prompt
 * (Android / desktop Chrome / Edge) and shows Safari's "Add to Home Screen" steps on iPhone.
 */
import { useEffect, useSyncExternalStore, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cx } from "@/components/ui/cx";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: PromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as PromptEvent; emit(); });
  window.addEventListener("appinstalled", () => { deferred = null; emit(); });
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

type Mode = "none" | "prompt" | "ios";
function snapshot(): Mode {
  if (typeof window === "undefined") return "none";
  const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "none";
  if (deferred) return "prompt";
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  return ios && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua) ? "ios" : "none";
}
function useInstallMode() { return useSyncExternalStore(subscribe, snapshot, () => "none" as Mode); }

async function install(mode: Mode, showIos: () => void) {
  if (mode === "prompt" && deferred) { await deferred.prompt(); await deferred.userChoice; deferred = null; emit(); }
  else if (mode === "ios") showIos();
}

function IosSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/30 md:items-center md:justify-center" onClick={onClose}>
      <div className="fade-up w-full rounded-t-3xl bg-white p-5 shadow-soft md:max-w-sm md:rounded-3xl" style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-lg font-extrabold text-reef-800">{t("pwa.install")}</p><p className="mt-1 text-sm text-muted">{t("pwa.installSub")}</p></div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-mint-100" aria-label={t("pwa.close")}><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-4 flex items-center gap-2 rounded-2xl bg-mint-50 p-3 text-sm font-semibold text-reef-800"><Share className="h-5 w-5 shrink-0" aria-hidden />{t("pwa.iosHint")}</p>
      </div>
    </div>
  );
}

/** Small "Install the app" button for headers and menus. Hidden when the app is already installed or can't be. */
export function InstallButton({ className }: { className?: string }) {
  const { t } = useI18n();
  const mode = useInstallMode();
  const [ios, setIos] = useState(false);
  if (mode === "none") return null;
  return (
    <>
      <button type="button" onClick={() => install(mode, () => setIos(true))}
        className={cx("inline-flex items-center gap-1.5 rounded-full bg-mint-100 px-3 py-2 text-sm font-bold text-reef-800 transition hover:bg-mint-200", className)}>
        <Download className="h-4 w-4" aria-hidden />{t("pwa.install")}
      </button>
      {ios && <IosSheet onClose={() => setIos(false)} />}
    </>
  );
}

const DISMISS_KEY = "reeef.install.dismissed";

/** Registers the service worker and offers installation once on phones (dismissible, remembered for 14 days). */
export function PwaSetup() {
  const { t } = useI18n();
  const mode = useInstallMode();
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  useEffect(() => {
    if (mode === "none" || !matchMedia("(max-width: 767px)").matches) return;
    let last = 0; try { last = Number(localStorage.getItem(DISMISS_KEY) || 0); } catch { /* storage blocked */ }
    if (Date.now() - last < 14 * 86400_000) return;
    const id = window.setTimeout(() => setShow(true), 2500);
    return () => window.clearTimeout(id);
  }, [mode]);
  const dismiss = () => { setShow(false); try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* storage blocked */ } };

  if (!show || mode === "none") return ios ? <IosSheet onClose={() => setIos(false)} /> : null;
  return (
    <>
      <div className="fade-up fixed inset-x-3 z-50 flex items-center gap-3 rounded-2xl border border-reef-100 bg-white/95 p-3 shadow-soft backdrop-blur md:hidden" style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }} role="dialog" aria-label={t("pwa.install")}>
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl" />
        <div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-reef-800">{t("pwa.install")}</p><p className="truncate text-xs text-muted">{t("pwa.installSub")}</p></div>
        <button type="button" onClick={async () => { await install(mode, () => setIos(true)); dismiss(); }} className="rounded-full bg-reef-700 px-4 py-2 text-sm font-bold text-white">{t("pwa.install")}</button>
        <button type="button" onClick={dismiss} className="rounded-full p-1.5 text-muted hover:bg-mint-100" aria-label={t("pwa.close")}><X className="h-4 w-4" /></button>
      </div>
      {ios && <IosSheet onClose={() => setIos(false)} />}
    </>
  );
}
